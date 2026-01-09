import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../utils/ThemeContext';
import progressService from '../../services/progressService';

const PDFViewerScreen = ({ route, navigation }) => {
    const { moduleId, pdfUrl, moduleTitle } = route.params;
    const { theme } = useTheme();

    // Decode HTML entities from PDF URL
    const decodeHtmlEntities = (text) => {
        if (!text) return text;
        return text
            .replace(/&amp;#x2F;/g, '/')
            .replace(/&#x2F;/g, '/')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
    };

    const decodedPdfUrl = decodeHtmlEntities(pdfUrl);

    // Use Google Docs viewer for PDF
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(decodedPdfUrl)}&embedded=true`;

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
        return () => {
            saveProgress();
        };
    }, []);

    const loadProgress = async () => {
        try {
            const result = await progressService.getProgress(moduleId);
            // Progress loaded successfully (page tracking not available in WebView)
        } catch (error) {
            // Silently fail - progress feature is optional
        }
    };

    const saveProgress = async () => {
        try {
            await progressService.updateProgress(moduleId, {
                completed: true, // Mark as viewed
            });
        } catch (error) {
            // Silently fail - progress saving is optional
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity
                    onPress={() => {
                        saveProgress();
                        navigation.goBack();
                    }}
                    style={styles.backButton}
                    accessibilityLabel="Geri dön"
                    accessibilityRole="button"
                >
                    <Text style={[styles.backText, { color: theme.colors.primary }]}>← Geri</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                    {moduleTitle}
                </Text>
            </View>

            {/* PDF Viewer via WebView */}
            <View style={styles.pdfContainer}>
                <WebView
                    source={{ uri: viewerUrl }}
                    style={styles.webview}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        // Error handled by WebView
                    }}
                    startInLoadingState={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                            PDF yükleniyor...
                        </Text>
                    </View>
                )}
            </View>
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
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    pdfContainer: {
        flex: 1,
        position: 'relative',
    },
    webview: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
});

export default PDFViewerScreen;
