'use client';

import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';

/**
 * H5PPlayer Component
 * Plays H5P interactive content
 * Note: For full H5P support, consider using H5P.js library
 * This is a basic iframe implementation
 */
export default function H5PPlayer({ h5pUrl, onComplete }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!h5pUrl) {
            setError('No H5P content URL provided');
            setLoading(false);
            return;
        }

        // Listen for H5P completion/score events
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'h5p-complete') {
                onComplete && onComplete(event.data.score);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [h5pUrl, onComplete]);

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setError('Failed to load H5P content');
        setLoading(false);
    };

    if (error) {
        return (
            <Alert severity="error">
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', minHeight: '500px' }}>
            {loading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2
                    }}
                >
                    <CircularProgress />
                </Box>
            )}

            <iframe
                src={h5pUrl}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    width: '100%',
                    minHeight: '500px',
                    border: 'none',
                    borderRadius: '8px'
                }}
                title="H5P Interactive Content"
                allow="fullscreen; microphone; camera"
                allowFullScreen
            />
        </Box>
    );
}
