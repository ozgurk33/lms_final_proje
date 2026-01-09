'use client';

import { useRouter } from 'next/navigation';
import {
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Typography,
    Box
} from '@mui/material';
import {
    Quiz,
    Assessment,
    GradeOutlined,
    QuestionAnswer,
    Assignment,
    Download,
    CloudOff,
    Videocam,
    Settings,
    People,
    ContentPaste,
    BarChart
} from '@mui/icons-material';

const QuickActionsGrid = () => {
    const router = useRouter();

    const actions = [
        {
            title: 'Create Quiz',
            description: 'Use course cards below',
            icon: <Quiz color="primary" sx={{ fontSize: 40 }} />,
            path: '/instructor/quiz-builder',
            color: '#4285F4'
        },
        {
            title: 'Question Bank',
            description: 'Manage categories & tags',
            icon: <QuestionAnswer color="secondary" sx={{ fontSize: 40 }} />,
            path: '/instructor/question-bank',
            color: '#EA4335'
        },
        {
            title: 'Gradebook',
            description: 'View & export grades',
            icon: <GradeOutlined sx={{ fontSize: 40, color: '#34A853' }} />,
            path: '/instructor/gradebook',
            color: '#34A853'
        },
        {
            title: 'Assignments',
            description: 'Create & manage assignments',
            icon: <Assignment sx={{ fontSize: 40, color: '#FBBC04' }} />,
            path: '/instructor/assignments',
            color: '#FBBC04'
        },
        {
            title: 'Rubric Builder',
            description: 'Essay grading criteria',
            icon: <Assessment sx={{ fontSize: 40, color: '#9C27B0' }} />,
            path: '/instructor/quiz-builder',
            color: '#9C27B0'
        },
        {
            title: 'Plagiarism Check',
            description: 'Detect similarity',
            icon: <ContentPaste sx={{ fontSize: 40, color: '#FF5722' }} />,
            path: '/instructor/plagiarism',
            color: '#FF5722'
        },
        {
            title: 'Analytics',
            description: 'Course insights & stats',
            icon: <BarChart sx={{ fontSize: 40, color: '#00BCD4' }} />,
            path: '/instructor/analytics',
            color: '#00BCD4'
        },
        {
            title: 'Students',
            description: 'Manage enrollments',
            icon: <People sx={{ fontSize: 40, color: '#607D8B' }} />,
            path: '/instructor/students',
            color: '#607D8B'
        },
        // Desktop-specific features
        {
            title: 'Downloads',
            description: 'Desktop: Track downloads',
            icon: <Download sx={{ fontSize: 40, color: '#795548' }} />,
            path: '/desktop-settings',
            color: '#795548',
            desktop: true
        },
        {
            title: 'Offline Mode',
            description: 'Desktop: Sync & cache',
            icon: <CloudOff sx={{ fontSize: 40, color: '#9E9E9E' }} />,
            path: '/desktop-settings',
            color: '#9E9E9E',
            desktop: true
        },
        {
            title: 'Media Devices',
            description: 'Desktop: Camera & mic',
            icon: <Videocam sx={{ fontSize: 40, color: '#E91E63' }} />,
            path: '/desktop-settings',
            color: '#E91E63',
            desktop: true
        },
        {
            title: 'Desktop Settings',
            description: 'Desktop: App preferences',
            icon: <Settings sx={{ fontSize: 40, color: '#3F51B5' }} />,
            path: '/desktop-settings',
            color: '#3F51B5',
            desktop: true
        }
    ];

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Quick Actions
            </Typography>
            <Grid container spacing={2}>
                {actions.map((action, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                },
                                position: 'relative',
                                overflow: 'visible'
                            }}
                        >
                            {action.desktop && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -8,
                                        right: -8,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 24,
                                        height: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        zIndex: 1
                                    }}
                                >
                                    D
                                </Box>
                            )}
                            <CardActionArea
                                onClick={() => router.push(action.path)}
                                sx={{ height: '100%' }}
                            >
                                <CardContent
                                    sx={{
                                        textAlign: 'center',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        p: 2
                                    }}
                                >
                                    {action.icon}
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        sx={{ mt: 1, mb: 0.5 }}
                                    >
                                        {action.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {action.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default QuickActionsGrid;
