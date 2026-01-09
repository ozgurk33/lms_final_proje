'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

/**
 * ScormPlayer Component
 * Plays SCORM content packages
 * Note: For full SCORM support, consider using scorm-again or rustici-scorm packages
 * This is a basic iframe implementation
 */
export default function ScormPlayer({ scormUrl, onComplete }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!scormUrl) {
            setError('No SCORM package URL provided');
            setLoading(false);
            return;
        }

        // Listen for SCORM completion messages
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'scorm-complete') {
                onComplete && onComplete(event.data.score);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [scormUrl, onComplete]);

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setError('Failed to load SCORM content');
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
        <Box sx={{ position: 'relative', width: '100%', height: '600px' }}>
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
                ref={iframeRef}
                src={scormUrl}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '8px'
                }}
                title="SCORM Content"
                allow="fullscreen"
            />
        </Box>
    );
}
