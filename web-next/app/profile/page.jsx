'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Avatar,
    Grid,
    Alert
} from '@mui/material';
import { PhotoCamera, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

export default function ProfilePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        username: user?.username || '',
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');

            const response = await api.put(`/api/users/${user.id}`, {
                fullName: formData.fullName
            });

            // Update user in store
            setUser({ ...user, fullName: formData.fullName });
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Failed to update profile: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    My Profile
                </Typography>

                {message && (
                    <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mb: 3 }}>
                        {message}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Profile Picture */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        mx: 'auto',
                                        mb: 2,
                                        fontSize: '3rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    }}
                                >
                                    {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                                </Avatar>
                                <Typography variant="h6" gutterBottom>
                                    {user?.fullName || user?.username}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {user?.role}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<PhotoCamera />}
                                    size="small"
                                    sx={{ mt: 2 }}
                                    disabled
                                >
                                    Change Photo
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Profile Information */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Personal Information
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={formData.fullName}
                                    onChange={(e) => handleChange('fullName', e.target.value)}
                                    sx={{ mb: 2, mt: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={formData.email}
                                    disabled
                                    helperText="Email cannot be changed"
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Username"
                                    value={formData.username}
                                    disabled
                                    helperText="Username cannot be changed"
                                    sx={{ mb: 3 }}
                                />

                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Account Stats */}
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Account Statistics
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Member Since
                                        </Typography>
                                        <Typography variant="h6">
                                            {new Date(user?.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Last Login
                                        </Typography>
                                        <Typography variant="h6">
                                            {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}

