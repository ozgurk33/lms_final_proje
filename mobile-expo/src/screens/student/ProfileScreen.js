import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import AuthService from '../../services/AuthService';
import BiometricService from '../../services/BiometricService';
import NotificationService from '../../services/NotificationService';
import { useTheme } from '../../utils/ThemeContext';
import { t, changeLocale, getCurrentLocale, availableLocales } from '../../i18n';
import api from '../../utils/api';

const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useState(getCurrentLocale());
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const { theme, isDark, toggleTheme } = useTheme();

    useEffect(() => {
        loadData();
        checkBiometric();
        checkNotifications();
    }, []);

    const loadData = async () => {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Çıkış Yap',
            t('auth.logoutConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        await AuthService.logout();
                        // Navigation handled automatically by event
                    },
                },
            ]
        );
    };

    const getRoleName = (role) => {
        const roleNames = {
            STUDENT: t('roles.STUDENT'),
            INSTRUCTOR: t('roles.INSTRUCTOR'),
            ADMIN: t('roles.ADMIN'),
            SUPER_ADMIN: t('roles.SUPER_ADMIN'),
        };
        return roleNames[role] || role;
    };

    const handleLanguageChange = async (languageCode) => {
        await changeLocale(languageCode);
        setCurrentLanguage(languageCode);
        // Force re-render
        await loadUser();
    };

    const checkBiometric = async () => {
        const { available } = await BiometricService.isAvailable();
        setBiometricAvailable(available);
        const enabled = await BiometricService.isBiometricEnabled();
        setBiometricEnabled(enabled);
    };

    const handleBiometricToggle = async (value) => {
        if (value) {
            // Enable biometric
            Alert.alert(
                t('profile.biometric'),
                t('profile.enableBiometric'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('common.confirm'),
                        onPress: async () => {
                            const result = await BiometricService.enableBiometric(
                                user?.email || user?.username,
                                'stored' // Password already stored during login
                            );
                            if (result.success) {
                                setBiometricEnabled(true);
                            } else {
                                Alert.alert(t('common.error'), result.error);
                            }
                        },
                    },
                ]
            );
        } else {
            // Disable biometric
            const result = await BiometricService.disableBiometric();
            if (result.success) {
                setBiometricEnabled(false);
            }
        }
    };

    const checkNotifications = async () => {
        const enabled = await NotificationService.isNotificationsEnabled();
        setNotificationsEnabled(enabled);
    };

    const handleNotificationToggle = async (value) => {
        const result = await NotificationService.setNotificationsEnabled(value);
        if (result.success) {
            setNotificationsEnabled(value);

            // Send role-specific notification when enabled
            if (value) {
                setTimeout(async () => {
                    try {
                        // Check user role
                        if (user?.role === 'INSTRUCTOR') {
                            // Instructor: Send course update notification
                            await NotificationService.scheduleNotification(
                                '🔔 Bildirimler Aktif!',
                                'Kurslarınızdaki öğrenci aktiviteleri ve güncellemeler burada görünecek. 👨‍🏫',
                                { type: 'instructor_welcome' }
                            );
                        } else {
                            // Student: Get latest quiz attempt
                            const response = await api.get('/api/quizzes', { params: { limit: 100 } });
                            const allQuizzes = response.data.quizzes || [];

                            let latestAttempt = null;
                            let quizTitle = '';

                            // Find the most recent attempt
                            for (const quiz of allQuizzes) {
                                try {
                                    const attemptResponse = await api.get(`/api/quizzes/${quiz.id}/results`);
                                    const attempts = attemptResponse.data.attempts || [];

                                    if (attempts.length > 0) {
                                        const sortedAttempts = attempts.sort((a, b) =>
                                            new Date(b.completedAt) - new Date(a.completedAt)
                                        );

                                        if (!latestAttempt || new Date(sortedAttempts[0].completedAt) > new Date(latestAttempt.completedAt)) {
                                            latestAttempt = sortedAttempts[0];
                                            quizTitle = quiz.title;
                                        }
                                    }
                                } catch (err) {
                                    // Skip this quiz if no attempts
                                }
                            }

                            // Send notification with real data
                            if (latestAttempt) {
                                const score = latestAttempt.score?.toFixed(0) || 0;
                                const isPassed = latestAttempt.isPassed || score >= (latestAttempt.passingScore || 50);
                                const emoji = isPassed ? '🎉' : '📝';
                                const statusText = isPassed ? 'Geçtiniz!' : 'Tekrar deneyebilirsiniz.';

                                await NotificationService.scheduleNotification(
                                    `${emoji} Sınav Sonucunuz Hazır!`,
                                    `${quizTitle} sınavından %${score} aldınız. ${statusText} 🎯`,
                                    {
                                        type: 'quiz_result',
                                        quizId: latestAttempt.quizId,
                                        score: score,
                                        isPassed: isPassed
                                    }
                                );
                            } else {
                                // No quiz attempts, send welcome notification
                                await NotificationService.scheduleNotification(
                                    '🔔 Bildirimler Aktif!',
                                    'Sınav sonuçlarınız burada görünecek. İyi çalışmalar! 📚',
                                    { type: 'welcome' }
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Failed to fetch data for notification:', error);
                        // Fallback to generic welcome notification
                        await NotificationService.scheduleNotification(
                            '🔔 Bildirimler Aktif!',
                            'Önemli güncellemeler burada görünecek!',
                            { type: 'welcome' }
                        );
                    }
                }, 1000);
            }
        } else {
            Alert.alert(t('common.error'), result.error || 'Failed to update notification settings');
        }
    };

    const dynamicStyles = getStyles(theme);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Profile Header */}
            <View style={[dynamicStyles.header, { backgroundColor: theme.colors.primary }]}>
                <View style={dynamicStyles.avatar}>
                    <Text style={dynamicStyles.avatarText}>
                        {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
                    </Text>
                </View>
                <Text style={dynamicStyles.name}>
                    {user?.fullName || user?.username || 'Kullanıcı'}
                </Text>
                <Text style={dynamicStyles.email}>{user?.email}</Text>
                <View style={dynamicStyles.roleBadge}>
                    <Text style={dynamicStyles.roleText}>{getRoleName(user?.role)}</Text>
                </View>
            </View>

            {/* Settings */}
            <View style={dynamicStyles.section}>
                <Text style={[dynamicStyles.sectionTitle, { color: theme.colors.text }]}>
                    {t('profile.settings')}
                </Text>

                <View style={[dynamicStyles.settingItem, { backgroundColor: theme.colors.card }]}>
                    <View>
                        <Text style={[dynamicStyles.settingLabel, { color: theme.colors.text }]}>
                            {isDark ? t('theme.dark') : t('theme.light')}
                        </Text>
                        <Text style={[dynamicStyles.settingSubtext, { color: theme.colors.textSecondary }]}>
                            {t('profile.themeToggle')}
                        </Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#767577', true: theme.colors.primary }}
                        thumbColor={'#fff'}
                    />
                </View>

                {/* Language Selector */}
                <View style={[dynamicStyles.settingItem, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[dynamicStyles.settingLabel, { color: theme.colors.text }]}>
                            🌐 {t('profile.language')}
                        </Text>
                        <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                            {availableLocales.map((locale) => (
                                <TouchableOpacity
                                    key={locale.code}
                                    style={[
                                        dynamicStyles.languageButton,
                                        currentLanguage === locale.code && {
                                            backgroundColor: theme.colors.primary,
                                        },
                                    ]}
                                    onPress={() => handleLanguageChange(locale.code)}
                                >
                                    <Text style={dynamicStyles.languageFlag}>{locale.flag}</Text>
                                    <Text
                                        style={[
                                            dynamicStyles.languageText,
                                            {
                                                color:
                                                    currentLanguage === locale.code
                                                        ? '#fff'
                                                        : theme.colors.text,
                                            },
                                        ]}
                                    >
                                        {locale.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Biometric Login */}
                {biometricAvailable && (
                    <View style={[dynamicStyles.settingItem, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
                        <View>
                            <Text style={[dynamicStyles.settingLabel, { color: theme.colors.text }]}>
                                🔐 {t('profile.biometric')}
                            </Text>
                            <Text style={[dynamicStyles.settingSubtext, { color: theme.colors.textSecondary }]}>
                                {t('profile.enableBiometric')}
                            </Text>
                        </View>
                        <Switch
                            value={biometricEnabled}
                            onValueChange={handleBiometricToggle}
                            trackColor={{ false: '#767577', true: theme.colors.primary }}
                            thumbColor={'#fff'}
                        />
                    </View>
                )}

                {/* Notifications */}
                <View style={[dynamicStyles.settingItem, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
                    <View>
                        <Text style={[dynamicStyles.settingLabel, { color: theme.colors.text }]}>
                            🔔 {t('profile.notifications')}
                        </Text>
                        <Text style={[dynamicStyles.settingSubtext, { color: theme.colors.textSecondary }]}>
                            {t('profile.enableNotifications')}
                        </Text>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={handleNotificationToggle}
                        trackColor={{ false: '#767577', true: theme.colors.primary }}
                        thumbColor={'#fff'}
                    />
                </View>
            </View>

            {/* Account Info */}
            <View style={dynamicStyles.section}>
                <Text style={[dynamicStyles.sectionTitle, { color: theme.colors.text }]}>
                    {t('profile.accountInfo')}
                </Text>

                <View style={[dynamicStyles.infoCard, { backgroundColor: theme.colors.card }]}>
                    <View style={dynamicStyles.infoRow}>
                        <Text style={[dynamicStyles.infoLabel, { color: theme.colors.textSecondary }]}>
                            {t('profile.username')}
                        </Text>
                        <Text style={[dynamicStyles.infoValue, { color: theme.colors.text }]}>
                            {user?.username}
                        </Text>
                    </View>

                    <View style={[dynamicStyles.infoRow, { borderTopColor: theme.colors.border }]}>
                        <Text style={[dynamicStyles.infoLabel, { color: theme.colors.textSecondary }]}>
                            {t('profile.email')}
                        </Text>
                        <Text style={[dynamicStyles.infoValue, { color: theme.colors.text }]}>
                            {user?.email}
                        </Text>
                    </View>

                    <View style={[dynamicStyles.infoRow, { borderTopColor: theme.colors.border }]}>
                        <Text style={[dynamicStyles.infoLabel, { color: theme.colors.textSecondary }]}>
                            {t('profile.role')}
                        </Text>
                        <Text style={[dynamicStyles.infoValue, { color: theme.colors.text }]}>
                            {getRoleName(user?.role)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View style={dynamicStyles.section}>
                <TouchableOpacity
                    style={[dynamicStyles.logoutButton, { backgroundColor: theme.colors.error }]}
                    onPress={handleLogout}
                >
                    <Text style={dynamicStyles.logoutText}>🚪 {t('common.logout')}</Text>
                </TouchableOpacity>
            </View>

            {/* App Info */}
            <View style={dynamicStyles.section}>
                <Text style={[dynamicStyles.appInfo, { color: theme.colors.textSecondary }]}>
                    LMS Mobil v1.0.0
                </Text>
                <Text style={[dynamicStyles.appInfo, { color: theme.colors.textSecondary }]}>
                    📱 React Native · Expo
                </Text>
            </View>
        </ScrollView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingBottom: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    settingSubtext: {
        fontSize: 13,
    },
    infoCard: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
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
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        gap: 6,
    },
    languageFlag: {
        fontSize: 18,
    },
    languageText: {
        fontSize: 13,
        fontWeight: '600',
    },
    appInfo: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 4,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default ProfileScreen;
