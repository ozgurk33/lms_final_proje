import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/utils/ThemeContext';
import { initI18n } from './src/i18n';

// Suppress Expo Go push notification warnings (expected limitation in SDK 53+)
LogBox.ignoreLogs([
  'expo-notifications',
  'Android Push notifications',
  'remote notifications',
]);

export default function App() {
  useEffect(() => {
    initI18n();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

