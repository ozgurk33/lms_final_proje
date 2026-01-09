import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../../utils/ThemeContext';
import progressService from '../../services/progressService';

const VideoPlayerScreen = ({ route, navigation }) => {
    const { moduleId, videoUrl, moduleTitle } = route.params;
    const { theme } = useTheme();

    // Decode HTML entities from video URL
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

    const decodedVideoUrl = decodeHtmlEntities(videoUrl);

    // Debug logs
    console.log('=== VideoPlayer Debug ===');
    console.log('Module ID:', moduleId);
    console.log('Video URL (original):', videoUrl);
    console.log('Video URL (decoded):', decodedVideoUrl);
    console.log('Module Title:', moduleTitle);
    console.log('========================');

    const videoRef = useRef(null);
    const [status, setStatus] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [savedPosition, setSavedPosition] = useState(0);

    const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

    useEffect(() => {
        loadProgress();
        return () => {
            saveProgress();
        };
    }, []);

    const loadProgress = async () => {
        try {
            const result = await progressService.getProgress(moduleId);
            if (result.success && result.data?.progress) {
                const position = result.data.progress.lastPosition || 0;
                setSavedPosition(position);
            }
        } catch (error) {
            // Silently fail - progress feature is optional
            // Video will play from beginning
        }
    };

    const saveProgress = async () => {
        if (!status.positionMillis) return;

        try {
            const position = status.positionMillis / 1000; // Convert to seconds
            await progressService.updateProgress(moduleId, {
                lastPosition: position,
                completed: status.didJustFinish || false,
            });
        } catch (error) {
            // Silently fail - progress saving is optional
        }
    };

    const handlePlaybackStatusUpdate = (newStatus) => {
        setStatus(newStatus);

        if (newStatus.isLoaded && isLoading) {
            setIsLoading(false);
            // Resume from saved position
            if (savedPosition > 0) {
                videoRef.current?.setPositionAsync(savedPosition * 1000);
            }
        }

        // Handle errors
        if (newStatus.error) {
            setIsLoading(false);
            Alert.alert('Video Hatası', 'Video yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            console.error('Video error:', newStatus.error);
        }

        // Auto-save every 10 seconds
        if (newStatus.positionMillis && newStatus.positionMillis % 10000 < 100) {
            saveProgress();
        }

        // Video finished
        if (newStatus.didJustFinish) {
            saveProgress();
        }
    };

    // Add timeout for loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
                Alert.alert(
                    'Yükleme Zaman Aşımı',
                    'Video yüklenemedi. URL geçerli mi kontrol edin.',
                    [
                        { text: 'Geri Dön', onPress: () => navigation.goBack() }
                    ]
                );
            }
        }, 15000); // 15 second timeout

        return () => clearTimeout(timeout);
    }, [isLoading]);

    const togglePlayPause = async () => {
        if (status.isPlaying) {
            await videoRef.current?.pauseAsync();
        } else {
            await videoRef.current?.playAsync();
        }
    };

    const changeSpeed = async () => {
        const currentIndex = speedOptions.indexOf(playbackSpeed);
        const nextIndex = (currentIndex + 1) % speedOptions.length;
        const nextSpeed = speedOptions[nextIndex];

        setPlaybackSpeed(nextSpeed);
        await videoRef.current?.setRateAsync(nextSpeed, true);
    };

    const skipForward = async () => {
        if (status.positionMillis) {
            const newPosition = Math.min(
                status.positionMillis + 10000,
                status.durationMillis || status.positionMillis + 10000
            );
            await videoRef.current?.setPositionAsync(newPosition);
        }
    };

    const skipBackward = async () => {
        if (status.positionMillis) {
            const newPosition = Math.max(status.positionMillis - 10000, 0);
            await videoRef.current?.setPositionAsync(newPosition);
        }
    };

    const formatTime = (millis) => {
        if (!millis) return '0:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

            {/* Video Player */}
            <View style={styles.videoContainer}>
                <Video
                    ref={videoRef}
                    source={{ uri: decodedVideoUrl }}
                    style={styles.video}
                    useNativeControls={false}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                    shouldPlay={true}
                    usePoster
                />

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Video yükleniyor...</Text>
                    </View>
                )}
            </View>

            {/* Controls */}
            <View style={[styles.controls, { backgroundColor: theme.colors.card }]}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <Text style={[styles.timeText, { color: theme.colors.text }]}>
                        {formatTime(status.positionMillis)}
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={status.durationMillis || 1}
                        value={status.positionMillis || 0}
                        onSlidingComplete={async (value) => {
                            await videoRef.current?.setPositionAsync(value);
                        }}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor="#ddd"
                        thumbTintColor={theme.colors.primary}
                    />
                    <Text style={[styles.timeText, { color: theme.colors.text }]}>
                        {formatTime(status.durationMillis)}
                    </Text>
                </View>

                {/* Playback Controls */}
                <View style={styles.playbackControls}>
                    <TouchableOpacity
                        onPress={skipBackward}
                        style={styles.controlButton}
                        accessibilityLabel="10 saniye geri"
                        accessibilityRole="button"
                    >
                        <Text style={styles.controlIcon}>⏪</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={togglePlayPause}
                        style={[styles.controlButton, styles.playButton]}
                        accessibilityLabel={status.isPlaying ? 'Duraklat' : 'Oynat'}
                        accessibilityRole="button"
                    >
                        <Text style={styles.playIcon}>
                            {status.isPlaying ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={skipForward}
                        style={styles.controlButton}
                        accessibilityLabel="10 saniye ileri"
                        accessibilityRole="button"
                    >
                        <Text style={styles.controlIcon}>⏩</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={changeSpeed}
                        style={[styles.speedButton, { backgroundColor: theme.colors.primary }]}
                        accessibilityLabel={`Hız: ${playbackSpeed}x`}
                        accessibilityRole="button"
                    >
                        <Text style={styles.speedText}>{playbackSpeed}x</Text>
                    </TouchableOpacity>
                </View>
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
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width * (9 / 16), // 16:9 aspect ratio
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 14,
    },
    controls: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 40,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    playbackControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    controlButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 60,
        height: 60,
    },
    controlIcon: {
        fontSize: 24,
    },
    playIcon: {
        fontSize: 32,
    },
    speedButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 12,
    },
    speedText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default VideoPlayerScreen;
