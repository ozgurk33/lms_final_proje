import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import api from '../../utils/api';

const QuizHistory = ({ route, navigation }) => {
    const { courseId, quizId } = route.params || {};
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizHistory();
    }, [quizId]);

    const fetchQuizHistory = async () => {
        try {
            setLoading(true);

            if (quizId) {
                // Get specific quiz attempts
                const response = await api.get(`/api/quizzes/${quizId}/results`);
                const quizAttempts = (response.data.attempts || []).map(a => ({
                    ...a,
                    quizTitle: response.data.quiz?.title || 'Quiz',
                    quizId: quizId,
                }));
                setAttempts(quizAttempts);
            } else if (courseId) {
                // Get all quizzes for course and their attempts
                const courseResponse = await api.get(`/api/courses/${courseId}`);
                const quizzes = courseResponse.data.course?.quizzes || [];

                let allAttempts = [];
                for (const quiz of quizzes) {
                    try {
                        const response = await api.get(`/api/quizzes/${quiz.id}/results`);
                        if (response.data.attempts && response.data.attempts.length > 0) {
                            allAttempts.push(...response.data.attempts.map(a => ({
                                ...a,
                                quizTitle: quiz.title,
                                quizId: quiz.id,
                            })));
                        }
                    } catch (err) {
                        // No attempts for this quiz
                    }
                }

                // Sort by date
                allAttempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
                setAttempts(allAttempts);
            } else {
                // Get all user's quiz attempts across all courses
                const quizzesResponse = await api.get('/api/quizzes', { params: { limit: 100 } });
                const allQuizzes = quizzesResponse.data.quizzes || [];

                let allAttempts = [];
                for (const quiz of allQuizzes) {
                    try {
                        const response = await api.get(`/api/quizzes/${quiz.id}/results`);
                        if (response.data.attempts && response.data.attempts.length > 0) {
                            allAttempts.push(...response.data.attempts.map(a => ({
                                ...a,
                                quizTitle: quiz.title,
                                quizId: quiz.id,
                            })));
                        }
                    } catch (err) {
                        // No attempts
                    }
                }

                allAttempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
                setAttempts(allAttempts);
            }
        } catch (error) {
            console.error('Failed to fetch quiz history:', error);
            Alert.alert('Hata', 'Sınav geçmişi yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const renderAttempt = ({ item }) => {
        const isPassed = item.isPassed || item.score >= (item.passingScore || 50);
        const scoreColor = isPassed ? '#4CAF50' : '#F44336';

        return (
            <View
                style={styles.attemptCard}
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`${item.quizTitle} sınavı. Puan yüzde ${item.score?.toFixed(0)}. ${isPassed ? 'Geçti' : 'Kaldı'}. ${new Date(item.completedAt).toLocaleDateString('tr-TR')}`}
            >
                <View style={styles.attemptHeader}>
                    <Text
                        style={styles.quizTitle}
                        numberOfLines={1}
                        accessibilityRole="header"
                    >
                        {item.quizTitle}
                    </Text>
                    <View
                        style={[styles.scoreBadge, { backgroundColor: scoreColor }]}
                        accessible={false}
                    >
                        <Text style={styles.scoreText}>{item.score?.toFixed(0)}%</Text>
                    </View>
                </View>

                <View style={styles.attemptDetails} accessible={false}>
                    <Text style={styles.detailText}>
                        📅 {new Date(item.completedAt).toLocaleDateString('tr-TR')}
                    </Text>
                    <Text style={styles.detailText}>
                        ⏱️ {new Date(item.completedAt).toLocaleTimeString('tr-TR')}
                    </Text>
                </View>

                <View style={styles.statusRow} accessible={false}>
                    <View style={[styles.statusBadge, { backgroundColor: isPassed ? '#e8f5e9' : '#ffebee' }]}>
                        <Text style={[styles.statusText, { color: scoreColor }]}>
                            {isPassed ? '✓ Geçti' : '✗ Kaldı'}
                        </Text>
                    </View>

                    {item.grade && (
                        <Text style={styles.gradeText}>
                            {item.grade} / {item.totalPoints || 100}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {attempts.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Henüz sınav girişi yok</Text>
                    <Text style={styles.emptySubtext}>
                        Sınavlara Web veya Desktop uygulamasından girebilirsiniz
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Sınav Geçmişi</Text>
                        <Text style={styles.headerSubtitle}>
                            Toplam {attempts.length} deneme
                        </Text>
                    </View>

                    <FlatList
                        data={attempts}
                        renderItem={renderAttempt}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    listContainer: {
        padding: 16,
    },
    attemptCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    attemptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    quizTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    attemptDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    detailText: {
        fontSize: 13,
        color: '#666',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    gradeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default QuizHistory;
