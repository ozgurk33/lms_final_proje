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
    Button,
    CircularProgress,
    Chip,
    Avatar
} from '@mui/material';
import {
    School,
    PersonAdd,
    Quiz as QuizIcon,
    People
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { quizService } from '@/services/courseService';
import api from '@/services/api';
import StudentAssignmentDialog from '@/components/instructor/StudentAssignmentDialog';
import QuickActionsGrid from '@/components/instructor/QuickActionsGrid';

export default function InstructorDashboard() {
    const { t } = useTranslation();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    const [myCourses, setMyCourses] = useState([]);
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalQuizzes: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);

    // Assignment Dialog State
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedCourseForAssign, setSelectedCourseForAssign] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Get instructor's assigned courses
            const coursesData = await api.get('/instructor/my-courses');

            const courses = coursesData.data.courses || [];
            setMyCourses(courses);

            // Calculate stats
            const totalStudents = courses.reduce((sum, c) =>
                sum + (c._count?.enrollments || 0), 0
            );

            setStats({
                totalCourses: courses.length,
                totalQuizzes: 0, // We'll calculate this from courses if needed
                totalStudents
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssignDialog = (course) => {
        setSelectedCourseForAssign(course);
        setAssignDialogOpen(true);
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* Header */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        borderRadius: 4,
                        p: 4,
                        mb: 4,
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {t('dashboard.welcome')}, {user?.fullName}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
                            Instructor Panel
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

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{stats.totalCourses}</Typography>
                                <Typography color="textSecondary">Assigned Courses</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <People color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{stats.totalStudents}</Typography>
                                <Typography color="textSecondary">Active Students</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <QuizIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{stats.totalQuizzes}</Typography>
                                <Typography color="textSecondary">Total Quizzes</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Quick Actions */}
                <QuickActionsGrid />

                {/* My Assigned Courses */}
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                    My Assigned Courses
                </Typography>

                <Grid container spacing={3}>
                    {myCourses.map((course) => (
                        <Grid item xs={12} md={6} key={course.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {course.title}
                                        </Typography>
                                        <Chip
                                            label={course.isPublished ? "Published" : "Draft"}
                                            color={course.isPublished ? "success" : "warning"}
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {course.description || 'No description provided.'}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                                        <People fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            {course._count?.enrollments || 0} Students Enrolled
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <Box sx={{ p: 2, pt: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => router.push(`/courses/${course.id}`)}
                                        sx={{ flex: 1 }}
                                    >
                                        View Content
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => router.push(`/instructor/courses/${course.id}`)}
                                        sx={{ flex: 1 }}
                                    >
                                        Modules
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<QuizIcon />}
                                        onClick={() => router.push(`/instructor/quiz-builder?courseId=${course.id}`)}
                                        sx={{ flex: 1 }}
                                    >
                                        Create Quiz
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<PersonAdd />}
                                        onClick={() => handleOpenAssignDialog(course)}
                                        sx={{ flex: 1 }}
                                    >
                                        Assign Student
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                    {myCourses.length === 0 && (
                        <Grid item xs={12}>
                            <Card sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="textSecondary">
                                    No courses assigned to you yet.
                                </Typography>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Student Assignment Dialog */}
            {selectedCourseForAssign && (
                <StudentAssignmentDialog
                    open={assignDialogOpen}
                    onClose={() => setAssignDialogOpen(false)}
                    courseId={selectedCourseForAssign.id}
                    courseTitle={selectedCourseForAssign.title}
                    onAssignSuccess={() => {
                        fetchDashboardData();
                    }}
                />
            )}
        </Container>
    );
}
