import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QuizService from '../../services/QuizService';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';
import SimpleOMRScanner from '../../components/SimpleOMRScanner';

const OMRScannerScreen = ({ navigation, route }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [liveDetectionMode, setLiveDetectionMode] = useState(false); // Yeni state

    // Get quiz from route params
    const { quizId, quizTitle } = route.params || {};

    // Selection states
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [quiz, setQuiz] = useState(null);

    useEffect(() => {
        if (quizId) {
            loadQuizAndStudents();
        }
    }, [quizId]);

    const loadQuizAndStudents = async () => {
        try {
            // Get quiz details to find courseId
            const quizResponse = await QuizService.getById(quizId);
            if (quizResponse.success && quizResponse.data) {
                const quizData = quizResponse.data.quiz || quizResponse.data;
                setQuiz(quizData);

                // Get enrolled students from the course
                if (quizData.courseId) {
                    const enrollmentsResponse = await api.get(`/api/courses/${quizData.courseId}/enrollments`);
                    const enrollments = enrollmentsResponse.data.enrollments || enrollmentsResponse.data || [];

                    // Extract student info from enrollments
                    const studentsList = enrollments.map(enrollment => ({
                        id: enrollment.user?.id || enrollment.userId,
                        fullName: enrollment.user?.fullName || 'Unknown Student',
                        email: enrollment.user?.email || ''
                    }));

                    setStudents(studentsList);
                }
            }
        } catch (error) {
            console.error('Load quiz and students error:', error);
            Alert.alert('Hata', 'Quiz ve öğrenciler yüklenemedi');
        }
    };

    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photo = await cameraRef.takePictureAsync({
                    quality: 1,
                    base64: false,
                    skipProcessing: false
                });
                setCapturedImage(photo.uri);
            } catch (error) {
                console.error('Camera error:', error);
                Alert.alert('Error', 'Failed to capture image');
            }
        }
    };

    const pickImageFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                setCapturedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Fotoğrafı paylaşım ile dışarı aktar (WhatsApp, Drive, Email vb.)
    const handleSaveForManualProcess = async () => {
        if (!capturedImage) {
            Alert.alert('Hata', 'Önce fotoğraf çekin veya seçin');
            return;
        }

        try {
            setUploading(true);
            console.log('💾 Preparing image for sharing...');

            // Resize edip PNG olarak kaydet
            const manipResult = await ImageManipulator.manipulateAsync(
                capturedImage,
                [{ resize: { width: 1654 } }],
                { compress: 1, format: ImageManipulator.SaveFormat.PNG }
            );

            console.log('✅ Image prepared:', manipResult.uri);

            // Paylaşım destekleniyor mu kontrol et
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor');
                setUploading(false);
                return;
            }

            setUploading(false);

            // Paylaşım menüsünü aç - direkt manipüle edilmiş dosyayı paylaş
            await Sharing.shareAsync(manipResult.uri, {
                mimeType: 'image/png',
                dialogTitle: 'OMR Fotoğrafını Aktar'
            });

            const filename = manipResult.uri.split('/').pop();
            Alert.alert(
                '📤 Aktarım Tamamlandı!',
                `💻 PC'de terminalde çalıştır:\n\ncd omr-algorithm\npython omr_answer_reader.py ${filename}`,
                [{ text: 'Tamam' }]
            );

        } catch (error) {
            console.error('❌ Share error:', error);
            setUploading(false);
            Alert.alert('Hata', error.message || 'Paylaşım başarısız');
        }
    };

    const handleUploadAndProcess = async () => {
        if (!capturedImage) {
            Alert.alert('Error', 'Please capture or select an image first');
            return;
        }

        if (!selectedStudent) {
            Alert.alert('Error', 'Please select a student');
            return;
        }

        if (!quizId) {
            Alert.alert('Error', 'Quiz ID is missing');
            return;
        }

        try {
            setUploading(true);
            setProcessing(true);

            console.log('🎯 Processing OMR - Simple Base64 Approach');
            console.log('📸 Image URI:', capturedImage);

            // Resize image to reduce payload size (OMR doesn't need high res)
            const manipResult = await ImageManipulator.manipulateAsync(
                capturedImage,
                [{ resize: { width: 1200 } }], // Max width 1200px - enough for OMR
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            console.log('✅ Got base64, length:', manipResult.base64.length);

            // Send as simple JSON
            const response = await api.post('/api/omr/process-frame-live', {
                imageBase64: manipResult.base64
            });

            console.log('✅ Response received:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.error || 'Processing failed');
            }

            setUploading(false);
            setProcessing(false);

            // Grade the OMR sheet
            const gradeResult = await QuizService.gradeOMRSheet({
                quizId: quizId,
                studentId: selectedStudent,
                answers: response.data.answers
            });

            console.log('✅ Grade result:', gradeResult);

            // Navigate to results
            const student = students.find(s => s.id === selectedStudent);
            navigation.navigate('OMRResults', {
                result: gradeResult,
                quizTitle: quizTitle || quiz?.title || 'OMR Quiz',
                studentName: student?.fullName || 'Student',
                omrData: response.data
            });

        } catch (error) {
            console.error('❌ Error:', error);
            console.error('❌ Message:', error.message);
            setUploading(false);
            setProcessing(false);
            Alert.alert('Error', error.message || 'Failed to process OMR');
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setLiveDetectionMode(false); // Reset mode
    };

    const handleLiveCapture = (imageUri) => {
        console.log('📸 Live capture:', imageUri);
        setCapturedImage(imageUri);
        setLiveDetectionMode(false); // Switch back to preview mode
    };

    const handleCancelLive = () => {
        setLiveDetectionMode(false);
    };

    if (!permission) {
        return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No access to camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
                    <Text style={styles.buttonText}>Pick from Gallery</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>OMR Tarama</Text>
                    <Text style={styles.subtitle}>
                        {quizTitle || 'OMR Quiz'} için öğrenci formu tara
                    </Text>
                </View>

                {/* Student Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Öğrenci Seçin</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedStudent}
                            onValueChange={setSelectedStudent}
                            style={styles.picker}
                        >
                            <Picker.Item label="Öğrenci seçin..." value={null} />
                            {students.map((student) => (
                                <Picker.Item
                                    key={student.id}
                                    label={`${student.fullName} (${student.email})`}
                                    value={student.id}
                                />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Camera Preview or Captured Image */}
                {!capturedImage ? (
                    liveDetectionMode ? (
                        /* Simple OMR Scanner - Her 1 saniye perspective gösteriyor */
                        <SimpleOMRScanner
                            onImageSelected={handleLiveCapture}
                            onCancel={handleCancelLive}
                        />
                    ) : (
                        /* Standard Camera Mode */
                        <View style={styles.cameraContainer}>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                ref={ref => setCameraRef(ref)}
                            />

                            {/* Guidance overlay outside camera */}
                            <View style={styles.cameraGuidance}>
                                <Text style={styles.overlayText}>
                                    Optik formu çerçeve içine yerleştirin
                                </Text>
                            </View>

                            <View style={styles.cameraControls}>
                                <TouchableOpacity
                                    style={styles.liveDetectButton}
                                    onPress={() => setLiveDetectionMode(true)}
                                >
                                    <Text style={styles.galleryButtonText}>🎯 Canlı Algılama</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                                    <View style={styles.captureButtonInner} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
                                    <Text style={styles.galleryButtonText}>📁 Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                ) : (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: capturedImage }} style={styles.previewImage} />

                        <View style={styles.previewControls}>
                            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                                <Text style={styles.buttonText}>🔄</Text>
                            </TouchableOpacity>

                            {/* Manuel işlem için kaydet butonu */}
                            <TouchableOpacity
                                style={[styles.saveButton, uploading && styles.buttonDisabled]}
                                onPress={handleSaveForManualProcess}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.buttonText}>💾 Kaydet</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.processButton,
                                    (!selectedStudent || !quizId) && styles.buttonDisabled
                                ]}
                                onPress={handleUploadAndProcess}
                                disabled={!selectedStudent || !quizId || uploading || processing}
                            >
                                {uploading || processing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>✓ İşle</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {(uploading || processing) && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>
                            {uploading ? 'Uploading image...' : 'Processing OMR sheet...'}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    selectorContainer: {
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    picker: {
        height: 50,
    },
    quizInfoContainer: {
        marginBottom: 16,
    },
    quizInfoBox: {
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#1976D2',
    },
    quizTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    quizSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    cameraContainer: {
        height: 500,
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: 20,
        justifyContent: 'center',
    },
    cameraGuidance: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    overlayText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 8,
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        padding: 4,
    },
    captureButtonInner: {
        flex: 1,
        borderRadius: 32,
        backgroundColor: '#007AFF',
    },
    galleryButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#555',
        borderRadius: 8,
    },
    liveDetectButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
    },
    galleryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    previewContainer: {
        marginTop: 16,
    },
    previewImage: {
        width: '100%',
        height: 500,
        borderRadius: 12,
        resizeMode: 'contain',
        backgroundColor: '#000',
    },
    previewControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    retakeButton: {
        flex: 0.8,
        marginRight: 4,
        paddingVertical: 16,
        backgroundColor: '#666',
        borderRadius: 8,
        alignItems: 'center',
    },
    processButton: {
        flex: 1,
        marginLeft: 4,
        paddingVertical: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButton: {
        flex: 1.5,
        marginHorizontal: 4,
        paddingVertical: 16,
        backgroundColor: '#FF9800',
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default OMRScannerScreen;
