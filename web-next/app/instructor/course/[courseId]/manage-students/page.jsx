'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import api from '../../../../../services/api';

export default function InstructorManageStudents() {
    const params = useParams();
    const courseId = params.courseId;
    const [course, setCourse] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [gradeFilter, setGradeFilter] = useState('');

    useEffect(() => {
        loadData();
    }, [courseId, gradeFilter]);

    const loadData = async () => {
        try {
            const [courseRes, studentsRes, enrolledRes] = await Promise.all([
                api.get(`/api/courses/${courseId}`),
                api.get(`/api/instructor/students${gradeFilter ? `?grade=${gradeFilter}` : ''}`),
                api.get(`/api/instructor/course/${courseId}/students`)
            ]);

            setCourse(courseRes.data.course);
            setAllStudents(studentsRes.data.students || []);
            const enrolled = new Set((enrolledRes.data.enrollments || []).map(e => e.userId));
            setEnrolledStudents(enrolled);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const handleToggle = (studentId) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleAssign = async () => {
        try {
            await api.post('/instructor/assign-students', {
                courseId,
                studentIds: Array.from(selectedStudents)
            });

            setSelectedStudents(new Set());
            loadData();
            alert('Students assigned successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to assign students');
        }
    };

    if (!course) return null;

    const availableStudents = allStudents.filter(s => !enrolledStudents.has(s.id));

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Manage Students - {course.title}
                </Typography>

                <FormControl sx={{ minWidth: 200, mb: 3 }}>
                    <InputLabel>Filter by Grade</InputLabel>
                    <Select
                        value={gradeFilter}
                        label="Filter by Grade"
                        onChange={(e) => setGradeFilter(e.target.value)}
                    >
                        <MenuItem value="">All Grades</MenuItem>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                            <MenuItem key={grade} value={grade}>Grade {grade}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">Available Students</Typography>
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={handleAssign}
                                disabled={selectedStudents.size === 0}
                            >
                                Assign ({selectedStudents.size})
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox"></TableCell>
                                        <TableCell><strong>Name</strong></TableCell>
                                        <TableCell><strong>Username</strong></TableCell>
                                        <TableCell><strong>Grade</strong></TableCell>
                                        <TableCell><strong>Enrolled Courses</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {availableStudents.map((student) => (
                                        <TableRow
                                            key={student.id}
                                            hover
                                            onClick={() => handleToggle(student.id)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedStudents.has(student.id)}
                                                    onChange={() => handleToggle(student.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{student.fullName || '-'}</TableCell>
                                            <TableCell>{student.username}</TableCell>
                                            <TableCell>
                                                {student.grade ? (
                                                    <Chip label={`Grade ${student.grade}`} size="small" color="primary" />
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{student._count?.enrollments || 0}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}
