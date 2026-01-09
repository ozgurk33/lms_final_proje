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
    TextField,
    CircularProgress,
    Chip
} from '@mui/material';
import { School, Person } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { courseService } from '@/services/courseService';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function CoursesPageContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCourses();
    }, [user]);

    const fetchCourses = async () => {
        try {
            setLoading(true);

            if (user?.role === 'STUDENT') {
                const response = await api.get('/courses/enrollments/my');
                const enrollments = response.data.enrollments || [];
                const enrolledCourses = enrollments.map(e => e.course);
                setCourses(enrolledCourses);
            } else {
                const data = await courseService.getAll({ search });
                setCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchCourses();
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
        <Container>
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {user?.role === 'STUDENT' ? 'My Enrolled Courses' : t('nav.courses')}
                </Typography>

                {user?.role !== 'STUDENT' && (
                    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label={t('common.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button variant="contained" onClick={handleSearch}>
                            {t('common.search')}
                        </Button>
                    </Box>
                )}

                <Grid container spacing={3}>
                    {courses.map((course) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {course.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {course.description?.substring(0, 100)}...
                                    </Typography>
                                    {course.category && (
                                        <Chip label={course.category} size="small" sx={{ mb: 1 }} />
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Person fontSize="small" />
                                        <Typography variant="body2">
                                            {course.instructor?.fullName || course.instructor?.username}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <School fontSize="small" />
                                        <Typography variant="body2">
                                            {course._count?.modules || 0} modules
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Button size="small" onClick={() => router.push(`/courses/${course.id}`)}>
                                        {t('common.details')}
                                    </Button>
                                    {user?.role === 'STUDENT' && (
                                        <Chip label="Enrolled" color="success" size="small" />
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {courses.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            {user?.role === 'STUDENT'
                                ? 'No courses assigned to you yet. Your instructor will assign courses.'
                                : 'No courses found'}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default function CoursesPage() {
    return (
        <ProtectedRoute>
            <CoursesPageContent />
        </ProtectedRoute>
    );
}
