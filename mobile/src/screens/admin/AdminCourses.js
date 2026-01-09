import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AdminService from '../../services/AdminService';

const AdminCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        const result = await AdminService.getAllCourses();
        setLoading(false);

        if (result.success) {
            setCourses(result.data);
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const renderCourse = ({ item }) => (
        <View style={styles.courseCard}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseDescription} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.courseFooter}>
                <Text style={styles.instructorName}>
                    Eğitmen: {item.instructor?.name || 'Belirtilmemiş'}
                </Text>
                <Text style={styles.enrollmentCount}>
                    👥 {item._count?.enrollments || 0}
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
                data={courses}
                renderItem={renderCourse}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Kurs bulunamadı.</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={loadCourses}
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
    courseCard: {
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
    courseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    courseDescription: {
        fontSize: 13,
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
    enrollmentCount: {
        fontSize: 13,
        color: '#666',
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

export default AdminCourses;
