import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AuthService from '../../services/AuthService';
import api from '../../utils/api';

const StudentDashboard = ({ navigation }) => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
        fetchEnrolledCourses();
    }, []);

    const loadUser = async () => {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
    };

    const fetchEnrolledCourses = async () => {
        try {
            setLoading(true);
            // Use exact endpoint from web-next
            const response = await api.get('/api/courses/enrollments/my');
            const myEnrollments = response.data.enrollments || [];
            setEnrolledCourses(myEnrollments);
        } catch (error) {
            console.error('Failed to fetch enrolled courses:', error);
            Alert.alert('Hata', 'Kurslar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchEnrolledCourses();
        setRefreshing(false);
    }, []);

    const handleLogout = async () => {
        await AuthService.logout();
        Alert.alert('Başarılı', 'Çıkış yapıldı. Uygulamayı yenileyin.', [
            {
                text: 'Tamam',
                onPress: () => {
                    // User needs to reload app
                },
            },
        ]);
    };

    const renderCourse = ({ item }) => (
        <TouchableOpacity
            style={styles.courseCard}
            onPress={() =>
                navigation.navigate('StudentCourseDetails', {
                    courseId: item.course.id,
                })
            }
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.course.title} kursu`}
            accessibilityHint="Kurs detaylarını görüntülemek için dokunun"
        >
            <View style={styles.courseHeader}>
                <Text
                    style={styles.courseTitle}
                    accessibilityRole="header"
                >
                    {item.course.title}
                </Text>
                <Text style={styles.courseInstructor}>
                    {item.course.instructor?.fullName || 'Eğitmen'}
                </Text>
            </View>
            {item.course.description && (
                <Text style={styles.courseDescription} numberOfLines={2}>
                    {item.course.description}
                </Text>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Kurslar yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Hoş Geldin,</Text>
                    <Text style={styles.userName}>
                        {user?.fullName || user?.username}!
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Çıkış yap"
                    accessibilityHint="Hesabınızdan çıkış yapmak için dokunun"
                >
                    <Text style={styles.logoutText}>Çıkış</Text>
                </TouchableOpacity>
            </View>

            {/* Courses List */}
            {enrolledCourses.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Kayıtlı kursunuz bulunmuyor</Text>
                    <Text style={styles.emptySubtext}>
                        Kurslara kayıt olmak için yöneticinizle iletişime geçin
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={enrolledCourses}
                    renderItem={renderCourse}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
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
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    welcomeText: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonText: {
        fontSize: 20,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
    },
    courseCard: {
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
    courseHeader: {
        marginBottom: 8,
    },
    courseTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    courseInstructor: {
        fontSize: 14,
        color: '#666',
    },
    courseDescription: {
        fontSize: 14,
        color: '#888',
        marginBottom: 12,
        lineHeight: 20,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 3,
    },
    progressPercent: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
        textAlign: 'right',
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

export default StudentDashboard;
