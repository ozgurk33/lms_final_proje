import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QuizService from '../../services/QuizService';
import CourseService from '../../services/CourseService';

const CreateOMRQuizScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [duration, setDuration] = useState('30');
    const [passingScore, setPassingScore] = useState('60');

    // Correct answers for 10 questions
    const [correctAnswers, setCorrectAnswers] = useState(Array(10).fill('A'));

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await CourseService.getInstructorCourses();
            if (response.success) {
                setCourses(response.data || []);
            } else {
                console.error('Failed to load courses:', response.error);
            }
        } catch (error) {
            console.error('Load courses error:', error);
            Alert.alert('Hata', 'Kurslar yüklenemedi');
        }
    };

    const handleAnswerChange = (questionIndex, answer) => {
        const newAnswers = [...correctAnswers];
        newAnswers[questionIndex] = answer;
        setCorrectAnswers(newAnswers);
    };

    const handleCreateQuiz = async () => {
        // Validation
        if (!title.trim()) {
            Alert.alert('Hata', 'Sınav başlığı gerekli');
            return;
        }

        if (!selectedCourse) {
            Alert.alert('Hata', 'Lütfen bir kurs seçin');
            return;
        }

        try {
            setLoading(true);

            const quizData = {
                title: title.trim(),
                description: description.trim() || `OMR Optik Sınavı - ${title}`,
                courseId: selectedCourse,
                duration: parseInt(duration) || 30,
                passingScore: parseFloat(passingScore) || 60,
                correctAnswers: correctAnswers
            };

            console.log('Creating OMR quiz:', quizData);

            const result = await QuizService.createOMRQuiz(quizData);

            setLoading(false);

            Alert.alert(
                'Başarılı',
                'OMR sınavı oluşturuldu!',
                [
                    {
                        text: 'Tamam',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            setLoading(false);
            console.error('Create quiz error:', error);
            Alert.alert(
                'Hata',
                error.response?.data?.error || 'Sınav oluşturulamadı'
            );
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>OMR Optik Sınavı Oluştur</Text>
                <Text style={styles.subtitle}>
                    10 soruluk çoktan seçmeli (A-B-C-D) optik sınav
                </Text>

                {/* Quiz Title */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Sınav Başlığı *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Örn: Vize Sınavı"
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Açıklama</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Sınav hakkında açıklama (opsiyonel)"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Course Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Kurs *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedCourse}
                            onValueChange={setSelectedCourse}
                            style={styles.picker}
                        >
                            <Picker.Item label="Kurs seçin..." value={null} />
                            {courses.map((course) => (
                                <Picker.Item
                                    key={course.id}
                                    label={course.title}
                                    value={course.id}
                                />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Duration and Passing Score */}
                <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Süre (dk)</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                            placeholder="30"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Geçme Notu (%)</Text>
                        <TextInput
                            style={styles.input}
                            value={passingScore}
                            onChangeText={setPassingScore}
                            keyboardType="numeric"
                            placeholder="60"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Correct Answers Section */}
                <View style={styles.answersSection}>
                    <Text style={styles.sectionTitle}>Doğru Cevaplar</Text>
                    <Text style={styles.sectionSubtitle}>
                        Her soru için doğru şıkkı seçin
                    </Text>

                    {correctAnswers.map((answer, index) => (
                        <View key={index} style={styles.answerRow}>
                            <Text style={styles.questionNumber}>Soru {index + 1}:</Text>
                            <View style={styles.optionsContainer}>
                                {['A', 'B', 'C', 'D'].map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.optionButton,
                                            answer === option && styles.optionButtonSelected
                                        ]}
                                        onPress={() => handleAnswerChange(index, option)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                answer === option && styles.optionTextSelected
                                            ]}
                                        >
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    style={[styles.createButton, loading && styles.createButtonDisabled]}
                    onPress={handleCreateQuiz}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.createButtonText}>Sınavı Oluştur</Text>
                    )}
                </TouchableOpacity>
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
        marginBottom: 8,
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    answersSection: {
        marginTop: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    answerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        width: 80,
    },
    optionsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    optionButton: {
        width: 45,
        height: 45,
        borderRadius: 23,
        borderWidth: 2,
        borderColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    optionButtonSelected: {
        backgroundColor: '#007AFF',
    },
    optionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    optionTextSelected: {
        color: '#fff',
    },
    createButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CreateOMRQuizScreen;
