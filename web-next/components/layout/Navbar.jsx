'use client';

import { AppBar, Toolbar, Typography, Button, IconButton, Box, Menu, MenuItem } from '@mui/material';
import { Brightness4, Brightness7, Language, AccountCircle } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

export default function Navbar() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { mode, toggleTheme } = useThemeStore();
    const { user, isAuthenticated, logout, refreshToken } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    const [langAnchor, setLangAnchor] = useState(null);
    const [userAnchor, setUserAnchor] = useState(null);

    // Prevent hydration errors
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout(refreshToken);
        } catch (err) {
            console.error('Logout error:', err);
        }
        logout();
        router.push('/login');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setLangAnchor(null);
    };

    // Show loading state during mount to prevent hydration mismatch
    if (!mounted) {
        return (
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        LMS
                    </Typography>
                </Toolbar>
            </AppBar>
        );
    }

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }}
                    onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')}>
                    LMS
                </Typography>

                {isAuthenticated && (user.role === 'STUDENT' || user.role === 'GUEST') && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button color="inherit" onClick={() => router.push('/courses')}>
                            {t('nav.courses')}
                        </Button>
                        <Button color="inherit" onClick={() => router.push('/quizzes')}>
                            {t('nav.quizzes')}
                        </Button>
                    </Box>
                )}

                <IconButton color="inherit" onClick={toggleTheme}>
                    {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>

                <IconButton color="inherit" onClick={(e) => setLangAnchor(e.currentTarget)}>
                    <Language />
                </IconButton>
                <Menu
                    anchorEl={langAnchor}
                    open={Boolean(langAnchor)}
                    onClose={() => setLangAnchor(null)}
                >
                    <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
                    <MenuItem onClick={() => changeLanguage('tr')}>Türkçe</MenuItem>
                    <MenuItem onClick={() => changeLanguage('de')}>Deutsch</MenuItem>
                </Menu>

                {isAuthenticated ? (
                    <>
                        <IconButton color="inherit" onClick={(e) => setUserAnchor(e.currentTarget)}>
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            anchorEl={userAnchor}
                            open={Boolean(userAnchor)}
                            onClose={() => setUserAnchor(null)}
                        >
                            <MenuItem onClick={() => { setUserAnchor(null); router.push('/profile'); }}>
                                {t('nav.profile')}
                            </MenuItem>
                            <MenuItem onClick={() => { setUserAnchor(null); router.push('/settings'); }}>
                                {t('nav.settings')}
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>{t('nav.logout')}</MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Button color="inherit" onClick={() => router.push('/login')}>
                        {t('auth.login')}
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
}
