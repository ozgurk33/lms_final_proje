'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';

export default function InstructorAllStudents() {
    const { t } = useTranslation();
    const router = useRouter();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradeFilter, setGradeFilter] = useState('');

    useEffect(() => {
        loadStudents();
    }, [gradeFilter]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/instructor/students${gradeFilter ? `?grade=${gradeFilter}` : ''}`);
            setStudents(response.data.students || []);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
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

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    All Students
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <TextField
                        select
                        label="Filter by Grade"
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="">All Grades</MenuItem>
                        {[1, 2, 3, 4].map((grade) => (
                            <MenuItem key={grade} value={grade}>
                                Grade {grade} ({grade === 1 ? 'Freshman' : grade === 2 ? 'Sophomore' : grade === 3 ? 'Junior' : 'Senior'})
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Card>
                    <CardContent>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Full Name</strong></TableCell>
                                        <TableCell><strong>Username</strong></TableCell>
                                        <TableCell><strong>Email</strong></TableCell>
                                        <TableCell><strong>Grade</strong></TableCell>
                                        <TableCell align="center"><strong>Enrolled Courses</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id} hover>
                                            <TableCell>{student.fullName || '-'}</TableCell>
                                            <TableCell>{student.username}</TableCell>
                                            <TableCell>{student.email}</TableCell>
                                            <TableCell>
                                                {student.grade ? (
                                                    <Chip label={`Grade ${student.grade}`} size="small" color="primary" />
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {student._count?.enrollments || 0}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {students.length === 0 && (
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No students found
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}
