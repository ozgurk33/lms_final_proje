'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import { Timer, Assignment, CheckCircle, Lock } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { quizService } from '@/services/courseService';
import { downloadSEBConfig } from '@/utils/sebDetector';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function QuizzesPageContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [quizzes, setQuizzes] = useState([]);
    const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);

    const canTakeQuiz = user?.role === 'STUDENT' || user?.role === 'GUEST';

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const data = await quizService.getAll();
            setQuizzes(data.quizzes);

            console.log('📚 Total quizzes fetched:', data.quizzes.length);

            if (canTakeQuiz) {
                const completedIds = new Set();
                for (const quiz of data.quizzes) {
                    try {
                        const resultsData = await quizService.getResults(quiz.id);
                        if (resultsData.attempts && resultsData.attempts.length > 0) {
                            completedIds.add(quiz.id);
                            // Store score data in quiz object for display
                            quiz.latestAttempt = resultsData.attempts[0];
                            console.log('✅ Quiz completed:', quiz.title, 'Score:', quiz.latestAttempt.score);
                        }
                    } catch (err) {
                        // Quiz not completed
                    }
                }
                setCompletedQuizIds(completedIds);
                console.log('📊 Total completed quizzes:', completedIds.size);
            }
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = (quizId) => {
        if (!canTakeQuiz) {
            alert('Only students can take quizzes');
            return;
        }

        if (completedQuizIds.has(quizId)) {
            alert('You have already completed this quiz. View your results in the History tab.');
            return;
        }

        router.push(`/quizzes/${quizId}/take`);
    };

    const handleViewResults = async (quizId) => {
        try {
            const resultsData = await quizService.getResults(quizId);

            if (resultsData.attempts && resultsData.attempts.length > 0) {
                const latestAttempt = resultsData.attempts.sort((a, b) =>
                    new Date(b.completedAt) - new Date(a.completedAt)
                )[0];

                const resultData = {
                    percentage: latestAttempt.score || 0,
                    isPassed: latestAttempt.isPassed || false,
                    totalScore: latestAttempt.totalPoints || 0,
                    maxScore: latestAttempt.maxPoints || 100,
                    results: latestAttempt.answers || latestAttempt.questionResults || []
                };

                router.push(`/quizzes/${quizId}/results`, { state: { result: resultData } });
            } else {
                router.push('/student/quiz-history');
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
            router.push('/student/quiz-history');
        }
    };

    const availableQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id));
    const completedQuizzes = quizzes.filter(q => completedQuizIds.has(q.id));

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    const QuizCard = ({ quiz, isCompleted }) => (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        {quiz.title}
                    </Typography>
                    {isCompleted && (
                        <Chip
                            icon={<CheckCircle />}
                            label="Completed"
                            color="success"
                            size="small"
                        />
                    )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {quiz.description?.substring(0, 100)}...
                </Typography>

                {quiz.course && (
                    <Chip
                        label={quiz.course.title}
                        size="small"
                        sx={{ mb: 1 }}
                        variant="outlined"
                    />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            {quiz.duration} min
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Assignment fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            {quiz._count?.questions || 0} questions
                        </Typography>
                    </Box>

                    {quiz.requireSEB && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                            <Lock fontSize="small" color="primary" />
                            <Typography variant="caption" color="primary">
                                SEB Required
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Show score for completed quizzes */}
                {isCompleted && quiz.latestAttempt && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="success.dark">
                            Score: {quiz.latestAttempt.score?.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {quiz.latestAttempt.isPassed ? '✅ Passed' : '❌ Failed'}
                        </Typography>
                    </Box>
                )}
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
                {canTakeQuiz ? (
                    <>
                        {isCompleted ? (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CheckCircle />}
                                onClick={() => handleViewResults(quiz.id)}
                                fullWidth
                            >
                                View Results
                            </Button>
                        ) : (
                            <>
                                {quiz.requireSEB ? (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<Lock />}
                                        onClick={async () => {
                                            const result = await downloadSEBConfig(quiz.id, quiz.title);
                                            if (result.success) {
                                                alert('SEB config downloaded! Open the .seb file to start the quiz.');
                                            } else {
                                                alert('Failed to download config: ' + result.error);
                                            }
                                        }}
                                        fullWidth
                                        color="secondary"
                                    >
                                        Download SEB Config
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleStartQuiz(quiz.id)}
                                        fullWidth
                                    >
                                        {t('quiz.start')}
                                    </Button>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <Button size="small" variant="outlined" onClick={() => router.push(`/quizzes/${quiz.id}`)} fullWidth>
                        {t('common.details')}
                    </Button>
                )}
            </CardActions>
        </Card>
    );

    return (
        <Container>
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">
                        {t('nav.quizzes')}
                    </Typography>
                    {canTakeQuiz && (
                        <Button variant="outlined" onClick={() => router.push('/student/quiz-history')}>
                            View History
                        </Button>
                    )}
                </Box>

                {!canTakeQuiz && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        You are viewing quizzes as {user?.role}. Only students can take quizzes.
                    </Alert>
                )}

                {canTakeQuiz && (
                    <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                        <Tab label={`Available (${availableQuizzes.length})`} />
                        <Tab label={`Completed (${completedQuizzes.length})`} />
                    </Tabs>
                )}

                <Grid container spacing={3}>
                    {(tab === 0 ? availableQuizzes : completedQuizzes).map((quiz) => (
                        <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                            <QuizCard quiz={quiz} isCompleted={tab === 1} />
                        </Grid>
                    ))}
                </Grid>

                {(tab === 0 ? availableQuizzes : completedQuizzes).length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            {tab === 0 ? 'No available quizzes' : 'No completed quizzes yet'}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default function QuizzesPage() {
    return (
        <ProtectedRoute>
            <QuizzesPageContent />
        </ProtectedRoute>
    );
}
