import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import QuizService from '../../services/QuizService';

const QuizHistory = ({ route }) => {
    const { courseId } = route.params;
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuizHistory();
    }, []);

    const loadQuizHistory = async () => {
        setLoading(true);
        // For now, we'll fetch all quizzes and their attempts
        // In a real app, you might have a specific endpoint for this
        const quizzesResult = await QuizService.getCourseQuizzes(courseId);

        if (quizzesResult.success) {
            const allAttempts = [];
            for (const quiz of quizzesResult.data) {
                const historyResult = await QuizService.getQuizHistory(quiz.id);
                if (historyResult.success && historyResult.data) {
                    historyResult.data.forEach(attempt => {
                        allAttempts.push({
                            ...attempt,
                            quizTitle: quiz.title,
                        });
                    });
                }
            }
            setAttempts(allAttempts);
        }
        setLoading(false);
    };

    const renderAttempt = ({ item }) => (
        <View style={styles.attemptCard}>
            <Text style={styles.quizTitle}>{item.quizTitle}</Text>
            <View style={styles.attemptInfo}>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Puan:</Text>
                    <Text style={styles.scoreValue}>
                        {item.score || 0} / {item.totalPoints || 100}
                    </Text>
                </View>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                        {new Date(item.submittedAt || item.createdAt).toLocaleDateString(
                            'tr-TR'
                        )}
                    </Text>
                </View>
            </View>
            <View style={styles.statusBar}>
                <Text
                    style={[
                        styles.statusText,
                        item.status === 'GRADED' && styles.statusGraded,
                    ]}>
                    {item.status === 'GRADED' ? '✓ Değerlendirildi' : '⏳ Beklemede'}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={attempts}
                renderItem={renderAttempt}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Henüz sınav geçmişiniz bulunmuyor.
                        </Text>
                    </View>
                }
            />
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
    listContent: {
        padding: 16,
    },
    attemptCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quizTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    attemptInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    scoreValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    dateContainer: {},
    dateText: {
        fontSize: 13,
        color: '#999',
    },
    statusBar: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    statusText: {
        fontSize: 13,
        color: '#FFC107',
        fontWeight: '500',
    },
    statusGraded: {
        color: '#4CAF50',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
});

export default QuizHistory;
