'use client';

import { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Divider,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import { Lock, Notifications, Palette, Security, QrCode2, CheckCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

export default function SettingsPage() {
    const { t, i18n } = useTranslation();
    const mode = useThemeStore((state) => state.mode);
    const toggleMode = useThemeStore((state) => state.toggleMode);
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    // 2FA States
    const [twoFAModalOpen, setTwoFAModalOpen] = useState(false);
    const [twoFAStep, setTwoFAStep] = useState('setup'); // 'setup' | 'verify' | 'success'
    const [twoFAData, setTwoFAData] = useState({ secret: '', qrCode: '' });
    const [verificationCode, setVerificationCode] = useState('');
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAError, setTwoFAError] = useState('');

    const handlePasswordChange = async () => {
        try {
            if (passwords.new !== passwords.confirm) {
                setMessage('New passwords do not match');
                return;
            }

            if (passwords.new.length < 8) {
                setMessage('New password must be at least 8 characters');
                return;
            }

            setSaving(true);
            setMessage('');

            await api.put(`/api/users/${user.id}`, {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });

            setMessage('Password changed successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            setMessage('Failed to change password: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    };

    // 2FA Setup
    const handleSetup2FA = async () => {
        setTwoFAModalOpen(true);
        setTwoFAStep('setup');
        setTwoFALoading(true);
        setTwoFAError('');
        setVerificationCode('');

        try {
            const response = await api.post('/auth/2fa/setup');
            setTwoFAData({
                secret: response.data.secret,
                qrCode: response.data.qrCode
            });
            setTwoFAStep('verify');
        } catch (error) {
            setTwoFAError('Failed to setup 2FA: ' + (error.response?.data?.error || error.message));
        } finally {
            setTwoFALoading(false);
        }
    };

    // 2FA Verify
    const handleVerify2FA = async () => {
        if (verificationCode.length !== 6) {
            setTwoFAError('Please enter a 6-digit code');
            return;
        }

        setTwoFALoading(true);
        setTwoFAError('');

        try {
            await api.post('/auth/2fa/verify', { token: verificationCode });
            setTwoFAStep('success');
            // Update user state to reflect 2FA is enabled
            if (setUser && user) {
                setUser({ ...user, twoFactorEnabled: true });
            }
        } catch (error) {
            setTwoFAError('Invalid verification code. Please try again.');
        } finally {
            setTwoFALoading(false);
        }
    };

    const handleClose2FAModal = () => {
        setTwoFAModalOpen(false);
        setTwoFAStep('setup');
        setTwoFAData({ secret: '', qrCode: '' });
        setVerificationCode('');
        setTwoFAError('');
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Settings
                </Typography>

                {message && (
                    <Alert
                        severity={message.includes('success') ? 'success' : 'error'}
                        sx={{ mb: 3 }}
                        onClose={() => setMessage('')}
                    >
                        {message}
                    </Alert>
                )}

                {/* Appearance */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Palette color="primary" />
                            <Typography variant="h6">
                                Appearance
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={mode === 'dark'}
                                    onChange={toggleMode}
                                />
                            }
                            label="Dark Mode"
                        />

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Language
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                    variant={i18n.language === 'en' ? 'contained' : 'outlined'}
                                    onClick={() => handleLanguageChange('en')}
                                    size="small"
                                >
                                    English
                                </Button>
                                <Button
                                    variant={i18n.language === 'tr' ? 'contained' : 'outlined'}
                                    onClick={() => handleLanguageChange('tr')}
                                    size="small"
                                >
                                    Türkçe
                                </Button>
                                <Button
                                    variant={i18n.language === 'de' ? 'contained' : 'outlined'}
                                    onClick={() => handleLanguageChange('de')}
                                    size="small"
                                >
                                    Deutsch
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Security color="primary" />
                            <Typography variant="h6">
                                Security
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Typography variant="subtitle1" gutterBottom>
                            Change Password
                        </Typography>

                        <TextField
                            fullWidth
                            type="password"
                            label="Current Password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            type="password"
                            label="New Password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            type="password"
                            label="Confirm New Password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            sx={{ mb: 2 }}
                        />

                        <Button
                            variant="contained"
                            startIcon={<Lock />}
                            onClick={handlePasswordChange}
                            disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                        >
                            {saving ? 'Changing...' : 'Change Password'}
                        </Button>

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle1" gutterBottom>
                            Two-Factor Authentication
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {user?.twoFactorEnabled
                                ? '✅ Two-factor authentication is enabled for your account.'
                                : '🔓 Two-factor authentication is not enabled. Enable it for extra security.'}
                        </Typography>
                        <Button
                            variant={user?.twoFactorEnabled ? 'outlined' : 'contained'}
                            color={user?.twoFactorEnabled ? 'success' : 'primary'}
                            startIcon={user?.twoFactorEnabled ? <CheckCircle /> : <QrCode2 />}
                            onClick={handleSetup2FA}
                            disabled={user?.twoFactorEnabled}
                        >
                            {user?.twoFactorEnabled ? '2FA Enabled' : 'Setup 2FA'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Notifications color="primary" />
                            <Typography variant="h6">
                                Notifications
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Email notifications for new courses"
                        />
                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Email notifications for quiz results"
                        />
                        <FormControlLabel
                            control={<Switch />}
                            label="Browser push notifications"
                        />
                    </CardContent>
                </Card>
            </Box>

            {/* 2FA Setup Modal */}
            <Dialog open={twoFAModalOpen} onClose={handleClose2FAModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {twoFAStep === 'success' ? '✅ 2FA Enabled!' : 'Setup Two-Factor Authentication'}
                </DialogTitle>
                <DialogContent>
                    {twoFALoading && twoFAStep === 'setup' && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {twoFAError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {twoFAError}
                        </Alert>
                    )}

                    {twoFAStep === 'verify' && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body1" gutterBottom>
                                1. Scan this QR code with your authenticator app
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                (Google Authenticator, Authy, etc.)
                            </Typography>

                            {twoFAData.qrCode && (
                                <Box sx={{ my: 3 }}>
                                    <img
                                        src={twoFAData.qrCode}
                                        alt="2FA QR Code"
                                        style={{ maxWidth: '200px', border: '1px solid #ddd', borderRadius: '8px' }}
                                    />
                                </Box>
                            )}

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Or enter this code manually:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontFamily: 'monospace',
                                    bgcolor: 'action.hover',
                                    p: 1,
                                    borderRadius: 1,
                                    mb: 3,
                                    wordBreak: 'break-all'
                                }}
                            >
                                {twoFAData.secret}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body1" gutterBottom>
                                2. Enter the 6-digit code from your app
                            </Typography>
                            <TextField
                                fullWidth
                                label="Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                inputProps={{
                                    maxLength: 6,
                                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                                }}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}

                    {twoFAStep === 'success' && (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Two-Factor Authentication Enabled!
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Your account is now protected with an extra layer of security.
                                You'll need to enter a code from your authenticator app when logging in.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {twoFAStep === 'verify' && (
                        <>
                            <Button onClick={handleClose2FAModal}>Cancel</Button>
                            <Button
                                variant="contained"
                                onClick={handleVerify2FA}
                                disabled={twoFALoading || verificationCode.length !== 6}
                            >
                                {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                            </Button>
                        </>
                    )}
                    {twoFAStep === 'success' && (
                        <Button variant="contained" onClick={handleClose2FAModal}>
                            Done
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    );
}
