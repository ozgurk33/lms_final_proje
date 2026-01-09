import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { getOMRResult, validateOMRResult, submitOMRToQuiz } from '../../services/omrService';

const OMRValidationScreen = ({ route, navigation }) => {
    const { sheetId, result: initialResult, requiresValidation } = route.params;

    const [result, setResult] = useState(initialResult);
    const [editedAnswers, setEditedAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!initialResult) {
            loadResult();
        } else {
            // Initialize edited answers with current results
            setEditedAnswers(result.answers);
        }
    }, []);

    const loadResult = async () => {
        try {
            setLoading(true);
            const data = await getOMRResult(sheetId);
            setResult(data.result);
            setEditedAnswers(data.result.answers);
            setLoading(false);
        } catch (error) {
            console.error('Load result error:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to load OMR result');
        }
    };

    const handleAnswerChange = (questionNum, newAnswer) => {
        setEditedAnswers(prev => ({
            ...prev,
            [questionNum]: newAnswer
        }));
    };

    const handleValidateAndSubmit = async () => {
        try {
            setSubmitting(true);

            // First, validate the result if it was edited
            if (JSON.stringify(editedAnswers) !== JSON.stringify(result.answers)) {
                await validateOMRResult(result.id, editedAnswers);
            }

            // Then submit to quiz system
            const submitResult = await submitOMRToQuiz(sheetId);

            setSubmitting(false);

            Alert.alert(
                'Success',
                `OMR sheet submitted successfully!\nScore: ${submitResult.score.toFixed(2)}%\nStatus: ${submitResult.isPassed ? 'Passed ✓' : 'Failed ✗'}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('InstructorHomeScreen')
                    }
                ]
            );
        } catch (error) {
            console.error('Submit error:', error);
            setSubmitting(false);
            Alert.alert('Error', error.response?.data?.error || 'Failed to submit OMR result');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading results...</Text>
            </View>
        );
    }

    if (!result) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No result data available</Text>
            </View>
        );
    }

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return '#4CAF50'; // Green
        if (confidence >= 0.6) return '#FF9800'; // Orange
        return '#F44336'; // Red
    };

    const OPTIONS = ['A', 'B', 'C', 'D'];

    // Only 5 questions for OMR sheet
    const questions = Array.from({ length: 5 }, (_, i) => i + 1);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Validate Answers</Text>
                    {requiresValidation && (
                        <View style={styles.warningBanner}>
                            <Text style={styles.warningText}>
                                ⚠️ Low confidence detected on some answers. Please review.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.legendText}>High Confidence (80%+)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                        <Text style={styles.legendText}>Medium Confidence (60-80%)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                        <Text style={styles.legendText}>Low Confidence (&lt;60%)</Text>
                    </View>
                </View>

                <View style={styles.answersGrid}>
                    {questions.map((questionNum) => {
                        const answer = editedAnswers[questionNum];
                        const confidence = result.confidence?.[questionNum] || 0;
                        const confidenceColor = getConfidenceColor(confidence);

                        return (
                            <View
                                key={questionNum}
                                style={[
                                    styles.questionCard,
                                    { borderLeftColor: confidenceColor, borderLeftWidth: 4 }
                                ]}
                            >
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionNumber}>Q{questionNum}</Text>
                                    <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                                        {(confidence * 100).toFixed(0)}%
                                    </Text>
                                </View>

                                <View style={styles.optionsContainer}>
                                    {OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.optionButton,
                                                answer === option && styles.optionButtonSelected
                                            ]}
                                            onPress={() => handleAnswerChange(questionNum, option)}
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

                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            !answer && styles.optionButtonSelected
                                        ]}
                                        onPress={() => handleAnswerChange(questionNum, null)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                !answer && styles.optionTextSelected
                                            ]}
                                        >
                                            ✗
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleValidateAndSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>✓ Submit to Quiz System</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
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
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    warningBanner: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    warningText: {
        color: '#E65100',
        fontSize: 14,
    },
    legend: {
        backgroundColor: '#fff',
        padding: 12,
        marginTop: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#666',
    },
    answersGrid: {
        padding: 12,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    confidenceText: {
        fontSize: 14,
        fontWeight: '600',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    optionButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    optionButtonSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    optionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
    },
    optionTextSelected: {
        color: '#fff',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
    },
});

export default OMRValidationScreen;
