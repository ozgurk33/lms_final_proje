import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AdminService from '../../services/AdminService';
import AuthService from '../../services/AuthService';

const AdminDashboard = ({ navigation }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        setLoading(true);
        const result = await AdminService.getStatistics();
        setLoading(false);

        if (result.success) {
            setStats(result.data);
        } else {
            // If statistics endpoint doesn't exist, use fallback
            setStats({
                totalUsers: '-',
                totalCourses: '-',
                totalEnrollments: '-',
            });
        }
    };

    const handleLogout = async () => {
        Alert.alert('Çıkış', 'Çıkış yapmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış',
                onPress: async () => {
                    await AuthService.logout();
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
                    <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats?.totalCourses || 0}</Text>
                    <Text style={styles.statLabel}>Toplam Kurs</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats?.totalEnrollments || 0}</Text>
                    <Text style={styles.statLabel}>Toplam Kayıt</Text>
                </View>
            </View>

            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.navigate('AdminUsers')}>
                    <Text style={styles.menuIcon}>👥</Text>
                    <Text style={styles.menuText}>Kullanıcı Yönetimi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.navigate('AdminCourses')}>
                    <Text style={styles.menuIcon}>📚</Text>
                    <Text style={styles.menuText}>Kurs Yönetimi</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        marginTop: 16,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flex: 1,
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    menuContainer: {
        padding: 16,
    },
    menuButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    menuText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AdminDashboard;
