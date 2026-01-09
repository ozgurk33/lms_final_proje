'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';
import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import '../i18n/config';

export default function Providers({ children }) {
    const mode = useThemeStore((state) => state.mode);

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: mode === 'dark' ? '#6366f1' : '#4f46e5',
                light: '#818cf8',
                dark: '#3730a3',
            },
            secondary: {
                main: mode === 'dark' ? '#ec4899' : '#db2777',
                light: '#f472b6',
                dark: '#be185d',
            },
            background: {
                default: mode === 'dark' ? '#0f172a' : '#f8fafc',
                paper: mode === 'dark' ? '#1e293b' : '#ffffff',
            },
            success: {
                main: '#10b981',
            },
            warning: {
                main: '#f59e0b',
            },
            error: {
                main: '#ef4444',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h4: {
                fontWeight: 700,
            },
            h6: {
                fontWeight: 600,
            },
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: mode === 'dark'
                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: mode === 'dark'
                                ? '0 20px 25px -5px rgba(0, 0, 0, 0.6)'
                                : '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 8,
                    },
                    contained: {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                        },
                    },
                },
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Suspense fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            }>
                {children}
            </Suspense>
        </ThemeProvider>
    );
}
