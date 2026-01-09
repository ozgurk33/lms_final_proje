import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthService = {
    async login(email, password) {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            const { token, user } = response.data;

            // Store token and user data
            await AsyncStorage.setItem('authToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(user));

            return { success: true, user, token };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed. Please try again.',
            };
        }
    },

    async logout() {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
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
