'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Chip,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    Alert,
    List,
    ListItem,
    ListItemText,
    CircularProgress
} from '@mui/material';
import {
    CloudOff,
    CloudQueue,
    Sync,
    CheckCircle,
    Warning
} from '@mui/icons-material';

/**
 * OfflineIndicator Component
 * Shows online/offline status and sync queue
 */
export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [offlineMode, setOfflineMode] = useState(false);
    const [pendingSync, setPendingSync] = useState([]);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
            setIsElectron(true);
            loadOfflineSettings();
            setupOfflineListeners();
        }

        // Browser online/offline detection
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));

        return () => {
            window.removeEventListener('online', () => setIsOnline(true));
            window.removeEventListener('offline', () => setIsOnline(false));
        };
    }, []);

    const loadOfflineSettings = async () => {
        if (window.electronAPI) {
            const mode = await window.electronAPI.storeGet('offlineMode');
            setOfflineMode(mode || false);

            const pending = await window.electronAPI.storeGet('pendingChanges');
            setPendingSync(pending || []);
        }
    };

    const setupOfflineListeners = () => {
        if (window.electronAPI) {
            window.electronAPI.onOfflineModeChanged((isOffline) => {
                setOfflineMode(isOffline);
            });
        }
    };

    const handleOfflineModeToggle = async (enabled) => {
        if (window.electronAPI) {
            await window.electronAPI.storeSet('offlineMode', enabled);
            setOfflineMode(enabled);
        }
    };

    const getStatusColor = () => {
        if (!isOnline) return 'error';
        if (offlineMode) return 'warning';
        return 'success';
    };

    const getStatusIcon = () => {
        if (!isOnline) return <CloudOff />;
        if (offlineMode) return <CloudQueue />;
        return <CheckCircle />;
    };

    const getStatusText = () => {
        if (!isOnline) return 'No Internet Connection';
        if (offlineMode) return 'Offline Mode';
        return 'Online';
    };

    return (
        <Box>
            {/* Status Badge */}
            <Chip
                icon={getStatusIcon()}
                label={getStatusText()}
                color={getStatusColor()}
                sx={{ mb: 2 }}
            />

            {/* Offline Mode Toggle (Desktop only) */}
            {isElectron && (
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={offlineMode}
                                    onChange={(e) => handleOfflineModeToggle(e.target.checked)}
                                    disabled={!isOnline}
                                />
                            }
                            label="Offline Mode"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                            Work offline and sync changes when back online
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Pending Sync Queue */}
            {pendingSync.length > 0 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Sync sx={{ mr: 1 }} />
                            <Typography variant="h6">
                                Pending Sync ({pendingSync.length})
                            </Typography>
                        </Box>

                        <List dense>
                            {pendingSync.map((item, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={item.type}
                                        secondary={new Date(item.timestamp).toLocaleString()}
                                    />
                                    {!isOnline ? (
                                        <Warning color="warning" />
                                    ) : (
                                        <CircularProgress size={20} />
                                    )}
                                </ListItem>
                            ))}
                        </List>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            Changes will sync automatically when you're back online
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* No Internet Warning */}
            {!isOnline && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    No internet connection. Some features may be limited.
                </Alert>
            )}
        </Box>
    );
}
