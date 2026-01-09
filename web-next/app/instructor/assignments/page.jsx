'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    MenuItem,
    CircularProgress,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Assignment,
    CalendarToday,
    People
} from '@mui/icons-material';
import api from '@/services/api';

export default function AssignmentsPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
        points: 100,
        courseId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, coursesRes] = await Promise.all([
                api.get('/assignments/instructor/all'),
                api.get('/instructor/my-courses')
            ]);

            setAssignments(assignmentsRes.data.assignments);
            setCourses(coursesRes.data.courses);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setError('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (assignment = null) => {
        if (assignment) {
            setCurrentAssignment(assignment);
            // Format date for datetime-local (YYYY-MM-DDThh:mm)
            const date = assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '';
            setFormData({
                title: assignment.title,
                description: assignment.description || '',
                deadline: date,
                points: assignment.points,
                courseId: assignment.courseId
            });
        } else {
            setCurrentAssignment(null);
            setFormData({
                title: '',
                description: '',
                deadline: '',
                points: 100,
                courseId: courses.length > 0 ? courses[0].id : ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentAssignment(null);
        setError('');
    };

    const handleSave = async () => {
        try {
            if (!formData.title || !formData.courseId) {
                alert('Please fill in all required fields');
                return;
            }

            const payload = {
                ...formData,
                dueDate: formData.deadline ? new Date(formData.deadline).toISOString() : null
            };

            if (currentAssignment) {
                // Update
                await api.put(`/assignments/${currentAssignment.id}`, payload);
            } else {
                // Create
                await api.post('/assignments', payload);
            }

            handleCloseDialog();
            fetchData();
        } catch (error) {
            console.error('Failed to save assignment:', error);
            setError('Failed to save assignment');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;

        try {
            await api.delete(`/assignments/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete assignment:', error);
            setError('Failed to delete assignment');
        }
    };

    const getStatusColor = (assignment) => {
        if (!assignment.totalStudents || assignment.totalStudents === 0) return 'default';
        const submissionRate = (assignment.submissions / assignment.totalStudents) * 100;
        if (submissionRate >= 80) return 'success';
        if (submissionRate >= 50) return 'warning';
        return 'error';
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Assignments
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    disabled={courses.length === 0}
                >
                    Create Assignment
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {courses.length === 0 ? (
                <Alert severity="warning">
                    You don't have any courses assigned. You need to be assigned to a course to create assignments.
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {assignments.map((assignment) => (
                        <Grid item xs={12} md={6} key={assignment.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" component="h2">
                                            {assignment.title}
                                        </Typography>
                                        <Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(assignment)}
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(assignment.id)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 2, minHeight: '40px' }}
                                    >
                                        {assignment.description || 'No description'}
                                    </Typography>

                                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip
                                            label={assignment.courseName || 'Unknown Course'}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                        {assignment.dueDate && (
                                            <Chip
                                                icon={<CalendarToday />}
                                                label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                                                size="small"
                                            />
                                        )}
                                        <Chip
                                            label={`${assignment.points} pts`}
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                        <People sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                            {assignment.submissions} / {assignment.totalStudents || 0} submitted
                                        </Typography>

                                        {assignment.totalStudents > 0 && (
                                            <Chip
                                                label={`${Math.round((assignment.submissions / assignment.totalStudents) * 100)}%`}
                                                size="small"
                                                color={getStatusColor(assignment)}
                                            />
                                        )}
                                    </Box>

                                    <Button
                                        variant="text"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        onClick={() => router.push(`/instructor/assignments/${assignment.id}/submissions`)}
                                    >
                                        View Submissions
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {assignments.length === 0 && !loading && courses.length > 0 && (
                <Alert severity="info" sx={{ mt: 4 }}>
                    No assignments yet. Click "Create Assignment" to get started.
                </Alert>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {currentAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={formData.courseId}
                                label="Course"
                                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                disabled={!!currentAssignment} // Prevent changing course on edit
                            >
                                {courses.map((course) => (
                                    <MenuItem key={course.id} value={course.id}>
                                        {course.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Title"
                            fullWidth
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <TextField
                            label="Deadline"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                        <TextField
                            label="Points"
                            type="number"
                            fullWidth
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {currentAssignment ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
