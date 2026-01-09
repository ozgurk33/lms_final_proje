'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    Stack,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    CheckCircle,
    Download,
    ArrowForward,
    Lock
} from '@mui/icons-material';
import { quizService } from '@/services/quizService';

function QuizSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quizId = searchParams.get('quizId');
    const requireSEB = searchParams.get('requireSEB') === 'true';

    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState('');

    const handleDownloadSEB = async () => {
        try {
            setDownloading(true);
            setDownloadError('');
            const result = await quizService.downloadSEBConfig(quizId);

            if (!result.success) {
                setDownloadError(result.error || 'Download failed');
            }
        } catch (error) {
            setDownloadError('Failed to download SEB configuration');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 8, textAlign: 'center' }}>
                {/* Success Icon */}
                <CheckCircle
                    sx={{
                        fontSize: 80,
                        color: 'success.main',
                        mb: 2
                    }}
                />

                {/* Success Message */}
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Quiz Created Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Your quiz has been created and is ready for students.
                </Typography>

                {/* SEB Download Section */}
                {requireSEB && (
                    <Card sx={{ mt: 4, mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                <Lock color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Safe Exam Browser Required
                                </Typography>
                            </Box>

                            <Alert severity="info" sx={{ mb: 2 }}>
                                This quiz requires Safe Exam Browser (SEB). Download the configuration file and share it with students.
                            </Alert>

                            {downloadError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {downloadError}
                                </Alert>
                            )}

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
                                onClick={handleDownloadSEB}
                                disabled={downloading}
                                fullWidth
                            >
                                {downloading ? 'Downloading...' : 'Download SEB Configuration (.seb)'}
                            </Button>

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                                Students will use this file to open the quiz in Safe Exam Browser.
                                The file includes auto-login configuration.
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                    <Button
                        variant="outlined"
                        onClick={() => router.push('/instructor/quiz-builder')}
                    >
                        Create Another Quiz
                    </Button>
                    <Button
                        variant="contained"
                        endIcon={<ArrowForward />}
                        onClick={() => router.push('/instructor')}
                    >
                        Back to Dashboard
                    </Button>
                </Stack>

                {/* Instructions */}
                {requireSEB && (
                    <Card sx={{ mt: 4, bgcolor: 'grey.50' }}>
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                📋 Next Steps for SEB Quiz
                            </Typography>
                            <Box component="ol" sx={{ textAlign: 'left', pl: 3, mt: 2 }}>
                                <li>
                                    <Typography variant="body2" paragraph>
                                        Download the SEB configuration file (.seb) using the button above
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2" paragraph>
                                        Share the .seb file with your students (via LMS, email, or cloud storage)
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2" paragraph>
                                        Students open the .seb file, which launches Safe Exam Browser
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2" paragraph>
                                        The quiz opens automatically in SEB (auto-login enabled)
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2" paragraph>
                                        Students complete the quiz in a secure, locked environment
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Results are saved automatically when they submit
                                    </Typography>
                                </li>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Container>
    );
}

export default function QuizSuccessPage() {
    return (
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}>
            <QuizSuccessContent />
        </Suspense>
    );
}
