'use client';

import { useState, useEffect } from 'react';
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
    Paper,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Menu
} from '@mui/material';
import {
    Download,
    Upload,
    FilterList,
    MoreVert
} from '@mui/icons-material';
import { courseService } from '@/services/courseService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * GradebookPage Component
 * Comprehensive gradebook for viewing all students' grades
 * Features: filtering, searching, export/import, grade editing
 */
export default function GradebookPage() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all');
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            loadGrades();
        }
    }, [selectedCourse]);

    const loadCourses = async () => {
        try {
            const response = await courseService.getAllCourses();
            setCourses(response.data || []);
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    };

    const loadGrades = async () => {
        try {
            setLoading(true);
            // Mock data - replace with actual API call
            const mockStudents = [
                { id: 1, name: 'John Doe', email: 'john@example.com' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
            ];

            const mockGrades = mockStudents.map(student => ({
                studentId: student.id,
                studentName: student.name,
                quizzes: [
                    { name: 'Quiz 1', score: 85, maxScore: 100 },
                    { name: 'Quiz 2', score: 90, maxScore: 100 }
                ],
                assignments: [
                    { name: 'Assignment 1', score: 88, maxScore: 100 }
                ],
                total: 87.5
            }));

            setStudents(mockStudents);
            setGrades(mockGrades);
        } catch (error) {
            console.error('Failed to load grades:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredGrades = grades.filter(grade => {
        const matchesSearch = grade.studentName.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterBy === 'passing') {
            return matchesSearch && grade.total >= 60;
        } else if (filterBy === 'failing') {
            return matchesSearch && grade.total < 60;
        }
        return matchesSearch;
    });

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Gradebook Report', 14, 22);

        const tableData = filteredGrades.map(grade => [
            grade.studentName,
            grade.total.toFixed(2) + '%',
            grade.quizzes.length,
            grade.assignments.length
        ]);

        doc.autoTable({
            head: [['Student Name', 'Total Grade', 'Quizzes', 'Assignments']],
            body: tableData,
            startY: 30
        });

        doc.save('gradebook.pdf');
    };

    const exportToCSV = () => {
        const headers = ['Student Name', 'Total Grade', 'Quizzes', 'Assignments'];
        const rows = filteredGrades.map(grade => [
            grade.studentName,
            grade.total.toFixed(2),
            grade.quizzes.length,
            grade.assignments.length
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gradebook.csv';
        a.click();
    };

    const getGradeColor = (total) => {
        if (total >= 90) return 'success';
        if (total >= 70) return 'primary';
        if (total >= 60) return 'warning';
        return 'error';
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Gradebook
                </Typography>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControl sx={{ minWidth: 250 }}>
                                <InputLabel>Select Course</InputLabel>
                                <Select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    label="Select Course"
                                >
                                    {courses.map(course => (
                                        <MenuItem key={course._id} value={course._id}>
                                            {course.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Search Students"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ flex: 1, minWidth: 200 }}
                            />

                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>Filter</InputLabel>
                                <Select
                                    value={filterBy}
                                    onChange={(e) => setFilterBy(e.target.value)}
                                    label="Filter"
                                >
                                    <MenuItem value="all">All Students</MenuItem>
                                    <MenuItem value="passing">Passing (&ge;60%)</MenuItem>
                                    <MenuItem value="failing">Failing (&lt;60%)</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                startIcon={<Download />}
                                variant="outlined"
                                onClick={exportToPDF}
                            >
                                Export PDF
                            </Button>

                            <Button
                                startIcon={<Download />}
                                variant="outlined"
                                onClick={exportToCSV}
                            >
                                Export CSV
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {selectedCourse ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Student Name</strong></TableCell>
                                    <TableCell><strong>Total Grade</strong></TableCell>
                                    <TableCell><strong>Quizzes</strong></TableCell>
                                    <TableCell><strong>Assignments</strong></TableCell>
                                    <TableCell><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredGrades.map((grade) => (
                                    <TableRow key={grade.studentId}>
                                        <TableCell>{grade.studentName}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${grade.total.toFixed(1)}%`}
                                                color={getGradeColor(grade.total)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {grade.quizzes.map((quiz, idx) => (
                                                <Typography key={idx} variant="caption" display="block">
                                                    {quiz.name}: {quiz.score}/{quiz.maxScore}
                                                </Typography>
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            {grade.assignments.map((assignment, idx) => (
                                                <Typography key={idx} variant="caption" display="block">
                                                    {assignment.name}: {assignment.score}/{assignment.maxScore}
                                                </Typography>
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small">
                                                <MoreVert />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                Select a course to view grades
                            </Typography>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Container>
    );
}
