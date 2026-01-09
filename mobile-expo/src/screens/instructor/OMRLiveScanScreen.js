import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import OMRLiveEdgeDetector from '../../components/OMRLiveEdgeDetector';
import api from '../../utils/api';

/**
 * OMR Live Scan Screen
 * Canlı kamera ile optik form tarama
 * - Real-time kenar algılama
 * - Otomatik bubble tespit
 */
const OMRLiveScanScreen = ({ navigation, route }) => {
    const [mode, setMode] = useState('detect'); // 'detect' | 'preview' | 'processing'
    const [capturedImage, setCapturedImage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const { quizId, quizTitle } = route.params || {};

    const handleCapture = (imageUri) => {
        console.log('📸 Image captured:', imageUri);
        setCapturedImage(imageUri);
        setMode('preview');
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setResult(null);
        setMode('detect');
    };

    const handleProcess = async () => {
        if (!capturedImage) return;

        try {
            setProcessing(true);
            setMode('processing');

            // Backend'e yüksek kaliteli fotoğrafı gönder
            const formData = new FormData();
            formData.append('frame', {
                uri: capturedImage,
                type: 'image/jpeg',
                name: 'omr_sheet.jpg'
            });

            const response = await api.post('/api/omr/process-frame-live', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // 30 saniye
            });

            console.log('✅ OMR Processing result:', response.data);

            if (response.data.success) {
                setResult(response.data);
                Alert.alert(
                    '✅ Başarılı!',
                    `${response.data.questions_detected} soru tespit edildi\n${response.data.summary.answered} cevap okundu`,
                    [{ text: 'Tamam' }]
                );
            } else {
                Alert.alert('Hata', response.data.error || 'İşlem başarısız');
                handleRetake();
            }

        } catch (error) {
            console.error('❌ Processing error:', error);
            Alert.alert(
                'Hata',
                error.response?.data?.error || 'Form işlenirken hata oluştu'
            );
            handleRetake();
        } finally {
            setProcessing(false);
        }
    };

    const handleSubmit = () => {
        if (!result) return;

        // Navigate to results or submit
        Alert.alert(
            'Sonuçları Kaydet',
            'Cevaplar backend\'e kaydedilsin mi?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Kaydet',
                    onPress: () => {
                        // TODO: Backend'e sonuçları kaydet
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    // Mode: Detect (Canlı kenar algılama)
    if (mode === 'detect') {
        return (
            <OMRLiveEdgeDetector
                onCapture={handleCapture}
                onCancel={handleCancel}
            />
        );
    }

    // Mode: Preview veya Processing
    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {mode === 'processing' ? 'İşleniyor...' : 'Önizleme'}
                    </Text>
                    {quizTitle && (
                        <Text style={styles.subtitle}>{quizTitle}</Text>
                    )}
                </View>

                {/* Preview Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: capturedImage }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Processing Indicator */}
                {processing && (
                    <View style={styles.processingCard}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.processingText}>
                            Optik form işleniyor...
                        </Text>
                        <Text style={styles.processingSubtext}>
                            Kağıt kenarları tespiti, bubble okuma
                        </Text>
                    </View>
                )}

                {/* Result */}
                {result && !processing && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>📊 Sonuçlar</Text>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Tespit Edilen Soru:</Text>
                            <Text style={styles.resultValue}>
                                {result.questions_detected}
                            </Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Cevaplanan:</Text>
                            <Text style={styles.resultValue}>
                                {result.summary.answered}
                            </Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Boş:</Text>
                            <Text style={styles.resultValue}>
                                {result.summary.blank}
                            </Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Bubble Sayısı:</Text>
                            <Text style={styles.resultValue}>
                                {result.bubbles_count}
                            </Text>
                        </View>

                        {/* Answers */}
                        <View style={styles.answersSection}>
                            <Text style={styles.answersTitle}>Cevaplar:</Text>
                            <View style={styles.answersGrid}>
                                {Object.entries(result.answers || {}).map(([qNum, answer]) => (
                                    <View key={qNum} style={styles.answerChip}>
                                        <Text style={styles.answerText}>
                                            {qNum}: {answer || '-'}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={handleRetake}
                        disabled={processing}
                    >
                        <Text style={styles.buttonText}>🔄 Tekrar Çek</Text>
                    </TouchableOpacity>

                    {!result && !processing && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonPrimary]}
                            onPress={handleProcess}
                        >
                            <Text style={styles.buttonText}>✓ İşle</Text>
                        </TouchableOpacity>
                    )}

                    {result && !processing && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSuccess]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.buttonText}>💾 Kaydet</Text>
                        </TouchableOpacity>
                    )}
                </View>
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
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    imageContainer: {
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: 400,
    },
    processingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    processingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
    },
    processingSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    resultLabel: {
        fontSize: 16,
        color: '#666',
    },
    resultValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    answersSection: {
        marginTop: 20,
    },
    answersTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    answersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    answerChip: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    answerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    controls: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#007AFF',
    },
    buttonSecondary: {
        backgroundColor: '#666',
    },
    buttonSuccess: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OMRLiveScanScreen;
