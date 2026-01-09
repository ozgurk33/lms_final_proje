import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import CourseService from '../../services/CourseService';
import QuizService from '../../services/QuizService';
import progressService from '../../services/progressService';

const StudentCourseDetails = ({ route, navigation }) => {
    const { courseId } = route.params;
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState({}); // moduleId -> progress %

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const result = await CourseService.getById(courseId);
            if (result.success) {
                setCourse(result.data.course);
                // Fetch progress for modules
                if (result.data.course?.modules) {
                    await fetchProgress(result.data.course.modules);
                }
            } else {
                Alert.alert('Hata', result.error);
            }
        } catch (error) {
            console.error('Failed to fetch course details:', error);
            Alert.alert('Hata', 'Kurs detayları yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async (modules) => {
        const newProgressData = {};

        for (const module of modules) {
            const result = await progressService.getProgress(module.id);
            if (result.success && result.data?.progress) {
                const prog = result.data.progress;
                let percentage = 0;

                const hasVideo = !!module.videoUrl;
                const hasPDF = !!module.pdfUrl;

                if (hasVideo && hasPDF) {
                    if (prog.videoCompleted) percentage += 50;
                    if (prog.pdfCompleted) percentage += 50;
                } else if (hasVideo) {
                    if (prog.videoCompleted) percentage = 100;
                } else if (hasPDF) {
                    if (prog.pdfCompleted) percentage = 100;
                }

                newProgressData[module.id] = percentage;
            } else {
                newProgressData[module.id] = 0;
            }
        }

        setProgressData(newProgressData);
    };

    const handleQuizPress = (quiz) => {
        // Show restriction message - no exam entry on mobile
        Alert.alert(
            'Sınav Girişi',
            'Sınavlara mobil cihazdan giriş yapılamaz. Lütfen Web veya Desktop uygulamasını kullanın.',
            [
                {
                    text: 'Sınav Geçmişini Gör',
                    onPress: () =>
                        navigation.navigate('QuizHistory', { courseId, quizId: quiz.id }),
                },
                { text: 'Tamam' },
            ]
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

    if (!course) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Kurs bulunamadı</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Course Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{course.title}</Text>
                <Text style={styles.instructor}>
                    Eğitmen: {course.instructor?.fullName || 'Bilinmiyor'}
                </Text>
                {course.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{course.category}</Text>
                    </View>
                )}
                {course.description && (
                    <Text style={styles.description}>{course.description}</Text>
                )}
            </View>

            {/* Modules */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Modüller</Text>
                {course.modules && course.modules.length > 0 ? (
                    course.modules.map((module, index) => (
                        <TouchableOpacity
                            key={module.id}
                            style={styles.moduleItem}
                            onPress={() => {
                                navigation.navigate('ModuleDetail', {
                                    module: module,
                                    courseTitle: course.title,
                                });
                            }}
                            accessibilityRole="summary"
                            accessibilityLabel={`Modül ${index + 1}: ${module.title}`}
                            accessibilityHint={
                                module.videoUrl ? 'Video izlemek için dokunun' :
                                    module.pdfUrl ? 'PDF görüntülemek için dokunun' :
                                        'İçeriği görmek için dokunun'
                            }
                        >
                            <Text
                                style={styles.moduleTitle}
                                accessibilityRole="header"
                            >
                                {index + 1}. {module.title}
                            </Text>
                            {module.content && (
                                <Text style={styles.moduleContent} numberOfLines={3}>
                                    {module.content.replace(/<[^>]*>/g, '')}
                                </Text>
                            )}

                            {/* Progress Indicator */}
                            <View style={styles.progressIndicator}>
                                <View style={styles.progressBarBackground}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${progressData[module.id] || 0}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>İlerleme: {progressData[module.id] || 0}%</Text>
                            </View>

                            {module.videoUrl && (
                                <View style={styles.videoBadge}>
                                    <Text style={styles.videoBadgeText}>📹 Video mevcut</Text>
                                </View>
                            )}
                            {module.pdfUrl && (
                                <View style={styles.pdfBadge}>
                                    <Text style={styles.pdfBadgeText}>📄 PDF mevcut</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Henüz modül eklenmemiş</Text>
                )}
            </View>

            {/* Quizzes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sınavlar</Text>
                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                        ⚠️ Sınavlara mobil cihazdan giriş yapılamaz
                    </Text>
                    <Text style={styles.warningSubtext}>
                        Sınavlar için Web veya Desktop uygulamasını kullanın
                    </Text>
                </View>

                {course.quizzes && course.quizzes.length > 0 ? (
                    course.quizzes.map((quiz) => {
                        const now = new Date();
                        const startDate = quiz.startDate ? new Date(quiz.startDate) : null;
                        const endDate = quiz.endDate ? new Date(quiz.endDate) : null;

                        let canStart = true;
                        let dateMsg = '';
                        let statusColor = '#4CAF50';

                        if (startDate && now < startDate) {
                            canStart = false;
                            dateMsg = `Başlangıç: ${startDate.toLocaleString('tr-TR')}`;
                            statusColor = '#FF9800';
                        } else if (endDate && now > endDate) {
                            canStart = false;
                            dateMsg = `Kapandı: ${endDate.toLocaleString('tr-TR')}`;
                            statusColor = '#F44336';
                        } else if (endDate) {
                            dateMsg = `Bitiş: ${endDate.toLocaleString('tr-TR')}`;
                            statusColor = '#4CAF50';
                        }

                        return (
                            <TouchableOpacity
                                key={quiz.id}
                                style={styles.quizCard}
                                onPress={() => handleQuizPress(quiz)}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={`${quiz.title} sınavı. Süre ${quiz.duration} dakika. Geçme notu yüzde ${quiz.passingScore}`}
                                accessibilityHint={canStart ? "Sınav detaylarını görmek için dokunun" : "Bu sınav şu anda kullanılamıyor"}
                                accessibilityState={{ disabled: !canStart }}
                            >
                                <View style={styles.quizHeader}>
                                    <Text
                                        style={styles.quizTitle}
                                        accessibilityRole="header"
                                    >
                                        {quiz.title}
                                    </Text>
                                    <View
                                        style={[styles.statusDot, { backgroundColor: statusColor }]}
                                        accessible={false}
                                    />
                                </View>
                                <Text style={styles.quizInfo}>
                                    ⏱️ {quiz.duration} dakika · 🎯 Geçme: {quiz.passingScore}%
                                </Text>
                                {dateMsg && (
                                    <Text
                                        style={[styles.quizDate, { color: statusColor }]}
                                    >
                                        {dateMsg}
                                    </Text>
                                )}
                                <Text style={styles.quizHint}>
                                    Detaylar için dokunun
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <Text style={styles.emptyText}>Henüz sınav yok</Text>
                )}
            </View>

            {/* Assignments */}
            {course.assignments && course.assignments.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ödevler</Text>
                    {course.assignments.map((assignment) => (
                        <View key={assignment.id} style={styles.assignmentCard}>
                            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                            <View style={styles.assignmentInfo}>
                                <Text style={styles.assignmentPoints}>
                                    📊 {assignment.points} puan
                                </Text>
                                {assignment.dueDate && (
                                    <Text style={styles.assignmentDue}>
                                        📅 {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
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
    errorText: {
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    instructor: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    categoryBadge: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 14,
        color: '#1976d2',
        fontWeight: '600',
    },
    description: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    section: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    moduleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    moduleContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    videoBadge: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    videoBadgeText: {
        fontSize: 12,
        color: '#2e7d32',
        fontWeight: '600',
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    warningText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 4,
    },
    warningSubtext: {
        fontSize: 13,
        color: '#856404',
    },
    quizCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    quizHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quizTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    quizInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    quizDate: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    quizHint: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    assignmentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    assignmentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    assignmentInfo: {
        flexDirection: 'row',
        gap: 16,
    },
    assignmentPoints: {
        fontSize: 14,
        color: '#1976d2',
    },
    assignmentDue: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
    progressIndicator: {
        marginTop: 12,
        marginBottom: 8,
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
});

export default StudentCourseDetails;
