'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Button,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import {
    School,
    Quiz as QuizIcon,
    TrendingUp,
    EmojiEvents,
    PlayArrow,
    CheckCircle,
    DesktopWindows
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { quizService } from '@/services/courseService';
import api from '@/services/api';
import StudentQuickActions from '@/components/student/StudentQuickActions';

export default function StudentDashboard() {
    const { t } = useTranslation();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
    const [completedQuizAttempts, setCompletedQuizAttempts] = useState([]);
    const [stats, setStats] = useState({
        totalCourses: 0,
        completedQuizzes: 0,
        averageScore: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch real enrollments
            const enrollmentsResponse = await api.get('/courses/enrollments/my');
            const myEnrollments = enrollmentsResponse.data.enrollments || [];
            setEnrolledCourses(myEnrollments);

            // Fetch all quizzes
            // Fetch all quizzes (increased limit to ensure we check all)
            const quizzesData = await quizService.getAll({ limit: 100 });
            const allQuizzes = quizzesData.quizzes || [];

            // Check which quizzes are completed
            const completedIds = new Set();
            const allAttempts = [];
            let totalScore = 0;

            for (const quiz of allQuizzes) {
                try {
                    const resultsData = await quizService.getResults(quiz.id);
                    if (resultsData.attempts && resultsData.attempts.length > 0) {
                        completedIds.add(quiz.id);
                        allAttempts.push(...resultsData.attempts.map(a => ({
                            ...a,
                            quizTitle: quiz.title,
                            quizId: quiz.id
                        })));
                        totalScore += resultsData.attempts[0].score || 0;
                    }
                } catch (err) {
                    // No attempts
                }
            }

            // Get upcoming (not completed) quizzes
            const upcoming = allQuizzes.filter(q => !completedIds.has(q.id)).slice(0, 3);
            setUpcomingQuizzes(upcoming);

            // Sort attempts by date
            allAttempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
            setCompletedQuizAttempts(allAttempts.slice(0, 5));

            // DEBUG: Log to verify completed quizzes are being set
            console.log('📊 Completed Quiz Attempts:', allAttempts.length);
            console.log('📊 Showing:', allAttempts.slice(0, 5));

            // Calculate real stats
            const completedCount = completedIds.size;
            const avgScore = completedCount > 0 ? (totalScore / completedCount) : 0;

            setStats({
                totalCourses: myEnrollments.length,
                completedQuizzes: completedCount,
                averageScore: avgScore.toFixed(1),
                streak: 0 // Could calculate from attempt dates
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* Modern Header with Gradient */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 4,
                        p: 4,
                        mb: 4,
                        color: 'white',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h4" gutterBottom fontWeight="bold">
                                {t('dashboard.welcome')}, {user?.fullName || user?.username}!
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                {t('student.continueJourney')}
                            </Typography>
                        </Box>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                fontSize: '2rem',
                                bgcolor: 'rgba(255,255,255,0.2)',
                                border: '3px solid white'
                            }}
                        >
                            {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                        </Avatar>
                    </Box>
                </Box>

                {/* Tab Navigation */}
                <Tabs
                    value={activeTab}
                    onChange={(e, v) => setActiveTab(v)}
                    sx={{ mb: 3 }}
                >
                    <Tab label="Dashboard" />
                    <Tab label="Desktop Features" icon={<DesktopWindows fontSize="small" />} iconPosition="end" />
                </Tabs>

                {/* Tab 0: Dashboard Content */}
                {activeTab === 0 && (
                    <>
                        {/* Stats Cards */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white'
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <School />
                                            <Typography variant="body2">{t('student.enrolledCourses')}</Typography>
                                        </Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {stats.totalCourses}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white'
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <QuizIcon />
                                            <Typography variant="body2">{t('student.completedQuizzes')}</Typography>
                                        </Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {stats.completedQuizzes}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white'
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <TrendingUp />
                                            <Typography variant="body2">{t('student.averageScore')}</Typography>
                                        </Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {stats.averageScore}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{
                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                    color: 'white'
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <EmojiEvents />
                                            <Typography variant="body2">{t('student.achievements')}</Typography>
                                        </Box>
                                        <Typography variant="h3" fontWeight="bold">
                                            {stats.completedQuizzes}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {loading ? (
                            <LinearProgress sx={{ mt: 2 }} />
                        ) : (
                            <Grid container spacing={3}>
                                {/* My Courses */}
                                <Grid item xs={12} md={8}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                <Typography variant="h6">
                                                    {t('student.myCourses')}
                                                </Typography>
                                                <Button size="small" onClick={() => router.push('/courses')}>
                                                    {t('common.viewAll')}
                                                </Button>
                                            </Box>

                                            {enrolledCourses.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                                    {t('student.noCoursesEnrolled')}
                                                </Typography>
                                            ) : (
                                                <Grid container spacing={2}>
                                                    {enrolledCourses.slice(0, 4).map((enrollment) => (
                                                        <Grid item xs={12} key={enrollment.id}>
                                                            <Card variant="outlined" sx={{ cursor: 'pointer' }}
                                                                onClick={() => router.push(`/courses/${enrollment.course.id}`)}>
                                                                <CardContent>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                                            <School />
                                                                        </Avatar>
                                                                        <Box sx={{ flex: 1 }}>
                                                                            <Typography variant="subtitle1" fontWeight="medium">
                                                                                {enrollment.course.title}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {enrollment.course.instructor?.fullName || 'Instructor'}
                                                                            </Typography>
                                                                            <Box sx={{ mt: 1 }}>
                                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                                    <Typography variant="caption">{t('student.progress')}</Typography>
                                                                                    <Typography variant="caption">{enrollment.progress || 0}%</Typography>
                                                                                </Box>
                                                                                <LinearProgress variant="determinate" value={enrollment.progress || 0} />
                                                                            </Box>
                                                                        </Box>
                                                                        <Button variant="outlined" size="small" startIcon={<PlayArrow />}>
                                                                            {t('student.continue')}
                                                                        </Button>
                                                                    </Box>
                                                                </CardContent>
                                                            </Card>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Sidebar */}
                                <Grid item xs={12} md={4}>
                                    {/* Upcoming Quizzes */}
                                    <Card sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Upcoming Quizzes
                                            </Typography>
                                            {upcomingQuizzes.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    No upcoming quizzes
                                                </Typography>
                                            ) : (
                                                <List>
                                                    {upcomingQuizzes.map((quiz, idx) => (
                                                        <div key={quiz.id}>
                                                            {idx > 0 && <Divider />}
                                                            <ListItem
                                                                button
                                                                onClick={() => router.push(`/quizzes/${quiz.id}/take`)}
                                                                sx={{ px: 0 }}
                                                            >
                                                                <ListItemAvatar>
                                                                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                                        <QuizIcon />
                                                                    </Avatar>
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={quiz.title}
                                                                    secondary={`${quiz.duration} min · ${quiz._count?.questions || 0} questions`}
                                                                />
                                                            </ListItem>
                                                        </div>
                                                    ))}
                                                </List>
                                            )}
                                            <Button fullWidth variant="outlined" onClick={() => router.push('/quizzes')} sx={{ mt: 1 }}>
                                                View All Quizzes
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Completed Quizzes */}
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h6">
                                                    Completed Quizzes
                                                </Typography>
                                                <Button size="small" onClick={() => router.push('/student/quiz-history')}>
                                                    View All
                                                </Button>
                                            </Box>
                                            {completedQuizAttempts.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('student.noAttemptsYet')}
                                                </Typography>
                                            ) : (
                                                <List>
                                                    {completedQuizAttempts.map((attempt, idx) => (
                                                        <div key={attempt.id}>
                                                            {idx > 0 && <Divider />}
                                                            <ListItem
                                                                button
                                                                onClick={() => router.push(`/quizzes/${attempt.quizId}/results`)}
                                                                sx={{ px: 0 }}
                                                            >
                                                                <ListItemAvatar>
                                                                    <Avatar sx={{
                                                                        bgcolor: attempt.isPassed ? 'success.main' : 'error.main',
                                                                        width: 32,
                                                                        height: 32
                                                                    }}>
                                                                        <CheckCircle fontSize="small" />
                                                                    </Avatar>
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={attempt.quizTitle}
                                                                    secondary={new Date(attempt.completedAt).toLocaleDateString()}
                                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                                />
                                                                <Chip
                                                                    label={`${attempt.score?.toFixed(0)}%`}
                                                                    size="small"
                                                                    color={attempt.isPassed ? 'success' : 'error'}
                                                                />
                                                            </ListItem>
                                                        </div>
                                                    ))}
                                                </List>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </>
                )}

                {/* Tab 1: Desktop Features */}
                {activeTab === 1 && (
                    <StudentQuickActions />
                )}
            </Box>
        </Container>
    );
}
