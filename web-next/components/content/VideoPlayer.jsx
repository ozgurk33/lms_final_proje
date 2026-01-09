'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
    Box,
    IconButton,
    Slider,
    Typography,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Tooltip
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    VolumeUp,
    VolumeOff,
    Fullscreen,
    Settings,
    FullscreenExit
} from '@mui/icons-material';

/**
 * Advanced Video Player with HLS support
 * @param {string} src - Video source URL (HLS .m3u8 or regular video)
 * @param {string} poster - Poster image URL
 * @param {function} onProgress - Callback for progress updates
 */
export default function VideoPlayer({ src, poster, onProgress }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const containerRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [settingsAnchor, setSettingsAnchor] = useState(null);
    const [buffered, setBuffered] = useState(0);

    const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Check if HLS is supported
        if (src.endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hlsRef.current = hls;

                hls.loadSource(src);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('HLS manifest loaded');
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = src;
            }
        } else {
            // Regular video file
            video.src = src;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src]);

    // Update time and buffer
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            setCurrentTime(video.currentTime);
            setDuration(video.duration || 0);

            // Update buffered
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }

            // Call progress callback
            if (onProgress && video.duration) {
                onProgress({
                    currentTime: video.currentTime,
                    duration: video.duration,
                    percentage: (video.currentTime / video.duration) * 100
                });
            }
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateTime);
        video.addEventListener('progress', updateTime);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateTime);
            video.removeEventListener('progress', updateTime);
        };
    }, [onProgress]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handleSeek = (event, value) => {
        const video = videoRef.current;
        video.currentTime = value;
        setCurrentTime(value);
    };

    const handleVolumeChange = (event, value) => {
        const video = videoRef.current;
        video.volume = value;
        setVolume(value);
        setIsMuted(value === 0);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        video.muted = !video.muted;
        setIsMuted(!isMuted);
    };

    const handlePlaybackRateChange = (rate) => {
        const video = videoRef.current;
        video.playbackRate = rate;
        setPlaybackRate(rate);
        setSettingsAnchor(null);
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;

        if (!document.fullscreenElement) {
            container.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                width: '100%',
                backgroundColor: '#000',
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover .controls': {
                    opacity: 1
                }
            }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(isPlaying ? false : true)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                poster={poster}
                style={{
                    width: '100%',
                    display: 'block',
                    maxHeight: '70vh'
                }}
                onClick={togglePlay}
            />

            {/* Controls Overlay */}
            <Paper
                className="controls"
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    padding: 2,
                    transition: 'opacity 0.3s',
                    opacity: showControls ? 1 : 0
                }}
            >
                {/* Progress Bar */}
                <Box sx={{ mb: 1 }}>
                    <Slider
                        value={currentTime}
                        max={duration || 100}
                        onChange={handleSeek}
                        sx={{
                            color: 'primary.main',
                            '& .MuiSlider-track': {
                                height: 4
                            },
                            '& .MuiSlider-thumb': {
                                width: 12,
                                height: 12
                            }
                        }}
                    />
                    {/* Buffer indicator */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: 4,
                            width: `${(buffered / duration) * 100}%`,
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            borderRadius: 1
                        }}
                    />
                </Box>

                {/* Control Buttons */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    {/* Play/Pause */}
                    <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                        {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>

                    {/* Time */}
                    <Typography variant="body2" sx={{ color: 'white', minWidth: 100 }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </Typography>

                    {/* Volume */}
                    <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                        {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                    </IconButton>
                    <Slider
                        value={volume}
                        max={1}
                        step={0.1}
                        onChange={handleVolumeChange}
                        sx={{ width: 100, color: 'white' }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Speed */}
                    <Tooltip title="Playback Speed">
                        <IconButton
                            onClick={(e) => setSettingsAnchor(e.currentTarget)}
                            sx={{ color: 'white' }}
                        >
                            <Settings />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={settingsAnchor}
                        open={Boolean(settingsAnchor)}
                        onClose={() => setSettingsAnchor(null)}
                    >
                        {playbackRates.map((rate) => (
                            <MenuItem
                                key={rate}
                                selected={rate === playbackRate}
                                onClick={() => handlePlaybackRateChange(rate)}
                            >
                                {rate}x
                            </MenuItem>
                        ))}
                    </Menu>

                    {/* Fullscreen */}
                    <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                        {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>
                </Stack>
            </Paper>
        </Box>
    );
}
