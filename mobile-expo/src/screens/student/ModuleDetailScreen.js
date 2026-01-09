import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import progressService from '../../services/progressService';
import downloadService from '../../services/downloadService';

const ModuleDetailScreen = ({ route, navigation }) => {
    const { module, courseTitle } = route.params;
    const { theme } = useTheme();

    const [videoCompleted, setVideoCompleted] = useState(false);
    const [pdfCompleted, setPdfCompleted] = useState(false);
    const [videoDownloaded, setVideoDownloaded] = useState(false);
    const [pdfDownloaded, setPdfDownloaded] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadProgress();
        checkDownloads();
    }, []);

    const loadProgress = async () => {
        try {
            const result = await progressService.getProgress(module.id);
            console.log('Load progress result:', result);
            if (result.success && result.data?.progress) {
                console.log('Progress data:', result.data.progress);
                console.log('videoCompleted:', result.data.progress.videoCompleted);
                console.log('pdfCompleted:', result.data.progress.pdfCompleted);
                setVideoCompleted(result.data.progress.videoCompleted || false);
                setPdfCompleted(result.data.progress.pdfCompleted || false);
            }
        } catch (error) {
            console.error('Load progress error:', error);
        }
    };

    const toggleVideoCompleted = async () => {
        const newValue = !videoCompleted;
        setVideoCompleted(newValue);
        try {
            const result = await progressService.updateProgress(module.id, {
                contentType: 'VIDEO',
                videoCompleted: newValue,
                progress: newValue ? 100 : 0,
                completed: newValue && pdfCompleted,
            });
            if (!result.success) {
                setVideoCompleted(!newValue);
            }
        } catch (error) {
            setVideoCompleted(!newValue);
        }
    };

    const togglePdfCompleted = async () => {
        const newValue = !pdfCompleted;
        setPdfCompleted(newValue);
        try {
            const result = await progressService.updateProgress(module.id, {
                contentType: 'PDF',
                pdfCompleted: newValue,
                progress: newValue ? 100 : 0,
                completed: videoCompleted && newValue,
            });
            if (!result.success) {
                setPdfCompleted(!newValue);
            }
        } catch (error) {
            setPdfCompleted(!newValue);
        }
    };

    const checkDownloads = async () => {
        if (module.videoUrl) {
            const downloaded = await downloadService.isDownloaded(module.videoUrl);
            setVideoDownloaded(!!downloaded);
        }
        if (module.pdfUrl) {
            const downloaded = await downloadService.isDownloaded(module.pdfUrl);
            setPdfDownloaded(!!downloaded);
        }
    };

    const handleDownloadVideo = async () => {
        if (downloading) return;
        setDownloading(true);
        const result = await downloadService.downloadFile(module.videoUrl, module.title, 'video');
        setDownloading(false);
        if (result.success) {
            setVideoDownloaded(true);
            Alert.alert('Başarılı', 'Video indirildi!');
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const handleDownloadPDF = async () => {
        if (downloading) return;
        setDownloading(true);
        const result = await downloadService.downloadFile(module.pdfUrl, module.title, 'pdf');
        setDownloading(false);
        if (result.success) {
            setPdfDownloaded(true);
            Alert.alert('Başarılı', 'PDF indirildi!');
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const handleOpenVideo = () => {
        if (module.videoUrl) {
            navigation.navigate('VideoPlayer', {
                moduleId: module.id,
                videoUrl: module.videoUrl,
                moduleTitle: module.title,
            });
        } else {
            Alert.alert('Bilgi', 'Bu modülde video bulunmamaktadır.');
        }
    };

    const handleOpenPDF = () => {
        if (module.pdfUrl) {
            navigation.navigate('PDFViewer', {
                moduleId: module.id,
                pdfUrl: module.pdfUrl,
                moduleTitle: module.title,
            });
        } else {
            Alert.alert('Bilgi', 'Bu modülde PDF bulunmamaktadır.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    accessibilityLabel="Geri dön"
                    accessibilityRole="button"
                >
                    <Text style={[styles.backText, { color: theme.colors.primary }]}>
                        ← Geri
                    </Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    Modül Detayı
                </Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Course Title */}
                <Text style={[styles.courseTitle, { color: theme.colors.text }]}>
                    {courseTitle}
                </Text>

                {/* Module Title */}
                <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
                    {module.title}
                </Text>

                {/* Module Content/Description */}
                {module.content && (
                    <View style={[styles.descriptionCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.descriptionTitle, { color: theme.colors.text }]}>
                            📝 Açıklama
                        </Text>
                        <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
                            {module.content.replace(/<[^>]*>/g, '')}
                        </Text>
                    </View>
                )}

                {/* Content Badges */}
                <View style={styles.badgesContainer}>
                    {module.videoUrl && (
                        <View style={styles.availableBadge}>
                            <Text style={styles.availableBadgeText}>📹 Video Mevcut</Text>
                        </View>
                    )}
                    {module.pdfUrl && (
                        <View style={styles.availableBadge}>
                            <Text style={styles.availableBadgeText}>📄 PDF Mevcut</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {module.videoUrl && (
                        <View>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleOpenVideo}
                                accessibilityLabel="Video izle"
                                accessibilityRole="button"
                            >
                                <Text style={styles.actionButtonIcon}>📹</Text>
                                <Text style={styles.actionButtonText}>Video İzle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={toggleVideoCompleted}
                                accessibilityLabel="Video tamamlandı işaretle"
                                accessibilityRole="checkbox"
                            >
                                <View style={[styles.checkbox, videoCompleted && styles.checkboxChecked]}>
                                    {videoCompleted && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.checkboxLabel}>Video'yu tamamladım</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.downloadButton, videoDownloaded && styles.downloadedButton]}
                                onPress={handleDownloadVideo}
                                disabled={videoDownloaded || downloading}
                            >
                                <Text style={styles.downloadButtonText}>
                                    {videoDownloaded ? '✓ İndirildi' : '⬇️ Videoyu İndir'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {module.pdfUrl && (
                        <View>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#F57C00' }]}
                                onPress={handleOpenPDF}
                                accessibilityLabel="PDF görüntüle"
                                accessibilityRole="button"
                            >
                                <Text style={styles.actionButtonIcon}>📄</Text>
                                <Text style={styles.actionButtonText}>PDF Görüntüle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={togglePdfCompleted}
                                accessibilityLabel="PDF tamamlandı işaretle"
                                accessibilityRole="checkbox"
                            >
                                <View style={[styles.checkbox, pdfCompleted && styles.checkboxChecked]}>
                                    {pdfCompleted && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.checkboxLabel}>PDF'i tamamladım</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.downloadButton, pdfDownloaded && styles.downloadedButton]}
                                onPress={handleDownloadPDF}
                                disabled={pdfDownloaded || downloading}
                            >
                                <Text style={styles.downloadButtonText}>
                                    {pdfDownloaded ? '✓ İndirildi' : '⬇️ PDF İndir'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Notes Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
                        onPress={() => navigation.navigate('Notes', {
                            moduleId: module.id,
                            moduleTitle: module.title,
                        })}
                        accessibilityLabel="Notlarım"
                        accessibilityRole="button"
                    >
                        <Text style={styles.actionButtonIcon}>📝</Text>
                        <Text style={styles.actionButtonText}>Notlarım</Text>
                    </TouchableOpacity>
                </View>

                {/* No Content Message */}
                {!module.videoUrl && !module.pdfUrl && !module.content && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Bu modülde henüz içerik bulunmamaktadır.
                        </Text>
                    </View>
                )}
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        opacity: 0.7,
    },
    moduleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    descriptionCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    descriptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    availableBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    availableBadgeText: {
        color: '#2E7D32',
        fontSize: 13,
        fontWeight: '600',
    },
    actionsContainer: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingVertical: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 6,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    checkmark: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#666',
    },
    downloadButton: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
    },
    downloadedButton: {
        backgroundColor: '#C8E6C9',
    },
    downloadButtonText: {
        color: '#2E7D32',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ModuleDetailScreen;
