import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from 'react-native';
import AdminService from '../../services/AdminService';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL', 'STUDENT', 'INSTRUCTOR'

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, selectedFilter]);

    const loadUsers = async () => {
        setLoading(true);
        const result = await AdminService.getAllUsers();
        setLoading(false);

        if (result.success) {
            const usersData = result.data.users || result.data;
            setUsers(usersData);
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const filterUsers = () => {
        if (selectedFilter === 'ALL') {
            setFilteredUsers(users);
        } else {
            setFilteredUsers(users.filter(u => u.role === selectedFilter));
        }
    };

    const getStats = () => {
        const students = users.filter(u => u.role === 'STUDENT').length;
        const instructors = users.filter(u => u.role === 'INSTRUCTOR').length;
        const total = users.length;
        return { students, instructors, total };
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'SUPER_ADMIN':
            case 'ADMIN':
                return '#FF3B30';
            case 'INSTRUCTOR':
                return '#34C759';
            case 'STUDENT':
                return '#007AFF';
            default:
                return '#999';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'Süper Admin';
            case 'ADMIN':
                return 'Admin';
            case 'INSTRUCTOR':
                return 'Eğitmen';
            case 'STUDENT':
                return 'Öğrenci';
            default:
                return role;
        }
    };

    const handleDeleteUser = (userId, userName) => {
        Alert.alert(
            'Kullanıcıyı Sil',
            `${userName} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await AdminService.deleteUser(userId);
                        if (result.success) {
                            Alert.alert('Başarılı', 'Kullanıcı silindi');
                            loadUsers();
                        } else {
                            Alert.alert('Hata', result.error || 'Kullanıcı silinemedi');
                        }
                    }
                }
            ]
        );
    };

    const renderUser = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName || item.username}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={styles.cardActions}>
                <View
                    style={[
                        styles.roleBadge,
                        { backgroundColor: getRoleBadgeColor(item.role) },
                    ]}>
                    <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item.id, item.fullName || item.username)}
                    accessibilityLabel="Kullanıcıyı sil"
                    accessibilityRole="button"
                >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const FilterTab = ({ label, filter, count }) => (
        <TouchableOpacity
            style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive
            ]}
            onPress={() => setSelectedFilter(filter)}
            accessibilityLabel={label}
            accessibilityRole="button"
        >
            <Text style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive
            ]}>
                {label}
            </Text>
            {count !== undefined && (
                <Text style={[
                    styles.filterTabCount,
                    selectedFilter === filter && styles.filterTabCountActive
                ]}>
                    {count}
                </Text>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const stats = getStats();

    return (
        <View style={styles.container}>
            {/* Stats Header */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Toplam</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#007AFF' }]}>{stats.students}</Text>
                    <Text style={styles.statLabel}>Öğrenci</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.instructors}</Text>
                    <Text style={styles.statLabel}>Eğitmen</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <FilterTab label="Tümü" filter="ALL" count={stats.total} />
                <FilterTab label="Öğrenciler" filter="STUDENT" count={stats.students} />
                <FilterTab label="Eğitmenler" filter="INSTRUCTOR" count={stats.instructors} />
            </View>

            {/* User List */}
            <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={loadUsers}
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
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 8,
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    statBox: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: '#007AFF',
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    filterTabTextActive: {
        color: '#fff',
    },
    filterTabCount: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#999',
    },
    filterTabCountActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 13,
        color: '#666',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFE5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteIcon: {
        fontSize: 20,
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

export default AdminUsers;
