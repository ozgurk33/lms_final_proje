import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import AuthService from '../../services/AuthService';
import BiometricService from '../../services/BiometricService';
import { t } from '../../i18n';

const LoginScreen = ({ navigation }) => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        const enabled = await BiometricService.isBiometricEnabled();
        const { available } = await BiometricService.isAvailable();
        setBiometricAvailable(enabled && available);
    };

    const handleLogin = async () => {
        if (!usernameOrEmail || !password) {
            Alert.alert(t('common.error'), 'Lütfen kullanıcı adı/email ve şifre giriniz.');
            return;
        }

        setLoading(true);
        const result = await AuthService.login(usernameOrEmail, password);
        setLoading(false);

        if (result.success) {
            // Ask user if they want to enable biometric login
            const { available } = await BiometricService.isAvailable();
            const isEnabled = await BiometricService.isBiometricEnabled();

            if (available && !isEnabled) {
                Alert.alert(
                    t('profile.biometric'),
                    t('profile.enableBiometric'),
                    [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                            text: t('common.confirm'),
                            onPress: async () => {
                                const result = await BiometricService.enableBiometric(
                                    usernameOrEmail,
                                    password
                                );
                                if (result.success) {
                                    setBiometricAvailable(true);
                                }
                            },
                        },
                    ]
                );
            }
        } else {
            Alert.alert(t('auth.loginError'), result.error);
        }
    };

    const handleBiometricLogin = async () => {
        setLoading(true);
        const credentials = await BiometricService.getStoredCredentials();
        setLoading(false);

        if (!credentials) {
            Alert.alert(t('common.error'), t('auth.biometricError'));
            return;
        }

        setLoading(true);
        const result = await AuthService.login(credentials.username, credentials.password);
        setLoading(false);

        if (!result.success) {
            Alert.alert(t('auth.loginError'), result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.content}>
                <Text style={styles.title}>LMS Mobil</Text>
                <Text style={styles.subtitle}>{t('auth.login')}</Text>

                <TextInput
                    style={styles.input}
                    placeholder={t('auth.usernameOrEmail')}
                    value={usernameOrEmail}
                    onChangeText={setUsernameOrEmail}
                    autoCapitalize="none"
                    editable={!loading}
                />

                <TextInput
                    style={styles.input}
                    placeholder={t('auth.password')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>{t('auth.login')}</Text>
                    )}
                </TouchableOpacity>

                {biometricAvailable && (
                    <TouchableOpacity
                        style={[styles.biometricButton]}
                        onPress={handleBiometricLogin}
                        disabled={loading}>
                        <Text style={styles.biometricText}>🔐 {t('auth.loginWithBiometrics')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 20,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    biometricButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    biometricText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LoginScreen;
