'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { quizService } from '@/services/courseService';

export default function QuizHistory() {
    const { t } = useTranslation();
    const router = useRouter();

    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllAttempts();
    }, []);

    const fetchAllAttempts = async () => {
        try {
            setLoading(true);

            // Get all quizzes
            const quizzesData = await quizService.getAll();

            // Fetch attempts for each quiz
            const allAttempts = [];
            for (const quiz of quizzesData.quizzes) {
                try {
                    const resultsData = await quizService.getResults(quiz.id);
                    if (resultsData.attempts && resultsData.attempts.length > 0) {
                        resultsData.attempts.forEach(attempt => {
                            allAttempts.push({
                                ...attempt,
                                quizTitle: quiz.title,
                                quizId: quiz.id
                            });
                        });
                    }
                } catch (err) {
                    // No attempts for this quiz
                }
            }

            // Sort by date (newest first)
            allAttempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

            setAttempts(allAttempts);
        } catch (error) {
            console.error('Failed to fetch quiz history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (quizId) => {
        // Navigate to results page
        router.push(`/quizzes/${quizId}/results`);
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">
                        My Quiz History
                    </Typography>
                    <Button variant="outlined" onClick={() => router.push('/quizzes')}>
                        Back to Quizzes
                    </Button>
                </Box>

                {attempts.length === 0 ? (
                    <Alert severity="info">
                        You haven&apos;t completed any quizzes yet. Start taking quizzes to build your history!
                    </Alert>
                ) : (
                    <Card>
                        <CardContent>
                            <TableContainer component={Paper} elevation={0}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Quiz</strong></TableCell>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell align="center"><strong>Score</strong></TableCell>
                                            <TableCell align="center"><strong>Status</strong></TableCell>
                                            <TableCell align="right"><strong>Actions</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attempts.map((attempt) => (
                                            <TableRow key={attempt.id}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {attempt.quizTitle}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(attempt.completedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {attempt.score?.toFixed(1)}%
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {attempt.isPassed ? (
                                                        <Chip
                                                            icon={<CheckCircle />}
                                                            label="Passed"
                                                            color="success"
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<Cancel />}
                                                            label="Failed"
                                                            color="error"
                                                            size="small"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        startIcon={<Visibility />}
                                                        onClick={() => handleViewDetails(attempt.quizId)}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Stats */}
                {attempts.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Card sx={{ flex: 1 }}>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Total Quizzes
                                </Typography>
                                <Typography variant="h4">
                                    {attempts.length}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1 }}>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Passed
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {attempts.filter(a => a.isPassed).length}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1 }}>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Average Score
                                </Typography>
                                <Typography variant="h4">
                                    {(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length).toFixed(1)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Box>
        </Container>
    );
}
