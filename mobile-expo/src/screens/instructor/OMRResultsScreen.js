import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';

const OMRResultsScreen = ({ route, navigation }) => {
    const { result, quizTitle, studentName } = route.params;

    const { summary, results } = result;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>OMR Sonuçları</Text>
                    <Text style={styles.quizTitle}>{quizTitle || 'Optik Sınav'}</Text>
                    <Text style={styles.studentName}>{studentName || 'Öğrenci'}</Text>
                </View>

                {/* Score Summary */}
                <View style={[styles.scoreCard, summary.isPassed ? styles.scoreCardPassed : styles.scoreCardFailed]}>
                    <Text style={styles.scoreLabel}>Puan</Text>
                    <Text style={styles.scoreValue}>{summary.percentage}%</Text>
                    <Text style={styles.scoreSubtitle}>
                        {summary.correctAnswers}/{summary.totalQuestions} Doğru
                    </Text>
                    <View style={[styles.badge, summary.isPassed ? styles.badgePassed : styles.badgeFailed]}>
                        <Text style={styles.badgeText}>
                            {summary.isPassed ? '✓ BAŞARILI' : '✗ BAŞARISIZ'}
                        </Text>
                    </View>
                </View>

                {/* Statistics */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{summary.correctAnswers}</Text>
                        <Text style={styles.statLabel}>Doğru</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, styles.statIncorrect]}>{summary.incorrectAnswers}</Text>
                        <Text style={styles.statLabel}>Yanlış</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, styles.statBlank]}>{summary.blankAnswers}</Text>
                        <Text style={styles.statLabel}>Boş</Text>
                    </View>
                </View>

                {/* Detailed Results */}
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Detaylı Sonuçlar</Text>

                    {results.map((item) => (
                        <View
                            key={item.questionNumber}
                            style={[
                                styles.questionCard,
                                item.isCorrect ? styles.questionCardCorrect : styles.questionCardIncorrect
                            ]}
                        >
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Soru {item.questionNumber}</Text>
                                <View style={[
                                    styles.statusIcon,
                                    item.isCorrect ? styles.statusIconCorrect : styles.statusIconIncorrect
                                ]}>
                                    <Text style={styles.statusIconText}>
                                        {item.isCorrect ? '✓' : '✗'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.answerRow}>
                                <View style={styles.answerItem}>
                                    <Text style={styles.answerLabel}>Öğrenci Cevabı:</Text>
                                    <View style={[styles.answerBubble, item.studentAnswer ? styles.answerBubbleFilled : styles.answerBubbleEmpty]}>
                                        <Text style={[styles.answerText, item.studentAnswer && styles.answerTextFilled]}>
                                            {item.studentAnswer || '-'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.answerItem}>
                                    <Text style={styles.answerLabel}>Doğru Cevap:</Text>
                                    <View style={[styles.answerBubble, styles.answerBubbleCorrect]}>
                                        <Text style={[styles.answerText, styles.answerTextCorrect]}>
                                            {item.correctAnswer}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.pointsRow}>
                                <Text style={styles.pointsText}>
                                    {item.points} / {item.points === 0 ? 10 : 10} puan
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => navigation.navigate('InstructorHome')}
                    >
                        <Text style={styles.doneButtonText}>Tamam</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    quizTitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 4,
    },
    studentName: {
        fontSize: 16,
        color: '#888',
    },
    scoreCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 2,
    },
    scoreCardPassed: {
        borderColor: '#4CAF50',
    },
    scoreCardFailed: {
        borderColor: '#F44336',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
    },
    scoreSubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
    badge: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    badgePassed: {
        backgroundColor: '#4CAF50',
    },
    badgeFailed: {
        backgroundColor: '#F44336',
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    statIncorrect: {
        color: '#F44336',
    },
    statBlank: {
        color: '#FF9800',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    detailsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    questionCardCorrect: {
        borderLeftColor: '#4CAF50',
    },
    questionCardIncorrect: {
        borderLeftColor: '#F44336',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusIconCorrect: {
        backgroundColor: '#4CAF50',
    },
    statusIconIncorrect: {
        backgroundColor: '#F44336',
    },
    statusIconText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    answerRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    answerItem: {
        alignItems: 'center',
    },
    answerLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    answerBubble: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    answerBubbleFilled: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    answerBubbleEmpty: {
        backgroundColor: '#F5F5F5',
        borderColor: '#BDBDBD',
    },
    answerBubbleCorrect: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    answerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
    },
    answerTextFilled: {
        color: '#2196F3',
    },
    answerTextCorrect: {
        color: '#4CAF50',
    },
    pointsRow: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    pointsText: {
        fontSize: 12,
        color: '#666',
    },
    actionsContainer: {
        marginTop: 16,
        marginBottom: 32,
    },
    doneButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OMRResultsScreen;
