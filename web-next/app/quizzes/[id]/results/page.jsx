'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    LinearProgress,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { quizService } from '@/services/courseService';

/**
 * QuizResultsPage - Shows graded quiz results
 */
export default function QuizResultsPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params?.id;

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (quizId) {
            loadResults();
        }
    }, [quizId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get quiz attempts first
            const resultsData = await quizService.getResults(quizId);

            if (!resultsData.attempts || resultsData.attempts.length === 0) {
                setError('No attempts found for this quiz');
                return;
            }

            // Get latest attempt
            const latestAttempt = resultsData.attempts[0];

            // Get detailed results for this attempt
            const detailedResults = await quizService.getAttemptDetails(quizId, latestAttempt.id);

            setResults({
                ...detailedResults,
                attempt: latestAttempt
            });
        } catch (err) {
            console.error('Error loading results:', err);
            setError('Failed to load quiz results');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }}>Loading your quiz results...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={() => router.push('/student/quiz-history')}>
                    Back to Quiz History
                </Button>
            </Container>
        );
    }

    if (!results) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="info">No results available</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Quiz Results
            </Typography>

            {/* Score Summary */}
            <Card sx={{ mb: 3, bgcolor: results.isPassed ? 'success.light' : 'error.light' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h3">
                                {results.totalScore} / {results.maxScore}
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                {results.percentage}%
                            </Typography>
                        </Box>
                        <Chip
                            icon={results.isPassed ? <CheckCircle /> : <Cancel />}
                            label={results.isPassed ? 'PASSED' : 'FAILED'}
                            color={results.isPassed ? 'success' : 'error'}
                            size="large"
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Question-by-Question Results */}
            <Typography variant="h6" gutterBottom>
                Detailed Results
            </Typography>

            {results.results && results.results.length > 0 ? (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>#</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Your Answer</strong></TableCell>
                                <TableCell><strong>Correct Answer</strong></TableCell>
                                <TableCell align="right"><strong>Points</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.results.map((result, index) => (
                                <TableRow key={result.questionId || index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {result.isCorrect ? (
                                            <Chip icon={<CheckCircle />} label="Correct" color="success" size="small" />
                                        ) : (
                                            <Chip icon={<Cancel />} label="Wrong" color="error" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {typeof result.userAnswer === 'object'
                                            ? JSON.stringify(result.userAnswer)
                                            : result.userAnswer || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {typeof result.correctAnswer === 'object'
                                            ? JSON.stringify(result.correctAnswer)
                                            : result.correctAnswer || '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        {result.points || 0}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity="info">No detailed results available</Alert>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={() => router.push('/student/quiz-history')}>
                    Back to Quiz History
                </Button>
                <Button variant="contained" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </Button>
            </Box>
        </Container>
    );
}
