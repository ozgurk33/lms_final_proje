'use client';

import { useEffect, useState } from 'react';
import { Container, Box, Typography, Button, CircularProgress } from '@mui/material';
import { CheckCircle, ExitToApp } from '@mui/icons-material';

export default function SEBQuitPage() {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        localStorage.removeItem('auth');
        console.log('SEB Quit Page loaded - SEB should detect quitURL and close');

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    tryQuitSEB();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const tryQuitSEB = () => {
        try {
            const iframe = document.createElement('iframe');
            iframe.src = 'seb://quit';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            console.log('SEB quit command sent via iframe');
        } catch (e) {
            console.error('seb://quit iframe failed', e);
        }

        setTimeout(() => {
            window.location.href = 'seb://quit';
        }, 500);

        setTimeout(() => {
            try { window.close(); } catch (e) { }
        }, 1000);
    };

    const handleManualQuit = () => {
        tryQuitSEB();
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{
                mt: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                <CheckCircle sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />

                <Typography variant="h3" gutterBottom fontWeight="bold">
                    SÄ±nav TamamlandÄ±!
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    CevaplarÄ±nÄ±z baÅŸarÄ±yla kaydedildi.
                </Typography>

                {countdown > 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                        <CircularProgress size={30} />
                        <Typography variant="body1">
                            Safe Exam Browser {countdown} saniye iÃ§inde kapanacak...
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            SEB otomatik olarak kapanmadÄ± mÄ±?
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<ExitToApp />}
                            onClick={handleManualQuit}
                            sx={{ mb: 2 }}
                        >
                            SEB&apos;i Kapat
                        </Button>
                    </Box>
                )}

                <Box sx={{
                    mt: 4,
                    p: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Manuel kapatma iÃ§in:</strong><br />
                        â€¢ Windows: <kbd>Ctrl+Q</kbd> tuÅŸlarÄ±na basÄ±n<br />
                        â€¢ Veya SEB menÃ¼sÃ¼nden &quot;Quit&quot; seÃ§eneÄŸini kullanÄ±n
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}
