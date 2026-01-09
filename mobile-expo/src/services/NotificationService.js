import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {
    constructor() {
        this.expoPushToken = null;
        this.notificationListener = null;
        this.responseListener = null;
    }

    // Register for push notifications
    async registerForPushNotifications() {
        try {
            if (!Device.isDevice) {
                // Silently fail on simulator/emulator
                console.log('Push notifications only work on physical devices');
                return { success: true, warning: 'Not a physical device' };
            }

            // Check if notifications are enabled
            const enabled = await this.isNotificationsEnabled();
            if (!enabled) {
                return { success: false, error: 'Notifications disabled by user' };
            }

            // Get permission
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                return { success: false, error: 'Permission not granted' };
            }

            // Get push notification token (Expo Go on Android doesn't support this in SDK 53+)
            try {
                const { data: token } = await Notifications.getExpoPushTokenAsync();

                if (token) {
                    this.expoPushToken = token;
                    // Token successfully obtained - would send to backend here
                }
            } catch (tokenError) {
                // Silently handle Expo Go limitations - local notifications still work
            }

            // Configure Android channel
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            return { success: true, token: this.expoPushToken };
        } catch (error) {
            // Return success anyway to not block notification features
            return { success: true };
        }
    }

    // Setup notification listeners
    setupListeners(onNotificationReceived, onNotificationResponse) {
        // Listener for notifications received while app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            if (onNotificationReceived) {
                onNotificationReceived(notification);
            }
        });

        // Listener for when user taps on notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            if (onNotificationResponse) {
                onNotificationResponse(response);
            }
        });
    }

    // Remove listeners
    removeListeners() {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }

    // Schedule local notification
    async scheduleNotification(title, body, data = {}, trigger = null) {
        try {
            const enabled = await this.isNotificationsEnabled();
            if (!enabled) {
                return { success: false, error: 'Notifications disabled' };
            }

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: true,
                },
                trigger: trigger || null, // null means immediate
            });

            return { success: true, id };
        } catch (error) {
            console.error('Failed to schedule notification:', error);
            return { success: false, error: error.message };
        }
    }

    // Cancel scheduled notification
    async cancelNotification(notificationId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            return { success: true };
        } catch (error) {
            console.error('Failed to cancel notification:', error);
            return { success: false, error: error.message };
        }
    }

    // Cancel all scheduled notifications
    async cancelAllNotifications() {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            return { success: true };
        } catch (error) {
            console.error('Failed to cancel all notifications:', error);
            return { success: false, error: error.message };
        }
    }

    // Enable/disable notifications
    async setNotificationsEnabled(enabled) {
        try {
            await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');

            if (enabled) {
                await this.registerForPushNotifications();
            } else {
                await this.cancelAllNotifications();
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to set notifications enabled:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if notifications are enabled
    async isNotificationsEnabled() {
        try {
            const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
            return enabled === 'true';
        } catch (error) {
            console.error('Failed to check notifications status:', error);
            return false;
        }
    }

    // Get push token
    getPushToken() {
        return this.expoPushToken;
    }
}

export default new NotificationService();
