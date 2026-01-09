import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';

const AuthService = {
    async login(usernameOrEmail, password) {
        try {
            const response = await api.post('/api/auth/login', { usernameOrEmail, password });
            const { accessToken, refreshToken, user } = response.data;

            // Store tokens and user data
            await AsyncStorage.setItem('authToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('userData', JSON.stringify(user));

            // Emit login event for automatic navigation
            authEvents.emit(AUTH_EVENTS.LOGIN, user);

            return { success: true, user, token: accessToken };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed. Please try again.',
            };
        }
    },

    async logout() {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('userData');

            // Emit logout event for automatic navigation
            authEvents.emit(AUTH_EVENTS.LOGOUT);

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Logout failed' };
        }
    },

    async getCurrentUser() {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    async isAuthenticated() {
        try {
            const token = await AsyncStorage.getItem('authToken');
            return !!token;
        } catch (error) {
            return false;
        }
    },
};

export default AuthService;
