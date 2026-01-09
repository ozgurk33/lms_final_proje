import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import downloadService from '../../services/downloadService';

const DownloadsScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [downloads, setDownloads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storageUsed, setStorageUsed] = useState(0);

    useEffect(() => {
        fetchDownloads();
    }, []);

    const fetchDownloads = async () => {
        try {
            setLoading(true);
            const result = await downloadService.getDownloads();
            setDownloads(result);

            const storage = await downloadService.getStorageUsed();
            setStorageUsed(storage);
        } catch (error) {
            console.error('Fetch downloads error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (download) => {
        Alert.alert(
            'İndirmeyi Sil',
            `"${download.title}" dosyasını silmek istediğinizden emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await downloadService.deleteDownload(download.id);
                        if (result.success) {
                            fetchDownloads();
                        } else {
                            Alert.alert('Hata', result.error);
                        }
                    },
                },
            ]
        );
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderDownload = ({ item }) => (
        <View style={[styles.downloadCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.downloadInfo}>
                <Text style={styles.downloadIcon}>
                    {item.type === 'video' ? '📹' : '📄'}
                </Text>
                <View style={styles.downloadDetails}>
                    <Text style={[styles.downloadTitle, { color: theme.colors.text }]}>
                        {item.title}
                    </Text>
                    <Text style={styles.downloadMeta}>
                        {item.type.toUpperCase()} • {formatFileSize(item.size)}
                    </Text>
                    <Text style={styles.downloadDate}>
                        İndirildi: {new Date(item.downloadedAt).toLocaleDateString('tr-TR')}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
            >
                <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.colors.primary }]}>← Geri</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    İndirilenler
                </Text>
            </View>

            {/* Storage Info */}
            <View style={styles.storageContainer}>
                <Text style={[styles.storageText, { color: theme.colors.text }]}>
                    Toplam {downloads.length} dosya • {formatFileSize(storageUsed)} kullanılıyor
                </Text>
            </View>

            {/* Downloads List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={downloads}
                    renderItem={renderDownload}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📥</Text>
                            <Text style={styles.emptyText}>Henüz dosya indirilmemiş</Text>
                            <Text style={styles.emptySubtext}>
                                Modül sayfalarından video ve PDF indirebilirsiniz
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        marginRight: 12,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
    },
    storageContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    storageText: {
        fontSize: 14,
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    downloadCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    downloadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    downloadIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    downloadDetails: {
        flex: 1,
    },
    downloadTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    downloadMeta: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    downloadDate: {
        fontSize: 12,
        color: '#999',
    },
    deleteButton: {
        padding: 8,
    },
    deleteButtonText: {
        fontSize: 24,
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default DownloadsScreen;
