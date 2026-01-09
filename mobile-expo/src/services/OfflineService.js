import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'offline_cache_';
const CACHE_TIMESTAMP_PREFIX = 'cache_timestamp_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

class OfflineService {
    constructor() {
        this.isOnline = true;
        this.listeners = [];
        this.initNetworkListener();
    }

    // Initialize network state listener
    initNetworkListener() {
        NetInfo.addEventListener(state => {
            const wasOnline = this.isOnline;
            this.isOnline = state.isConnected && state.isInternetReachable;

            // Notify listeners of network change
            if (wasOnline !== this.isOnline) {
                this.notifyListeners(this.isOnline);
            }
        });
    }

    // Subscribe to network changes
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    // Notify all listeners
    notifyListeners(isOnline) {
        this.listeners.forEach(callback => callback(isOnline));
    }

    // Check if device is online
    async checkConnection() {
        const state = await NetInfo.fetch();
        this.isOnline = state.isConnected && state.isInternetReachable;
        return this.isOnline;
    }

    // Cache data
    async cacheData(key, data) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const timestampKey = CACHE_TIMESTAMP_PREFIX + key;

            await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
            await AsyncStorage.setItem(timestampKey, Date.now().toString());

            return { success: true };
        } catch (error) {
            console.error('Failed to cache data:', error);
            return { success: false, error: error.message };
        }
    }

    // Get cached data
    async getCachedData(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const timestampKey = CACHE_TIMESTAMP_PREFIX + key;

            const cachedData = await AsyncStorage.getItem(cacheKey);
            const timestamp = await AsyncStorage.getItem(timestampKey);

            if (!cachedData || !timestamp) {
                return null;
            }

            // Check if cache is expired
            const age = Date.now() - parseInt(timestamp);
            if (age > CACHE_EXPIRY_MS) {
                // Cache expired, remove it
                await this.removeCachedData(key);
                return null;
            }

            return JSON.parse(cachedData);
        } catch (error) {
            console.error('Failed to get cached data:', error);
            return null;
        }
    }

    // Remove cached data
    async removeCachedData(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const timestampKey = CACHE_TIMESTAMP_PREFIX + key;

            await AsyncStorage.removeItem(cacheKey);
            await AsyncStorage.removeItem(timestampKey);

            return { success: true };
        } catch (error) {
            console.error('Failed to remove cached data:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear all cache
    async clearAllCache() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(
                key => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_TIMESTAMP_PREFIX)
            );

            await AsyncStorage.multiRemove(cacheKeys);

            return { success: true };
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return { success: false, error: error.message };
        }
    }

    // Fetch with cache fallback
    async fetchWithCache(key, fetchFunction) {
        const isOnline = await this.checkConnection();

        if (isOnline) {
            try {
                // Try to fetch fresh data
                const data = await fetchFunction();
                // Cache the fresh data
                await this.cacheData(key, data);
                return { data, fromCache: false };
            } catch (error) {
                // If fetch fails, try cache
                const cachedData = await this.getCachedData(key);
                if (cachedData) {
                    return { data: cachedData, fromCache: true };
                }
                throw error;
            }
        } else {
            // Offline, use cache
            const cachedData = await this.getCachedData(key);
            if (cachedData) {
                return { data: cachedData, fromCache: true };
            }
            throw new Error('No internet connection and no cached data available');
        }
    }

    // Get network status
    getStatus() {
        return this.isOnline;
    }
}

export default new OfflineService();
