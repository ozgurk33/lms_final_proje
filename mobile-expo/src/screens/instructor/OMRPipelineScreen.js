import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    ActivityIndicator
} from 'react-native';

const { width } = Dimensions.get('window');

const PIPELINE_STAGES = [
    { key: 'a4_detection', title: 'Aşama 1: Köşe Algılama', description: 'A4 kağıdın köşeleri tespit edildi' },
    { key: 'a4_corrected', title: 'Aşama 2: Perspektif Düzeltme', description: 'Kağıt düzleştirildi' },
    { key: 'answer_region_marked', title: 'Aşama 3: Cevap Bölgesi', description: 'Cevap alanı işaretlendi' },
    { key: 'answer_region_zoomed', title: 'Aşama 4: Yakınlaştırma', description: 'Cevap bölgesi ayrıldı' },
    { key: 'bubble_detection', title: 'Aşama 5: Bubble Algılama', description: 'Bubble\'lar tespit edildi' }
];

const OMRPipelineScreen = ({ navigation, route }) => {
    const { pipelineImages, answers, confidence, summary, quizTitle, studentName, quizId, studentId, gradeResult } = route.params || {};
    const [currentStage, setCurrentStage] = useState(0);
    const [imageLoading, setImageLoading] = useState({});

    const handleContinue = () => {
        navigation.navigate('OMRResults', {
            result: gradeResult,
            quizTitle: quizTitle,
            studentName: studentName,
            omrData: { answers, confidence, summary }
        });
    };

    const renderStageIndicator = () => (
        <View style={styles.stageIndicator}>
            {PIPELINE_STAGES.map((stage, index) => (
                <TouchableOpacity
                    key={stage.key}
                    style={[
                        styles.stageButton,
                        currentStage === index && styles.stageButtonActive
                    ]}
                    onPress={() => setCurrentStage(index)}
                >
                    <Text style={[
                        styles.stageButtonText,
                        currentStage === index && styles.stageButtonTextActive
                    ]}>
                        {index + 1}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const currentStageData = PIPELINE_STAGES[currentStage];
    const currentImage = pipelineImages?.[currentStageData.key];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📊 OMR İşleme Aşamaları</Text>
                <Text style={styles.subtitle}>{quizTitle || 'OMR Quiz'}</Text>
            </View>

            {/* Stage Indicator */}
            {renderStageIndicator()}

            {/* Current Stage Info */}
            <View style={styles.stageInfo}>
                <Text style={styles.stageTitle}>{currentStageData.title}</Text>
                <Text style={styles.stageDescription}>{currentStageData.description}</Text>
            </View>

            {/* Image Display */}
            <ScrollView style={styles.imageContainer} contentContainerStyle={styles.imageContent}>
                {currentImage ? (
                    <View style={styles.imageWrapper}>
                        {imageLoading[currentStageData.key] && (
                            <ActivityIndicator size="large" color="#007AFF" style={styles.imageLoader} />
                        )}
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${currentImage.base64}` }}
                            style={styles.pipelineImage}
                            resizeMode="contain"
                            onLoadStart={() => setImageLoading(prev => ({ ...prev, [currentStageData.key]: true }))}
                            onLoadEnd={() => setImageLoading(prev => ({ ...prev, [currentStageData.key]: false }))}
                        />
                    </View>
                ) : (
                    <View style={styles.noImage}>
                        <Text style={styles.noImageText}>⚠️ Bu aşama için görsel bulunamadı</Text>
                    </View>
                )}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
                <TouchableOpacity
                    style={[styles.navButton, currentStage === 0 && styles.navButtonDisabled]}
                    onPress={() => setCurrentStage(prev => Math.max(0, prev - 1))}
                    disabled={currentStage === 0}
                >
                    <Text style={styles.navButtonText}>◀ Önceki</Text>
                </TouchableOpacity>

                {currentStage === PIPELINE_STAGES.length - 1 ? (
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>✓ Sonuçlara Git</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => setCurrentStage(prev => Math.min(PIPELINE_STAGES.length - 1, prev + 1))}
                    >
                        <Text style={styles.navButtonText}>Sonraki ▶</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Summary Info */}
            {summary && currentStage === PIPELINE_STAGES.length - 1 && (
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>📋 Algılama Özeti</Text>
                    <Text style={styles.summaryText}>
                        Toplam Soru: {summary.total} | Cevaplanmış: {summary.answered} | Boş: {summary.blank}
                    </Text>
                    <Text style={styles.summaryText}>
                        Ortalama Güven: {(summary.average_confidence * 100).toFixed(0)}%
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        padding: 16,
        paddingTop: 40,
        backgroundColor: '#16213e',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
        marginTop: 4,
    },
    stageIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    stageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2d2d44',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#444',
    },
    stageButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    stageButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: 'bold',
    },
    stageButtonTextActive: {
        color: '#fff',
    },
    stageInfo: {
        padding: 16,
        backgroundColor: '#16213e',
        marginHorizontal: 16,
        borderRadius: 12,
    },
    stageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 4,
    },
    stageDescription: {
        fontSize: 14,
        color: '#aaa',
    },
    imageContainer: {
        flex: 1,
        margin: 16,
    },
    imageContent: {
        alignItems: 'center',
    },
    imageWrapper: {
        width: width - 32,
        aspectRatio: 0.7,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    pipelineImage: {
        width: '100%',
        height: '100%',
    },
    imageLoader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -20,
    },
    noImage: {
        width: width - 32,
        height: 300,
        backgroundColor: '#2d2d44',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#888',
        fontSize: 16,
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        gap: 12,
    },
    navButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#2d2d44',
        borderRadius: 8,
        alignItems: 'center',
    },
    navButtonDisabled: {
        opacity: 0.4,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    continueButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    summaryBox: {
        margin: 16,
        marginTop: 0,
        padding: 16,
        backgroundColor: '#16213e',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 4,
    },
});

export default OMRPipelineScreen;
