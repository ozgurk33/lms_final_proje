'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Alert,
    Chip,
    Grid
} from '@mui/material';
import {
    Videocam,
    Mic,
    CheckCircle,
    Warning,
    Refresh
} from '@mui/icons-material';

/**
 * MediaDeviceSelector Component
 * Select camera and microphone for live classes (Desktop optimized)
 */
export default function MediaDeviceSelector({ onDeviceChange }) {
    const [cameras, setCameras] = useState([]);
    const [microphones, setMicrophones] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedMicrophone, setSelectedMicrophone] = useState('');
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isElectron, setIsElectron] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
            setIsElectron(true);
        }
        loadDevices();
    }, []);

    const loadDevices = async () => {
        setLoading(true);
        try {
            // Desktop app method (auto-granted permissions)
            if (window.electronAPI?.getMediaDevices) {
                const result = await window.electronAPI.getMediaDevices();
                if (result.success) {
                    const cams = result.devices.filter(d => d.kind === 'videoinput');
                    const mics = result.devices.filter(d => d.kind === 'audioinput');
                    setCameras(cams);
                    setMicrophones(mics);
                    setPermissionGranted(true);

                    // Auto-select first devices
                    if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
                    if (mics.length > 0) setSelectedMicrophone(mics[0].deviceId);
                }
            } else {
                // Browser method (requires permission)
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const devices = await navigator.mediaDevices.enumerateDevices();

                const cams = devices.filter(d => d.kind === 'videoinput');
                const mics = devices.filter(d => d.kind === 'audioinput');
                setCameras(cams);
                setMicrophones(mics);
                setPermissionGranted(true);

                if (cams.length > 0) setSelectedCamera(cams[0].deviceId);
                if (mics.length > 0) setSelectedMicrophone(mics[0].deviceId);

                // Stop stream after getting devices
                stream.getTracks().forEach(track => track.stop());
            }
        } catch (error) {
            console.error('Failed to get media devices:', error);
            setPermissionGranted(false);
        } finally {
            setLoading(false);
        }
    };

    const handleCameraChange = (deviceId) => {
        setSelectedCamera(deviceId);
        onDeviceChange?.({ type: 'camera', deviceId });
    };

    const handleMicrophoneChange = (deviceId) => {
        setSelectedMicrophone(deviceId);
        onDeviceChange?.({ type: 'microphone', deviceId });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                    Media Devices
                </Typography>
                {isElectron && (
                    <Chip
                        icon={<CheckCircle />}
                        label="Desktop Mode"
                        color="success"
                        size="small"
                    />
                )}
            </Box>

            {!permissionGranted && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Camera and microphone permissions needed for live classes
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Grid container spacing={2}>
                        {/* Camera Selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Camera</InputLabel>
                                <Select
                                    value={selectedCamera}
                                    onChange={(e) => handleCameraChange(e.target.value)}
                                    label="Camera"
                                    startAdornment={<Videocam sx={{ mr: 1, color: 'action.active' }} />}
                                    disabled={cameras.length === 0}
                                >
                                    {cameras.map((camera) => (
                                        <MenuItem key={camera.deviceId} value={camera.deviceId}>
                                            {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                                        </MenuItem>
                                    ))}
                                    {cameras.length === 0 && (
                                        <MenuItem value="" disabled>
                                            No cameras found
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Microphone Selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Microphone</InputLabel>
                                <Select
                                    value={selectedMicrophone}
                                    onChange={(e) => handleMicrophoneChange(e.target.value)}
                                    label="Microphone"
                                    startAdornment={<Mic sx={{ mr: 1, color: 'action.active' }} />}
                                    disabled={microphones.length === 0}
                                >
                                    {microphones.map((mic) => (
                                        <MenuItem key={mic.deviceId} value={mic.deviceId}>
                                            {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                                        </MenuItem>
                                    ))}
                                    {microphones.length === 0 && (
                                        <MenuItem value="" disabled>
                                            No microphones found
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Device Info */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Chip
                                    icon={<Videocam />}
                                    label={`${cameras.length} Camera${cameras.length !== 1 ? 's' : ''}`}
                                    variant="outlined"
                                    size="small"
                                />
                                <Chip
                                    icon={<Mic />}
                                    label={`${microphones.length} Microphone${microphones.length !== 1 ? 's' : ''}`}
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                        </Grid>

                        {/* Refresh Button */}
                        <Grid item xs={12}>
                            <Button
                                startIcon={<Refresh />}
                                onClick={loadDevices}
                                disabled={loading}
                                size="small"
                            >
                                Refresh Devices
                            </Button>
                        </Grid>

                        {/* Desktop Advantage */}
                        {isElectron && (
                            <Grid item xs={12}>
                                <Alert severity="success">
                                    <strong>Desktop App Advantage:</strong> Automatic permissions, no browser prompts!
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
