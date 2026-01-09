'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Grid
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Mic as MicIcon,
    Stop as StopIcon
} from '@mui/icons-material';
import useElectron from '@/hooks/useElectron';

export default function MediaDevicesPage() {
    const { isElectron, electronAPI } = useElectron();
    const [devices, setDevices] = useState({ cameras: [], microphones: [] });
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedMic, setSelectedMic] = useState('');
    const [isCameraTesting, setIsCameraTesting] = useState(false);
    const [isMicTesting, setIsMicTesting] = useState(false);
    const [micLevel, setMicLevel] = useState(0);

    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);

    // Load media devices
    const loadDevices = async () => {
        if (isElectron) {
            const result = await electronAPI.getMediaDevices();
            if (result.success) {
                const cameras = result.devices.filter(d => d.kind === 'videoinput');
                const microphones = result.devices.filter(d => d.kind === 'audioinput');

                setDevices({ cameras, microphones });

                if (cameras.length > 0 && !selectedCamera) {
                    setSelectedCamera(cameras[0].deviceId);
                }
                if (microphones.length > 0 && !selectedMic) {
                    setSelectedMic(microphones[0].deviceId);
                }
            }
        } else {
            // Fallback for browser
            try {
                const devicesList = await navigator.mediaDevices.enumerateDevices();
                const cameras = devicesList.filter(d => d.kind === 'videoinput');
                const microphones = devicesList.filter(d => d.kind === 'audioinput');

                setDevices({ cameras, microphones });

                if (cameras.length > 0 && !selectedCamera) {
                    setSelectedCamera(cameras[0].deviceId);
                }
                if (microphones.length > 0 && !selectedMic) {
                    setSelectedMic(microphones[0].deviceId);
                }
            } catch (error) {
                console.error('Error loading devices:', error);
            }
        }
    };

    // Test camera
    const handleTestCamera = async () => {
        if (isCameraTesting) {
            // Stop camera
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            setIsCameraTesting(false);
        } else {
            // Start camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                    setIsCameraTesting(true);
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                alert('Kameraya erişilemedi: ' + error.message);
            }
        }
    };

    // Test microphone
    const handleTestMic = async () => {
        if (isMicTesting) {
            // Stop microphone
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            setIsMicTesting(false);
            setMicLevel(0);
        } else {
            // Start microphone
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined }
                });

                streamRef.current = stream;

                // Create audio context for volume detection
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(stream);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                microphone.connect(analyser);
                analyser.fftSize = 256;

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                setIsMicTesting(true);

                // Monitor volume
                const checkVolume = () => {
                    if (!isMicTesting) return;

                    analyser.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setMicLevel(Math.min(100, (average / 128) * 100));

                    requestAnimationFrame(checkVolume);
                };
                checkVolume();
            } catch (error) {
                console.error('Error accessing microphone:', error);
                alert('Mikrofona erişilemedi: ' + error.message);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        loadDevices();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                🎥 Medya Cihazları Testi
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                Canlı ders ve sınav gözetimi için kamera ve mikrofon ayarlarınızı test edin.
            </Alert>

            <Grid container spacing={3}>
                {/* Camera Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📹 Kamera Testi
                        </Typography>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Kamera Seç</InputLabel>
                            <Select
                                value={selectedCamera}
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                disabled={isCameraTesting}
                            >
                                {devices.cameras.map((camera) => (
                                    <MenuItem key={camera.deviceId} value={camera.deviceId}>
                                        {camera.label || `Kamera ${devices.cameras.indexOf(camera) + 1}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            startIcon={isCameraTesting ? <StopIcon /> : <VideocamIcon />}
                            onClick={handleTestCamera}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            {isCameraTesting ? 'Testi Durdur' : 'Kamerayı Test Et'}
                        </Button>

                        {isCameraTesting && (
                            <Box
                                sx={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                    bgcolor: 'black',
                                    borderRadius: 2,
                                    overflow: 'hidden'
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Microphone Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            🎤 Mikrofon Testi
                        </Typography>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Mikrofon Seç</InputLabel>
                            <Select
                                value={selectedMic}
                                onChange={(e) => setSelectedMic(e.target.value)}
                                disabled={isMicTesting}
                            >
                                {devices.microphones.map((mic) => (
                                    <MenuItem key={mic.deviceId} value={mic.deviceId}>
                                        {mic.label || `Mikrofon ${devices.microphones.indexOf(mic) + 1}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            startIcon={isMicTesting ? <StopIcon /> : <MicIcon />}
                            onClick={handleTestMic}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            {isMicTesting ? 'Testi Durdur' : 'Mikrofonu Test Et'}
                        </Button>

                        {isMicTesting && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Ses Seviyesi
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={micLevel}
                                    sx={{
                                        height: 20,
                                        borderRadius: 2,
                                        bgcolor: 'grey.200',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: micLevel > 70 ? 'success.main' : micLevel > 30 ? 'warning.main' : 'error.main'
                                        }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Mikrofona konuşun ve ses seviyesini kontrol edin
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
