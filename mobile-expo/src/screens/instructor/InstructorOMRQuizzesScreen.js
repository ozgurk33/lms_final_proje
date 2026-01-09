import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import QuizService from '../../services/QuizService';

const InstructorOMRQuizzesScreen = ({ navigation }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            const response = await QuizService.getOMRQuizzes();
            setQuizzes(response.quizzes || []);
        } catch (error) {
            console.error('Load OMR quizzes error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadQuizzes();
        setRefreshing(false);
    };

    const renderQuizItem = ({ item }) => (
        <View style={styles.quizCard}>
            <View style={styles.quizHeader}>
                <Text style={styles.quizTitle}>{item.title}</Text>
                <Text style={styles.courseName}>{item.course?.title || 'No Course'}</Text>
            </View>
            <View style={styles.quizStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Sorular:</Text>
                    <Text style={styles.statValue}>{item._count?.questions || 0}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Tarama:</Text>
                    <Text style={styles.statValue}>{item._count?.attempts || 0}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('OMRScanner', {
                    quizId: item.id,
                    quizTitle: item.title
                })}
            >
                <Text style={styles.scanButtonText}>📄 Tara</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>OMR Optik Sınavları</Text>
            {loading && quizzes.length === 0 ? (
                <Text style={styles.emptyText}>Yükleniyor...</Text>
            ) : quizzes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Henüz OMR sınavı oluşturulmamış</Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreateOMRQuiz')}
                    >
                        <Text style={styles.createButtonText}>+ OMR Sınavı Oluştur</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={quizzes}
                    renderItem={renderQuizItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    listContainer: {
        padding: 16,
    },
    quizCard: {
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
    quizHeader: {
        marginBottom: 12,
    },
    quizTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    courseName: {
        fontSize: 14,
        color: '#666',
    },
    quizStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    scanButton: {
        backgroundColor: '#FF9800',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#9C27B0',
        padding: 16,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default InstructorOMRQuizzesScreen;
