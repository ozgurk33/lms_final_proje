'use client';

import { useEffect, useState } from 'react';
import { Snackbar, Alert, Chip, Box } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';

export default function OfflineModeIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        if (window.electronAPI && window.electronAPI.onOfflineModeChanged) {
            // Listen for offline mode changes from Electron main process
            window.electronAPI.onOfflineModeChanged((offline) => {
                setIsOffline(offline);
                setShowNotification(true);
            });

            // Get initial offline state from electron-store
            if (window.electronAPI.storeGet) {
                window.electronAPI.storeGet('offlineMode').then((value) => {
                    if (value) setIsOffline(value);
                });
            }
        }
    }, []);

    return (
        <>
            {/* Offline mode indicator badge */}
            {isOffline && (
                <Box sx={{ position: 'fixed', top: 70, right: 20, zIndex: 9999 }}>
                    <Chip
                        icon={<WifiOff />}
                        label="Offline Mode"
                        color="warning"
                        size="small"
                        sx={{
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    />
                </Box>
            )}

            {/* Notification toast */}
            <Snackbar
                open={showNotification}
                autoHideDuration={3000}
                onClose={() => setShowNotification(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setShowNotification(false)}
                    severity={isOffline ? 'warning' : 'success'}
                    icon={isOffline ? <WifiOff /> : <Wifi />}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {isOffline
                        ? 'Offline mode enabled - Working with local data'
                        : 'Online mode - Connected to server'}
                </Alert>
            </Snackbar>
        </>
    );
}
