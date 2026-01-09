import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    RefreshControl,
} from 'react-native';
import AuthService from '../../services/AuthService';
import CourseService from '../../services/CourseService';
import { useTheme } from '../../utils/ThemeContext';
import { t } from '../../i18n';

const StudentHomeScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        completedQuizzes: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const { theme, isDark, toggleTheme } = useTheme();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = await AuthService.getCurrentUser();
            setUser(currentUser);

            // Get enrolled courses count
            const coursesResponse = await CourseService.getEnrolledCourses();
            const courses = coursesResponse.data || [];
            setStats({
                enrolledCourses: courses.length,
                completedQuizzes: 0, // Could be expanded with quiz API
            });
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const NavigationCard = ({ title, subtitle, icon, onPress, color }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.card }]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityLabel={title}
            accessibilityHint={subtitle}
            accessibilityRole="button"
        >
            <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
                <Text style={[styles.cardIconText, { color }]}>{icon}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    {subtitle}
                </Text>
            </View>
            <Text style={[styles.cardArrow, { color: theme.colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>{t('home.greeting')}</Text>
                        <Text style={styles.userName}>
                            {user?.fullName || user?.username || t('roles.STUDENT')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                        accessibilityLabel="Profile button"
                        accessibilityHint="Navigate to your profile page"
                        accessibilityRole="button"
                    >
                        <View style={styles.avatarSmall}>
                            <Text style={styles.avatarSmallText}>
                                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Theme Toggle in Header */}
                <View style={[styles.themeToggle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.themeText}>
                        {isDark ? t('theme.dark') : t('theme.light')}
                    </Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#767577', true: '#90CAF9' }}
                        thumbColor={'#fff'}
                        accessibilityLabel={isDark ? 'Dark mode enabled' : 'Light mode enabled'}
                        accessibilityHint="Toggle between dark and light theme"
                        accessibilityRole="switch"
                    />
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                        {stats.enrolledCourses}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        {t('home.enrolledCourses')}
                    </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                        {stats.completedQuizzes}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        {t('home.completedQuizzes')}
                    </Text>
                </View>
            </View>

            {/* Navigation Cards */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    {t('home.quickAccess')}
                </Text>

                <NavigationCard
                    title={t('home.myCourses')}
                    subtitle={t('home.myCoursesDesc')}
                    icon="📚"
                    color="#007AFF"
                    onPress={() => navigation.navigate('StudentDashboard')}
                />

                <NavigationCard
                    title={t('home.quizHistory')}
                    subtitle={t('home.quizHistoryDesc')}
                    icon="📝"
                    color="#FF9800"
                    onPress={() => navigation.navigate('QuizHistory')}
                />

                <NavigationCard
                    title={t('home.profile')}
                    subtitle={t('home.profileDesc')}
                    icon="👤"
                    color="#4CAF50"
                    onPress={() => navigation.navigate('Profile')}
                />
            </View>

            {/* Logout */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
                    onPress={async () => {
                        await AuthService.logout();
                    }}
                    accessibilityLabel="Logout button"
                    accessibilityHint="Logout from your account"
                    accessibilityRole="button"
                >
                    <Text style={styles.logoutText}>🚪 {t('common.logout')}</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                    LMS Mobil v1.0.0
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileButton: {
        padding: 4,
    },
    avatarSmall: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarSmallText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    themeToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    themeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: -20,
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardIconText: {
        fontSize: 28,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    cardArrow: {
        fontSize: 32,
        fontWeight: '300',
    },
    logoutButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
    },
});

export default StudentHomeScreen;
