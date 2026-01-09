// Context for theme management (dark/light mode)
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setIsDark(savedTheme === 'dark');
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = !isDark;
            setIsDark(newTheme);
            await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

const lightTheme = {
    colors: {
        background: '#f5f5f5',
        card: '#ffffff',
        text: '#333333',
        textSecondary: '#666666',
        primary: '#007AFF',
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        border: '#e0e0e0',
        placeholder: '#999999',
    },
};

const darkTheme = {
    colors: {
        background: '#121212',
        card: '#1e1e1e',
        text: '#ffffff',
        textSecondary: '#b3b3b3',
        primary: '#0A84FF',
        success: '#30D158',
        error: '#FF453A',
        warning: '#FF9F0A',
        border: '#2c2c2c',
        placeholder: '#8e8e93',
    },
};
