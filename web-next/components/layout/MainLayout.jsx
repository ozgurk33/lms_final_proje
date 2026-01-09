'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { Box, IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import Navbar from './Navbar';
import OfflineModeIndicator from './OfflineModeIndicator';
import OfflineIndicator from '../OfflineIndicator';
import { isSEBBrowser } from '@/utils/sebDetector';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function MainLayout({ children }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const mode = useThemeStore((state) => state.mode);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const setAuth = useAuthStore((state) => state.setAuth);

    // Auto-login if seb_token is present
    useEffect(() => {
        const sebToken = searchParams.get('seb_token');
        if (sebToken && !isAuthenticated) {
            console.log('🔐 MainLayout: SEB token found, auto-authenticating...');
            // Store token
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth', JSON.stringify({ token: sebToken }));
            }
            // Set auth state
            setAuth({ id: 'seb-user', role: 'STUDENT' }, sebToken, null);
        }
    }, [searchParams, isAuthenticated, setAuth]);

    // Check if in SEB exam mode:
    // 1. Has seb_token in URL
    // 2. Is detected as SEB browser
    // 3. Is on quiz take page or seb-quit page
    const hasSEBToken = searchParams.get('seb_token') !== null;
    const isInSEB = isSEBBrowser();
    const isQuizTakePage = pathname.includes('/quizzes/') && pathname.includes('/take');
    const isSEBQuitPage = pathname.includes('/seb-quit');

    // Enter SEB exam mode if any of these conditions are true
    const isSEBExamMode = (hasSEBToken || isInSEB) && (isQuizTakePage || isSEBQuitPage);

    // In SEB exam mode: show ONLY the content with dark mode toggle, no navbar
    if (isSEBExamMode) {
        return (
            <Box sx={{
                minHeight: '100vh',
                // Prevent any text selection in exam mode
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                position: 'relative'
            }}>
                {/* Dark Mode Toggle & Offline Indicator - Fixed in top right corner */}
                <Box sx={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 1000,
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center'
                }}>
                    <OfflineIndicator />
                    <Tooltip title={mode === 'dark' ? 'Açık Mod' : 'Koyu Mod'}>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{
                                bgcolor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': {
                                    bgcolor: 'background.paper',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            {mode === 'dark' ? <LightMode /> : <DarkMode />}
                        </IconButton>
                    </Tooltip>
                </Box>
                {children}
            </Box>
        );
    }

    // Normal mode: show full layout with navbar
    return (
        <Box>
            <Navbar />
            <OfflineModeIndicator />
            <Box component="main">
                {children}
            </Box>
        </Box>
    );
}
