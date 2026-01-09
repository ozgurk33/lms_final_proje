'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { PersonAdd, Edit, SwapHoriz } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function AdminCourseAssignment() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedInstructor, setSelectedInstructor] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, instructorsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/admin/courses/instructors')
            ]);

            setCourses(coursesRes.data.courses || []);
            setInstructors(instructorsRes.data.instructors || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const handleOpenAssignDialog = (course) => {
        setSelectedCourse(course);
        setSelectedInstructor(course.instructor?.id || '');
        setOpenDialog(true);
    };

    const handleAssign = async () => {
        console.log('Assign button clicked');
        console.log('Selected Course:', selectedCourse);
        console.log('Selected Instructor:', selectedInstructor);

        try {
            if (!selectedInstructor) {
                alert('Please select an instructor');
                return;
            }

            console.log('Sending request to /api/admin/courses/assign-course...');
            const response = await api.post('/admin/courses/assign-course', {
                courseId: selectedCourse.id,
                instructorId: selectedInstructor
            });
            console.log('Response:', response.data);

            setOpenDialog(false);
            setSelectedCourse(null);
            setSelectedInstructor('');
            loadData();
            alert('Instructor assigned successfully!');
        } catch (error) {
            console.error('Assign Error:', error);
            alert(error.response?.data?.error || 'Failed to assign course');
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Manage Course Assignments</Typography>
                </Box>

                <Card>
                    <CardContent>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Course Title</strong></TableCell>
                                        <TableCell><strong>Category</strong></TableCell>
                                        <TableCell><strong>Current Instructor</strong></TableCell>
                                        <TableCell align="right"><strong>Actions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {courses.map((course) => (
                                        <TableRow key={course.id} hover>
                                            <TableCell>{course.title}</TableCell>
                                            <TableCell>
                                                {course.category && (
                                                    <Chip label={course.category} size="small" />
                                                )}
                                                {!course.isPublished && (
                                                    <Chip label="Draft" size="small" color="warning" sx={{ ml: 1 }} />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {course.instructor ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip
                                                            label={course.instructor.fullName}
                                                            color="primary"
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                        Unassigned
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    <Tooltip title="Assign/Change Instructor">
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color={course.instructor ? "info" : "success"}
                                                            startIcon={course.instructor ? <SwapHoriz /> : <PersonAdd />}
                                                            onClick={() => handleOpenAssignDialog(course)}
                                                        >
                                                            {course.instructor ? 'Reassign' : 'Assign'}
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Course Content">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<Edit />}
                                                            onClick={() => router.push(`/instructor/edit-course/${course.id}`)}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {courses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                No courses found. Create one first!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {selectedCourse?.instructor ? 'Change Instructor' : 'Assign Instructor'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Course:</strong> {selectedCourse?.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Select an instructor to take over this course.
                                {selectedCourse?.instructor && ' The current instructor will be removed.'}
                            </Typography>
                        </Box>

                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Instructor</InputLabel>
                            <Select
                                value={selectedInstructor}
                                label="Instructor"
                                onChange={(e) => setSelectedInstructor(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>None (Unassign)</em>
                                </MenuItem>
                                {instructors.map((inst) => (
                                    <MenuItem key={inst.id} value={inst.id}>
                                        {inst.fullName} ({inst.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button onClick={handleAssign} variant="contained" color="primary">
                            Save Assignment
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
}
