import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import tr from './locales/tr.json';
import en from './locales/en.json';
import de from './locales/de.json';

const i18n = new I18n({
    tr,
    en,
    de,
});

// Set the locale once at the beginning of your app
// Handle undefined locale by defaulting to Turkish
const deviceLocale = Localization.locale || Localization.getLocales?.()?.[0]?.languageCode || 'tr';
i18n.locale = deviceLocale.split('-')[0]; // 'en-US' -> 'en'

// When a value is missing from a language it'll fall back to another language with the key present
i18n.enableFallback = true;
i18n.defaultLocale = 'tr';

export const initI18n = async () => {
    try {
        const savedLocale = await AsyncStorage.getItem('locale');
        if (savedLocale) {
            i18n.locale = savedLocale;
        } else {
            // Use device locale with safe fallback
            const deviceLocale = (Localization.locale || Localization.getLocales?.()?.[0]?.languageCode || 'tr').split('-')[0];
            if (['tr', 'en', 'de'].includes(deviceLocale)) {
                i18n.locale = deviceLocale;
            } else {
                i18n.locale = 'tr'; // Default to Turkish
            }
        }
    } catch (error) {
        console.error('Failed to load locale:', error);
        i18n.locale = 'tr';
    }
};

export const changeLocale = async (locale) => {
    try {
        i18n.locale = locale;
        await AsyncStorage.setItem('locale', locale);
    } catch (error) {
        console.error('Failed to save locale:', error);
    }
};

export const getCurrentLocale = () => i18n.locale;

export const t = (key, options = {}) => i18n.t(key, options);

export const availableLocales = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default i18n;
