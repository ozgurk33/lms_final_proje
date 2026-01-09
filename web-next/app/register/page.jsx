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
    CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/authService';

export default function RegisterPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            await authService.register(
                formData.username,
                formData.email,
                formData.password,
                formData.fullName
            );
            router.push('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        {t('auth.register')}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label={t('auth.fullName')}
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label={t('auth.username')}
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            type="email"
                            label={t('auth.email')}
                            name="email"
                            value={formData.email}
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
                            helperText="Min 8 chars, 1 uppercase, 1 number, 1 special char"
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
                            {loading ? <CircularProgress size={24} /> : t('auth.register')}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2">
                            {t('auth.haveAccount')}{' '}
                            <Link href="/login" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                                {t('auth.login')}
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
