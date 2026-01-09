import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';
const STORED_CREDENTIALS_KEY = 'storedCredentials';

class BiometricService {
    // Check if device supports biometric authentication
    async isAvailable() {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            if (!compatible) {
                return { available: false, reason: 'nohardware' };
            }

            const enrolled = await LocalAuthentication.isEnrolledAsync();
            if (!enrolled) {
                return { available: false, reason: 'noenrolled' };
            }

            return { available: true };
        } catch (error) {
            console.error('Biometric availability check failed:', error);
            return { available: false, reason: 'error' };
        }
    }

    // Authenticate using biometrics
    async authenticate(promptMessage = 'Authenticate to login') {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel: 'Use Password',
                disableDeviceFallback: false,
            });

            return result.success;
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            return false;
        }
    }

    // Enable biometric login and store credentials securely
    async enableBiometric(username, password) {
        try {
            const { available } = await this.isAvailable();
            if (!available) {
                return { success: false, error: 'Biometric not available' };
            }

            // Authenticate first
            const authenticated = await this.authenticate('Enable biometric login');
            if (!authenticated) {
                return { success: false, error: 'Authentication failed' };
            }

            // Store credentials securely
            await SecureStore.setItemAsync(
                STORED_CREDENTIALS_KEY,
                JSON.stringify({ username, password })
            );
            await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');

            return { success: true };
        } catch (error) {
            console.error('Failed to enable biometric:', error);
            return { success: false, error: error.message };
        }
    }

    // Disable biometric login
    async disableBiometric() {
        try {
            await SecureStore.deleteItemAsync(STORED_CREDENTIALS_KEY);
            await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
            return { success: true };
        } catch (error) {
            console.error('Failed to disable biometric:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if biometric is enabled
    async isBiometricEnabled() {
        try {
            const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
            return enabled === 'true';
        } catch (error) {
            console.error('Failed to check biometric status:', error);
            return false;
        }
    }

    // Get stored credentials after biometric authentication
    async getStoredCredentials() {
        try {
            const authenticated = await this.authenticate('Login with biometrics');
            if (!authenticated) {
                return null;
            }

            const credentialsJson = await SecureStore.getItemAsync(STORED_CREDENTIALS_KEY);
            if (!credentialsJson) {
                return null;
            }

            return JSON.parse(credentialsJson);
        } catch (error) {
            console.error('Failed to get stored credentials:', error);
            return null;
        }
    }

    // Get supported biometric types
    async getSupportedTypes() {
        try {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            return types;
        } catch (error) {
            console.error('Failed to get supported types:', error);
            return [];
        }
    }
}

export default new BiometricService();
