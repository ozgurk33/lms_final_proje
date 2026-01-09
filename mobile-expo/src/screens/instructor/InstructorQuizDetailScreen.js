import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import api from '../../utils/api';

const InstructorQuizDetailScreen = ({ route, navigation }) => {
    const { quizId } = route.params;
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [omrSheets, setOmrSheets] = useState([]);

    useEffect(() => {
        loadQuizDetails();
        loadOMRSheets();
    }, []);

    const loadQuizDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/quizzes/${quizId}`);
            setQuiz(response.data.quiz);
            setLoading(false);
        } catch (error) {
            console.error('Load quiz error:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to load quiz details');
        }
    };

    const loadOMRSheets = async () => {
        try {
            const response = await api.get(`/omr/sheets?quizId=${quizId}`);
            setOmrSheets(response.data.sheets || []);
        } catch (error) {
            console.error('Load OMR sheets error:', error);
        }
    };

    const handleScanAnswerSheet = () => {
        navigation.navigate('OMRScanner', { quizId, quiz });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!quiz) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Quiz not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Quiz Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{quiz.title}</Text>
                {quiz.isOMR && (
                    <View style={styles.omrBadge}>
                        <Text style={styles.omrBadgeText}>📄 OMR Quiz</Text>
                    </View>
                )}
                {quiz.description && (
                    <Text style={styles.description}>{quiz.description}</Text>
                )}
            </View>

            {/* Quiz Info */}
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Questions:</Text>
                    <Text style={styles.infoValue}>{quiz.questions?.length || 0}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Passing Score:</Text>
                    <Text style={styles.infoValue}>{quiz.passingScore}%</Text>
                </View>
                {quiz.duration && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Duration:</Text>
                        <Text style={styles.infoValue}>{quiz.duration} minutes</Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Published:</Text>
                    <Text style={styles.infoValue}>{quiz.isPublished ? 'Yes ✓' : 'No ✗'}</Text>
                </View>
            </View>

            {/* Answer Key (for OMR quizzes) */}
            {quiz.isOMR && quiz.questions && (
                <View style={styles.answerKeyCard}>
                    <Text style={styles.sectionTitle}>Answer Key</Text>
                    <View style={styles.answerKeyGrid}>
                        {quiz.questions.map((question, index) => (
                            <View key={question.id} style={styles.answerKeyItem}>
                                <Text style={styles.questionNum}>Q{index + 1}:</Text>
                                <Text style={styles.answerText}>
                                    {typeof question.correctAnswer === 'string'
                                        ? question.correctAnswer
                                        : JSON.stringify(question.correctAnswer)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Scan Button (for OMR quizzes) */}
            {quiz.isOMR && (
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={handleScanAnswerSheet}
                    >
                        <Text style={styles.scanButtonText}>📸 Scan Answer Sheet</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* OMR Sheets History */}
            {quiz.isOMR && omrSheets.length > 0 && (
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Scanned Sheets ({omrSheets.length})</Text>
                    {omrSheets.map((sheet) => (
                        <View key={sheet.id} style={styles.sheetCard}>
                            <View style={styles.sheetHeader}>
                                <Text style={styles.sheetStudent}>
                                    {sheet.student?.fullName || 'Unknown Student'}
                                </Text>
                                <Text style={[
                                    styles.sheetStatus,
                                    { color: getStatusColor(sheet.status) }
                                ]}>
                                    {sheet.status}
                                </Text>
                            </View>
                            {sheet.result && (
                                <View style={styles.sheetResult}>
                                    <Text style={styles.sheetResultText}>
                                        Validated: {sheet.result.validated ? 'Yes ✓' : 'No'}
                                    </Text>
                                    {sheet.result.validated && (
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('OMRValidation', {
                                                sheetId: sheet.id,
                                                result: sheet.result,
                                                requiresValidation: false
                                            })}
                                        >
                                            <Text style={styles.viewLink}>View Details →</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {/* Questions List */}
            <View style={styles.questionsSection}>
                <Text style={styles.sectionTitle}>Questions</Text>
                {quiz.questions?.map((question, index) => (
                    <View key={question.id} style={styles.questionCard}>
                        <Text style={styles.questionTitle}>Question {index + 1}</Text>
                        <Text style={styles.questionContent}>{question.content}</Text>
                        {question.type === 'MULTIPLE_CHOICE' && question.options && (
                            <View style={styles.optionsList}>
                                {Object.entries(question.options).map(([key, value]) => (
                                    <Text key={key} style={styles.optionText}>
                                        {key}) {value}
                                    </Text>
                                ))}
                            </View>
                        )}
                        <Text style={styles.questionPoints}>{question.points} points</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const getStatusColor = (status) => {
    const colors = {
        PENDING: '#FF9800',
        PROCESSING: '#2196F3',
        COMPLETED: '#4CAF50',
        VALIDATION: '#FFC107',
        SUBMITTED: '#9C27B0',
        FAILED: '#F44336'
    };
    return colors[status] || '#666';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    omrBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
    },
    omrBadgeText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    infoCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 16,
        color: '#666',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    answerKeyCard: {
        backgroundColor: '#FFF9C4',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FBC02D',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    answerKeyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    answerKeyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
    },
    questionNum: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginRight: 8,
    },
    answerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    actionSection: {
        padding: 16,
    },
    scanButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    historySection: {
        padding: 16,
    },
    sheetCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sheetStudent: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sheetStatus: {
        fontSize: 14,
        fontWeight: '600',
    },
    sheetResult: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sheetResultText: {
        fontSize: 14,
        color: '#666',
    },
    viewLink: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    questionsSection: {
        padding: 16,
    },
    questionCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    questionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    questionContent: {
        fontSize: 15,
        color: '#666',
        marginBottom: 12,
        lineHeight: 22,
    },
    optionsList: {
        marginBottom: 12,
    },
    optionText: {
        fontSize: 14,
        color: '#666',
        paddingVertical: 4,
    },
    questionPoints: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
    },
});

export default InstructorQuizDetailScreen;
