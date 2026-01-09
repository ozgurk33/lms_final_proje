'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Container,
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    Divider,
    CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

export default function LoginPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempToken, setTempToken] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login(
                formData.usernameOrEmail,
                formData.password
            );

            if (response.requiresTwoFactor) {
                setRequires2FA(true);
                setTempToken(response.tempToken);
            } else {
                setAuth(response.user, response.accessToken, response.refreshToken);
                router.push('/dashboard');
            }
        } catch (err) {
            console.error('Login Error:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Login failed';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login2FA(twoFactorCode);
            setAuth(response.user, response.accessToken, response.refreshToken);
            router.push('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || '2FA verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (requires2FA) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8 }}>
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h5" align="center" gutterBottom>
                            {t('auth.twoFactor')}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                            {t('auth.enterCode')}
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handle2FASubmit}>
                            <TextField
                                fullWidth
                                label={t('auth.enterCode')}
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                required
                                autoFocus
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : t('auth.verify')}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        {t('auth.login')}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label={t('auth.username') + ' / ' + t('auth.email')}
                            name="usernameOrEmail"
                            value={formData.usernameOrEmail}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            type="password"
                            label={t('auth.password')}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mb: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : t('auth.login')}
                        </Button>
                    </Box>

                    <Divider sx={{ my: 2 }}>{t('common.or')}</Divider>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        sx={{ mb: 2 }}
                    >
                        {t('auth.signInWithGoogle')}
                    </Button>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2">
                            {t('auth.noAccount')}{' '}
                            <Link href="/register" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                                {t('auth.register')}
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
