import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from 'react-native';
import CourseService from '../../services/CourseService';
import QuizService from '../../services/QuizService';

const StudentCourseDetails = ({ route, navigation }) => {
    const { courseId } = route.params;
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourseData();
    }, []);

    const loadCourseData = async () => {
        setLoading(true);

        // Load course details
        const courseResult = await CourseService.getCourseDetails(courseId);
        if (courseResult.success) {
            setCourse(courseResult.data);
        }

        // Load course modules/content
        const modulesResult = await CourseService.getCourseModules(courseId);
        if (modulesResult.success) {
            setModules(modulesResult.data);
        }

        // Load quizzes
        const quizzesResult = await QuizService.getCourseQuizzes(courseId);
        if (quizzesResult.success) {
            setQuizzes(quizzesResult.data);
        }

        setLoading(false);
    };

    const handleQuizPress = (quiz) => {
        Alert.alert(
            'Sınav Girişi',
            'Sınava giriş mobil cihazlardan yapılamaz. Lütfen Web veya Desktop uygulaması kullanın.',
            [{ text: 'Tamam' }]
        );
    };

    const handleViewQuizHistory = () => {
        navigation.navigate('QuizHistory', { courseId });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Course Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{course?.title}</Text>
                <Text style={styles.description}>{course?.description}</Text>
                <Text style={styles.instructor}>
                    Eğitmen: {course?.instructor?.name}
                </Text>
            </View>

            {/* Course Content */}
            {modules && modules.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kurs İçeriği</Text>
                    {modules.map((module, index) => (
                        <View key={index} style={styles.moduleCard}>
                            <Text style={styles.moduleName}>{module.name}</Text>
                            {module.items?.map((item, itemIndex) => (
                                <View key={itemIndex} style={styles.contentItem}>
                                    <Text style={styles.itemType}>
                                        {item.type === 'VIDEO' ? '🎥' : '📄'}
                                    </Text>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            {/* Quizzes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sınavlar</Text>
                {quizzes && quizzes.length > 0 ? (
                    <>
                        {quizzes.map((quiz) => (
                            <TouchableOpacity
                                key={quiz.id}
                                style={styles.quizCard}
                                onPress={() => handleQuizPress(quiz)}>
                                <Text style={styles.quizTitle}>{quiz.title}</Text>
                                <View style={styles.quizInfo}>
                                    <Text style={styles.quizDuration}>⏱ {quiz.duration} dk</Text>
                                    <Text style={styles.quizStatus}>
                                        {quiz.status === 'ACTIVE' ? '🟢 Aktif' : '🔴 Pasif'}
                                    </Text>
                                </View>
                                <View style={styles.warningBox}>
                                    <Text style={styles.warningText}>
                                        ⚠️ Web veya Desktop gerekli
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.historyButton}
                            onPress={handleViewQuizHistory}>
                            <Text style={styles.historyButtonText}>
                                Sınav Geçmişini Görüntüle
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <Text style={styles.emptyText}>Henüz sınav eklenmemiş.</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    instructor: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    moduleCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    moduleName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    contentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    itemType: {
        fontSize: 18,
        marginRight: 8,
    },
    itemTitle: {
        fontSize: 14,
        color: '#555',
    },
    quizCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    quizTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    quizInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    quizDuration: {
        fontSize: 13,
        color: '#666',
    },
    quizStatus: {
        fontSize: 13,
        color: '#666',
    },
    warningBox: {
        backgroundColor: '#FFF3CD',
        padding: 8,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#FFC107',
    },
    warningText: {
        fontSize: 12,
        color: '#856404',
        fontWeight: '500',
    },
    historyButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    historyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
});

export default StudentCourseDetails;
