import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.191.67.133:3000'; // School network IP - update when network changes

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds for OMR file uploads (increased from 60s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  async (config) => {
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    console.log('  - BaseURL:', config.baseURL);
    console.log('  - Full URL:', `${config.baseURL}${config.url}`);
    console.log('  - Content-Type:', config.headers['Content-Type']);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('  - Auth: Token attached');
      } else {
        console.log('  - Auth: No token');
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized - clear token and redirect to login
      if (error.response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
