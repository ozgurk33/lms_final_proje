import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import CourseService from '../../services/CourseService';
import AuthService from '../../services/AuthService';

const StudentDashboard = ({ navigation }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        const result = await CourseService.getEnrolledCourses();
        setLoading(false);

        if (result.success) {
            setCourses(result.data);
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Çıkış', 'Çıkış yapmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış',
                onPress: async () => {
                    await AuthService.logout();
                    // Navigation will reset automatically via AppNavigator
                },
            },
        ]);
    };

    const renderCourseCard = ({ item }) => (
        <TouchableOpacity
            style={styles.courseCard}
            onPress={() =>
                navigation.navigate('StudentCourseDetails', { courseId: item.id })
            }>
            <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{item.title}</Text>
            </View>
            <Text style={styles.courseDescription} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.courseFooter}>
                <Text style={styles.instructorName}>
                    {item.instructor?.name || 'Eğitmen'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <>
                    <FlatList
                        data={courses}
                        renderItem={renderCourseCard}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    Henüz kayıtlı olduğunuz bir kurs yok.
                                </Text>
                            </View>
                        }
                        refreshing={loading}
                        onRefresh={loadCourses}
                    />
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Çıkış Yap</Text>
                    </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
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
        fontWeight: 'bold',
        color: '#333',
    },
    courseDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    courseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    instructorName: {
        fontSize: 13,
        color: '#007AFF',
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
    logoutButton: {
        backgroundColor: '#FF3B30',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default StudentDashboard;
