'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Button
} from '@mui/material';
import {
    BarChart as BarChartIcon,
    TrendingUp,
    People,
    Quiz,
    Assignment,
    Star,
    Download
} from '@mui/icons-material';

export default function AnalyticsPage() {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock courses
    const courses = [
        { id: 'all', name: 'All Courses' },
        { id: 1, name: 'Computer Science 101' },
        { id: 2, name: 'Physics 201' },
        { id: 3, name: 'Mathematics 301' }
    ];

    useEffect(() => {
        // TODO: Fetch from API
        setTimeout(() => {
            setAnalytics({
                overview: {
                    totalStudents: 120,
                    activeStudents: 98,
                    averageGrade: 82.5,
                    completionRate: 75
                },
                quizStats: [
                    { name: 'Quiz 1', avgScore: 85, submissions: 100, totalStudents: 120 },
                    { name: 'Quiz 2', avgScore: 78, submissions: 95, totalStudents: 120 },
                    { name: 'Quiz 3', avgScore: 92, submissions: 110, totalStudents: 120 }
                ],
                topPerformers: [
                    { name: 'Alice Johnson', grade: 95.5, quizzes: 12, assignments: 8 },
                    { name: 'Bob Smith', grade: 93.2, quizzes: 11, assignments: 8 },
                    { name: 'Carol White', grade: 91.8, quizzes: 12, assignments: 7 }
                ],
                gradeDistribution: [
                    { range: 'A (90-100)', count: 35, percentage: 29 },
                    { range: 'B (80-89)', count: 45, percentage: 38 },
                    { range: 'C (70-79)', count: 25, percentage: 21 },
                    { range: 'D (60-69)', count: 10, percentage: 8 },
                    { range: 'F (0-59)', count: 5, percentage: 4 }
                ]
            });
            setLoading(false);
        }, 1000);
    }, [selectedCourse]);

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" sx={{ color }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ color, opacity: 0.7 }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }}>Loading analytics...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Analytics Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Course</InputLabel>
                        <Select
                            value={selectedCourse}
                            label="Course"
                            onChange={(e) => setSelectedCourse(e.target.value)}
                        >
                            {courses.map((course) => (
                                <MenuItem key={course.id} value={course.id}>
                                    {course.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Download />}>
                        Export Report
                    </Button>
                </Box>
            </Box>

            {/* Overview Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Students"
                        value={analytics.overview.totalStudents}
                        icon={<People sx={{ fontSize: 40 }} />}
                        color="#4285F4"
                        subtitle={`${analytics.overview.activeStudents} active`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Average Grade"
                        value={`${analytics.overview.averageGrade}%`}
                        icon={<Star sx={{ fontSize: 40 }} />}
                        color="#FBBC04"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Completion Rate"
                        value={`${analytics.overview.completionRate}%`}
                        icon={<TrendingUp sx={{ fontSize: 40 }} />}
                        color="#34A853"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Rate"
                        value={`${Math.round((analytics.overview.activeStudents / analytics.overview.totalStudents) * 100)}%`}
                        icon={<Quiz sx={{ fontSize: 40 }} />}
                        color="#EA4335"
                    />
                </Grid>
            </Grid>

            {/* Grade Distribution */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Grade Distribution
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        {analytics.gradeDistribution.map((grade, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">{grade.range}</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {grade.count} students ({grade.percentage}%)
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={grade.percentage}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 'grey.200',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: index === 0 ? '#34A853' :
                                                index === 1 ? '#4285F4' :
                                                    index === 2 ? '#FBBC04' :
                                                        index === 3 ? '#FF9800' : '#EA4335'
                                        }
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                {/* Quiz Performance */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quiz Performance
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Quiz</TableCell>
                                            <TableCell align="right">Avg Score</TableCell>
                                            <TableCell align="right">Completion</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics.quizStats.map((quiz, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{quiz.name}</TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={`${quiz.avgScore}%`}
                                                        size="small"
                                                        color={quiz.avgScore >= 80 ? 'success' : quiz.avgScore >= 60 ? 'warning' : 'error'}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {quiz.submissions}/{quiz.totalStudents}
                                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                        ({Math.round((quiz.submissions / quiz.totalStudents) * 100)}%)
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top Performers */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Top Performers
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Student</TableCell>
                                            <TableCell align="right">Grade</TableCell>
                                            <TableCell align="right">Activities</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics.topPerformers.map((student, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {index + 1}.
                                                        <Typography sx={{ ml: 1 }}>{student.name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={`${student.grade}%`}
                                                        size="small"
                                                        color="success"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="caption" color="text.secondary">
                                                        {student.quizzes}Q / {student.assignments}A
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}
