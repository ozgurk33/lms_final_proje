'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Tabs,
    Tab,
    Divider,
    Grid
} from '@mui/material';
import {
    Download,
    CloudOff,
    Videocam,
    Settings,
    FolderOpen
} from '@mui/icons-material';
import DownloadManager from '@/components/desktop/DownloadManager';
import OfflineIndicator from '@/components/desktop/OfflineIndicator';
import MediaDeviceSelector from '@/components/desktop/MediaDeviceSelector';
import FileSystemTest from '@/components/desktop/FileSystemTest';

/**
 * Desktop Settings Page
 * Central hub for all desktop-specific features
 */
export default function DesktopSettingsPage() {
    const [tabValue, setTabValue] = useState(0);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
            setIsElectron(true);
        }
    }, []);

    if (!isElectron) {
        return (
            <Container maxWidth="md">
                <Box sx={{ my: 4, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                        Desktop Features
                    </Typography>
                    <Typography color="text.secondary">
                        These features are only available in the Desktop App.
                        <br />
                        Download the desktop app to access advanced features like offline mode, download manager, and more.
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Desktop Settings
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                    Manage desktop-specific features and preferences
                </Typography>

                <Card sx={{ mt: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab icon={<FolderOpen />} label="File System" />
                        <Tab icon={<Download />} label="Downloads" />
                        <Tab icon={<CloudOff />} label="Offline Mode" />
                        <Tab icon={<Videocam />} label="Media Devices" />
                        <Tab icon={<Settings />} label="General" />
                    </Tabs>

                    <Divider />

                    <CardContent>
                        {/* File System Tab */}
                        {tabValue === 0 && (
                            <FileSystemTest />
                        )}

                        {/* Downloads Tab */}
                        {tabValue === 1 && (
                            <DownloadManager />
                        )}

                        {/* Offline Mode Tab */}
                        {tabValue === 2 && (
                            <OfflineIndicator />
                        )}

                        {/* Media Devices Tab */}
                        {tabValue === 3 && (
                            <MediaDeviceSelector />
                        )}

                        {/* General Tab */}
                        {tabValue === 4 && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    General Settings
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    App Version
                                                </Typography>
                                                <Typography color="text.secondary">
                                                    LMS Desktop v1.0.0
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Auto-Update
                                                </Typography>
                                                <Typography color="text.secondary">
                                                    Check for updates automatically on startup
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    System Tray
                                                </Typography>
                                                <Typography color="text.secondary">
                                                    Minimize to system tray instead of closing. Access via tray icon.
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Desktop Features Overview */}
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Desktop App Features
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Download color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="subtitle2">
                                            Download Manager
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Track downloads with progress and history
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <CloudOff color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="subtitle2">
                                            Offline Mode
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Work offline and sync later
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Videocam color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="subtitle2">
                                            Media Access
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Automatic camera/mic permissions
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Settings color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="subtitle2">
                                            System Tray
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Run in background from tray
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}
