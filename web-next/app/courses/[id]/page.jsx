'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardMedia,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import { ExpandMore, PlayArrow, Person, Edit, People, Add } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../../services/courseService';
import { useAuthStore } from '../../../store/authStore';
import VideoPlayer from '../../../components/content/VideoPlayer';

export default function CourseDetailPage() {
    const { t } = useTranslation();
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [enrolled, setEnrolled] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const data = await courseService.getById(id);
            setCourse(data.course);

            // Check if student is enrolled (for showing quizzes)
            if (user?.role === 'STUDENT') {
                // Check enrollments from course data if available
                const isEnrolled = data.course.enrollments?.some(e => e.userId === user?.id);
                setEnrolled(isEnrolled);
            } else {
                // Admins and instructors always see content
                setEnrolled(true);
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        try {
            await courseService.enroll(id);
            setEnrolled(true);
            alert(t('course.enrollSuccess') || 'Enrolled successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to enroll');
        }
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

    if (!course) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Course not found
                </Alert>
            </Container>
        );
    }

    return (
        <Container>
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* Course Header */}
                <Card sx={{ mb: 3 }}>
                    {course.thumbnail && (
                        <CardMedia
                            component="img"
                            height="300"
                            image={course.thumbnail}
                            alt={course.title}
                        />
                    )}
                    <CardContent>
                        <Typography variant="h4" gutterBottom>
                            {course.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Chip
                                icon={<Person />}
                                label={course.instructor?.fullName || course.instructor?.username}
                            />
                            {course.category && <Chip label={course.category} variant="outlined" />}
                        </Box>

                        <Typography variant="body1" paragraph>
                            {course.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            {!enrolled && user?.role === 'STUDENT' && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleEnroll}
                                >
                                    {t('course.enroll')}
                                </Button>
                            )}

                            {/* Instructor/Admin: Manage Modules */}
                            {(['ADMIN', 'SUPER_ADMIN'].includes(user?.role) || (user?.role === 'INSTRUCTOR' && course.instructorId === user?.id)) && (
                                <Button
                                    variant="contained"
                                    startIcon={<Edit />}
                                    onClick={() => router.push(`/instructor/courses/${course.id}`)}
                                >
                                    Manage Modules
                                </Button>
                            )}

                            {/* Admin Actions */}
                            {['ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                                <Button
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => router.push(`/instructor/edit-course/${course.id}`)}
                                >
                                    Edit Course
                                </Button>
                            )}
                            {/* Manage Students (Admin or Instructor of this course) */}
                            {(['ADMIN', 'SUPER_ADMIN'].includes(user?.role) || (user?.role === 'INSTRUCTOR' && course.instructorId === user?.id)) && (
                                <Button
                                    variant="outlined"
                                    startIcon={<People />}
                                    onClick={() => router.push(`/instructor/course/${course.id}/manage-students`)}
                                >
                                    Manage Students
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {/* Modules */}
                <Typography variant="h5" gutterBottom>
                    {t('course.modules')}
                </Typography>

                {course.modules && course.modules.length > 0 ? (
                    course.modules.map((module, idx) => (
                        <Accordion key={module.id} defaultExpanded={idx === 0}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">
                                    {idx + 1}. {module.title}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {/* Render HTML content from WYSIWYG editor */}
                                <Box
                                    dangerouslySetInnerHTML={{ __html: module.content }}
                                    sx={{
                                        '& img': { maxWidth: '100%', height: 'auto' },
                                        '& a': { color: 'primary.main' },
                                        mb: 2
                                    }}
                                />

                                {/* Embedded Video Player */}
                                {module.videoUrl && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Video Lesson
                                        </Typography>
                                        <VideoPlayer
                                            src={module.videoUrl}
                                            poster={course.thumbnail}
                                            onProgress={(progress) => {
                                                // Track video progress for analytics
                                                console.log('Video progress:', progress);
                                            }}
                                        />
                                    </Box>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))
                ) : (
                    <Alert severity="info">No modules yet</Alert>
                )}

                {/* Quizzes - Only show to enrolled students or instructors/admins */}
                {(enrolled || ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(user?.role)) && (
                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">
                                {t('nav.quizzes')}
                            </Typography>
                            {/* Create Quiz Button for Admin/Instructor */}
                            {(['ADMIN', 'SUPER_ADMIN'].includes(user?.role) || (user?.role === 'INSTRUCTOR' && course.instructorId === user?.id)) && (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => router.push('/instructor/quiz-builder?courseId=' + course.id)}
                                >
                                    Create Quiz
                                </Button>
                            )}
                        </Box>

                        {course.quizzes && course.quizzes.length > 0 ? (
                            course.quizzes.map((quiz) => {
                                const now = new Date();
                                const startDate = quiz.startDate ? new Date(quiz.startDate) : null;
                                const endDate = quiz.endDate ? new Date(quiz.endDate) : null;

                                let canStart = true;
                                let dateMsg = '';

                                // Students: check dates
                                if (user?.role === 'STUDENT') {
                                    if (startDate && now < startDate) {
                                        canStart = false;
                                        dateMsg = `Opens: ${startDate.toLocaleString()}`;
                                    } else if (endDate && now > endDate) {
                                        canStart = false;
                                        dateMsg = `Closed: ${endDate.toLocaleString()}`;
                                    } else if (endDate) {
                                        dateMsg = `Closes: ${endDate.toLocaleString()}`;
                                    }
                                }

                                return (
                                    <Card key={quiz.id} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Typography variant="h6">{quiz.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {quiz.duration} minutes · Passing: {quiz.passingScore}%
                                            </Typography>
                                            {dateMsg && (
                                                <Typography variant="body2" color={canStart ? "success.main" : "error.main"} sx={{ mt: 1, fontWeight: 'bold' }}>
                                                    {dateMsg}
                                                </Typography>
                                            )}
                                            {/* Students: Take quiz button */}
                                            {user?.role === 'STUDENT' && (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                    onClick={() => router.push(`/quizzes/${quiz.id}/take`)}
                                                    disabled={!canStart}
                                                >
                                                    {t('quiz.start')}
                                                </Button>
                                            )}

                                            {/* Instructors/Admins: View questions (no taking quiz) */}
                                            {['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                    onClick={() => router.push(`/quizzes/${quiz.id}`)}
                                                >
                                                    View Questions
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Alert severity="info">No quizzes available</Alert>
                        )}
                    </Box>
                )}

                {/* Assignments Section */}
                {(enrolled || ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(user?.role)) && (
                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">
                                Assignments
                            </Typography>
                        </Box>

                        {course.assignments && course.assignments.length > 0 ? (
                            course.assignments.map((assignment) => (
                                <Card key={assignment.id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6">{assignment.title}</Typography>
                                        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={`${assignment.points} pts`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                            {assignment.dueDate && (
                                                <Chip
                                                    icon={<Box component="span" sx={{ display: 'flex', mr: 0.5 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></Box>}
                                                    label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                                                    size="small"
                                                />
                                            )}
                                        </Box>

                                        {user?.role === 'STUDENT' ? (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => router.push(`/assignments/${assignment.id}`)}
                                            >
                                                View & Submit
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => router.push(`/instructor/assignments/${assignment.id}/submissions`)}
                                            >
                                                View Submissions
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Alert severity="info">No assignments available</Alert>
                        )}
                    </Box>
                )}
            </Box>
        </Container >
    );
}
