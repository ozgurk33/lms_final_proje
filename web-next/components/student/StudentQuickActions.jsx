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
    Download,
    CloudOff,
    Videocam,
    Settings,
    FolderOpen
} from '@mui/icons-material';

const StudentQuickActions = () => {
    const router = useRouter();

    const actions = [
        // Desktop-specific features only
        {
            title: 'Downloads',
            description: 'Track & manage downloads',
            icon: <Download sx={{ fontSize: 40, color: '#795548' }} />,
            path: '/desktop-settings',
            color: '#795548',
            desktop: true
        },
        {
            title: 'Offline Study',
            description: 'Work offline, sync later',
            icon: <CloudOff sx={{ fontSize: 40, color: '#9E9E9E' }} />,
            path: '/desktop-settings',
            color: '#9E9E9E',
            desktop: true
        },
        {
            title: 'Live Classes',
            description: 'Join with camera & mic',
            icon: <Videocam sx={{ fontSize: 40, color: '#E91E63' }} />,
            path: '/desktop-settings',
            color: '#E91E63',
            desktop: true
        },
        {
            title: 'File System',
            description: 'Save & read files locally',
            icon: <FolderOpen sx={{ fontSize: 40, color: '#4CAF50' }} />,
            path: '/desktop-settings',
            color: '#4CAF50',
            desktop: true
        },
        {
            title: 'App Settings',
            description: 'Desktop preferences',
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
                    <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
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
                                        bgcolor: 'success.main',
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

export default StudentQuickActions;
