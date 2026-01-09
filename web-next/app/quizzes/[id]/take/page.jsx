'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    Container,
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    RadioGroup,
    FormControlLabel,
    Radio,
    Checkbox,
    TextField,
    LinearProgress,
    Alert,
    CircularProgress,
    Backdrop
} from '@mui/material';
import { Timer, Lock } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { quizService } from '../../../../services/courseService';
import { useAuthStore } from '../../../../store/authStore';
import { isSEBBrowser } from '../../../../utils/sebDetector';
import SEBDownloadButton from '../../../../components/SEBDownloadButton';
import QuestionAnswer from '../../../../components/quiz/QuestionAnswer';

export default function QuizTakePage() {
    const { t } = useTranslation();
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.setAuth);

    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [isAutoLogging, setIsAutoLogging] = useState(false);
    const [closingSEB, setClosingSEB] = useState(false);

    // Handle SEB auto-login token - must run before quiz start
    useEffect(() => {
        const sebToken = searchParams.get('seb_token');
        if (sebToken) {
            console.log('🔐 SEB auto-login: Using seb_token from URL');
            setIsAutoLogging(true);
            // Store token for API calls
            localStorage.setItem('auth', JSON.stringify({ token: sebToken }));
            // Also update auth store with minimal user info
            setAuth({ id: 'seb-user', role: 'STUDENT' }, sebToken, null);
            // Small delay to ensure state is updated before quiz start
            setTimeout(() => {
                setIsAutoLogging(false);
            }, 100);
        }
    }, []);  // Only run once on mount

    // Start quiz after auto-login completes
    useEffect(() => {
        if (!isAutoLogging) {
            checkAndStartQuiz();
        }
    }, [id, isAutoLogging]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining > 0) {
            const timer = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeRemaining === 0 && quiz && !submitting) {
            // Only auto-submit if not already submitting
            handleSubmit(true);
        }
    }, [timeRemaining, submitting]);

    const checkAndStartQuiz = async () => {
        try {
            setLoading(true);

            // Block instructors from taking quizzes
            if (user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
                alert('Instructors and admins cannot take quizzes. You can only view them.');
                router.back();
                return;
            }


            // Check if already completed
            try {
                const resultsData = await quizService.getResults(id);
                if (resultsData.attempts && resultsData.attempts.length > 0) {
                    // Quiz already completed
                    const isSEB = isSEBBrowser() || searchParams.get('seb_token') !== null;

                    if (isSEB) {
                        // In SEB: Show message and close SEB (SAME AS SUBMISSION)
                        alert('Bu sınav daha önce tamamlanmıştır. Safe Exam Browser kapatılıyor...');

                        // Show closing backdrop
                        setClosingSEB(true);

                        // Trigger SEB quit using iframe (SAME AS SUBMISSION)
                        try {
                            const iframe = document.createElement('iframe');
                            iframe.src = 'seb://quit';
                            iframe.style.display = 'none';
                            document.body.appendChild(iframe);
                        } catch (e) {
                            console.error('SEB quit protocol failed', e);
                        }

                        // Fallback (SAME AS SUBMISSION)
                        setTimeout(() => {
                            window.location.href = '/seb-quit';
                        }, 3000);
                        return;
                    } else {
                        // Normal browser: Redirect to quiz history
                        alert('You have already completed this quiz. Redirecting to results...');
                        router.push('/student/quiz-history');
                        return;
                    }
                }
            } catch (err) {
                // No previous attempts, continue
            }

            // Start quiz
            const data = await quizService.startAttempt(id);
            setQuiz(data.quiz);
            setAttempt(data.attempt);
            setQuestions(data.quiz.questions || []);
            setTimeRemaining(data.quiz.duration * 60); // Convert to seconds

            // Initialize answers
            const initialAnswers = {};
            data.quiz.questions.forEach((q, idx) => {
                initialAnswers[idx] = q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.correctAnswer)
                    ? []
                    : '';
            });
            setAnswers(initialAnswers);
            setLoading(false);
        } catch (error) {
            console.error('Failed to start quiz:', error);

            // Check if it's already completed error from backend
            if (error.response?.status === 403 && error.response?.data?.error?.includes('already completed')) {
                const isSEB = isSEBBrowser() || searchParams.get('seb_token') !== null;

                if (isSEB) {
                    // In SEB: Show message and close SEB (SAME AS SUBMISSION)
                    alert('Bu sınav daha önce tamamlanmıştır. Safe Exam Browser kapatılıyor...');

                    // Show closing backdrop
                    setClosingSEB(true);

                    // Trigger SEB quit using iframe (SAME AS SUBMISSION)
                    try {
                        const iframe = document.createElement('iframe');
                        iframe.src = 'seb://quit';
                        iframe.style.display = 'none';
                        document.body.appendChild(iframe);
                    } catch (e) {
                        console.error('SEB quit protocol failed', e);
                    }

                    // Fallback (SAME AS SUBMISSION)
                    setTimeout(() => {
                        window.location.href = '/seb-quit';
                    }, 3000);
                    return;
                }
            }

            alert('Failed to start quiz: ' + (error.response?.data?.error || error.message));
            router.push('/quizzes');
        }
    };

    const handleAnswerChange = (value) => {
        setAnswers({
            ...answers,
            [currentQuestion]: value
        });
    };

    const handleMultipleChoice = (option) => {
        const current = answers[currentQuestion] || [];
        if (current.includes(option)) {
            setAnswers({
                ...answers,
                [currentQuestion]: current.filter(o => o !== option)
            });
        } else {
            setAnswers({
                ...answers,
                [currentQuestion]: [...current, option]
            });
        }
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        if (!isAutoSubmit && !window.confirm(t('quiz.confirmSubmit') || 'Are you sure you want to submit?')) {
            return;
        }

        try {
            setSubmitting(true);
            // Ensure answers are mapped in the correct order of questions
            const answerArray = questions.map((_, idx) => answers[idx]);

            if (!attempt || !attempt.id) {
                console.error('CRITICAL: Attempt ID is missing!', attempt);
                alert('HATA: Sınav girişimi bulunamadı. Lütfen sayfayı yenileyin.');
                return;
            }

            console.log(`Submitting quiz ${id}, attempt ${attempt.id}, answers:`, answerArray);

            // Call submit with ID
            const result = await quizService.submit(id, attempt.id, answerArray);
            console.log('Submission result:', result);

            // Check if we're in SEB mode (has seb_token or detected as SEB browser)
            const hasSEBToken = searchParams.get('seb_token') !== null;
            const inSEB = isSEBBrowser();

            if (hasSEBToken || inSEB) {
                // In SEB: Show success message with results
                // DEBUG: Log to verify which submit type
                console.log('🔍 Submit Type:', isAutoSubmit ? 'AUTO (Timer)' : 'MANUAL (Button)');
                console.log('🔍 isAutoSubmit value:', isAutoSubmit);
                console.log('🔍 Time Remaining:', timeRemaining, 'seconds');

                // Choose message based on submit type
                let msg;
                if (isAutoSubmit === true) {
                    // Timer expired - auto submit
                    msg = `⏰ SÜRE DOLDU!\n\nSınav süresi sona erdi ve otomatik olarak gönderildi.\n\nPuanınız: ${result.percentage?.toFixed(1) || 0}%\n${result.isPassed ? '✅ GEÇTİNİZ' : '❌ KALDINIZ'}\n\n[DEBUG: AUTO SUBMIT]`;
                } else {
                    // Manual submit by user
                    msg = `✅ Tebrikler!\n\nSınavınızı başarıyla tamamladınız ve gönderdiniz.\n\nPuanınız: ${result.percentage?.toFixed(1) || 0}%\n${result.isPassed ? '✅ GEÇTİNİZ' : '❌ KALDINIZ'}\n\n[DEBUG: MANUAL SUBMIT - isAutoSubmit=${isAutoSubmit}, timeLeft=${timeRemaining}s]`;
                }

                alert(msg);

                // 1. Show clean "Closing..." backdrop to hide any glitches
                setClosingSEB(true);

                // 2. CRITICAL: Trigger SEB quit silently using an iframe
                // This prevents the "Navigation Failed" error page while still sending the command
                try {
                    const iframe = document.createElement('iframe');
                    iframe.src = 'seb://quit';
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                } catch (e) {
                    console.error('SEB quit protocol failed', e);
                }

                // 3. Fallback: Only navigate if SEB hasn't closed after 3 seconds
                // This prevents the "Connection Lost" race condition
                setTimeout(() => {
                    window.location.href = '/seb-quit';
                }, 3000);
            } else {
                // Normal browser: Navigate to results page
                router.push(`/quizzes/${id}/results`);
            }
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            // Even if failed, if it was auto-submit, we should arguably force quit or show error
            alert('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    if (!quiz || questions.length === 0) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>No questions found</Alert>
            </Container>
        );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    // Check if SEB is required
    // If user came from SEB (has seb_token) or is in SEB browser, skip the check
    const hasSEBToken = searchParams.get('seb_token') !== null;
    const isInSEB = isSEBBrowser();

    // Only require SEB download if: quiz requires it, env var is true, 
    // AND user is NOT in SEB and doesn't have SEB token
    const shouldBlockForSEB = quiz.requireSEB &&
        process.env.NEXT_PUBLIC_REQUIRE_SEB === 'true' &&
        !isInSEB &&
        !hasSEBToken;

    // Show SEB download if required but not in SEB
    if (shouldBlockForSEB) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Lock />
                            <Typography variant="h6">Safe Exam Browser Required</Typography>
                        </Box>
                        <Typography sx={{ mt: 1 }}>
                            This quiz must be taken using Safe Exam Browser for security purposes.
                        </Typography>
                    </Alert>

                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {quiz.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {quiz.description || 'Secure quiz - SEB required'}
                            </Typography>

                            <SEBDownloadButton quizId={id} quizTitle={quiz.title} />
                        </CardContent>
                    </Card>

                    <Box sx={{ mt: 2 }}>
                        <Button variant="outlined" onClick={() => router.push('/quizzes')}>
                            Back to Quizzes
                        </Button>
                    </Box>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* Header */}
                <Typography variant="h4" gutterBottom>
                    {quiz.title}
                </Typography>

                {/* Timer */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Timer color={timeRemaining < 60 ? 'error' : 'primary'} />
                    <Typography
                        variant="h6"
                        color={timeRemaining < 60 ? 'error' : 'textPrimary'}
                    >
                        {formatTime(timeRemaining)}
                    </Typography>
                </Box>

                {/* Progress */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Question {currentQuestion + 1} of {questions.length}
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} />
                </Box>

                {/* Question Card */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {question.content}
                        </Typography>

                        <QuestionAnswer
                            question={question}
                            value={answers[currentQuestion]}
                            onChange={handleAnswerChange}
                        />
                    </CardContent>
                </Card>

                {/* Navigation */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        disabled={currentQuestion === 0}
                        onClick={() => setCurrentQuestion(currentQuestion - 1)}
                    >
                        {t('common.back')}
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {currentQuestion < questions.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            >
                                {t('common.next')}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                            >
                                {submitting ? <CircularProgress size={24} /> : t('quiz.submit')}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Clean Close Overlay */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 9999, flexDirection: 'column', gap: 2 }}
                open={closingSEB}
            >
                <CircularProgress color="inherit" />
                <Typography variant="h6">Safe Exam Browser Kapanıyor...</Typography>
                <Typography variant="body2">Lütfen bekleyin.</Typography>
            </Backdrop>
        </Container>
    );
}
