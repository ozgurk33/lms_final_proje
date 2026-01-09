'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Avatar
} from '@mui/material';
import {
    ArrowBack,
    CheckCircle,
    Cancel,
    Person,
    Download
} from '@mui/icons-material';
import api from '@/services/api';

export default function AssignmentSubmissionsPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id;

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });

    useEffect(() => {
        fetchData();
    }, [assignmentId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentRes, submissionsRes] = await Promise.all([
                api.get(`/assignments/${assignmentId}`),
                api.get(`/assignments/${assignmentId}/submissions`)
            ]);

            setAssignment(assignmentRes.data.assignment);
            setSubmissions(submissionsRes.data.submissions);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
            alert('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGradeDialog = (submission) => {
        setGradingSubmission(submission);
        setGradeData({
            grade: submission.grade || '',
            feedback: submission.feedback || ''
        });
    };

    const handleCloseGradeDialog = () => {
        setGradingSubmission(null);
        setGradeData({ grade: '', feedback: '' });
    };

    const handleSaveGrade = async () => {
        try {
            if (gradeData.grade === '') {
                alert('Grade is required');
                return;
            }

            await api.post(`/assignments/${assignmentId}/submissions/${gradingSubmission.id}/grade`, {
                grade: parseFloat(gradeData.grade),
                feedback: gradeData.feedback
            });

            handleCloseGradeDialog();
            fetchData(); // Refresh list to show new grade
        } catch (error) {
            console.error('Failed to save grade:', error);
            alert('Failed to save grade');
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!assignment) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Assignment not found</Alert>
            </Container>
        );
    }

    // Sort submissions: ungraded first, then by date
    const sortedSubmissions = [...submissions].sort((a, b) => {
        if (a.grade === null && b.grade !== null) return -1;
        if (a.grade !== null && b.grade === null) return 1;
        return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => router.push('/instructor/assignments')}
                sx={{ mb: 2 }}
            >
                Back to Assignments
            </Button>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {assignment.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    {assignment.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip label={`Points: ${assignment.points}`} color="primary" variant="outlined" />
                    <Chip label={`Submissions: ${submissions.length}`} variant="outlined" />
                    {assignment.dueDate && (
                        <Chip label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`} variant="outlined" />
                    )}
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Submitted At</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Grade</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedSubmissions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    No submissions yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedSubmissions.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 30, height: 30 }}>
                                                {submission.student?.fullName?.charAt(0) || <Person />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {submission.student?.fullName || submission.student?.username}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {submission.student?.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(submission.submittedAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {submission.grade !== null ? (
                                            <Chip label="Graded" color="success" size="small" icon={<CheckCircle />} />
                                        ) : (
                                            <Chip label="Pending Review" color="warning" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {submission.grade !== null ? (
                                            <Typography fontWeight="bold">{submission.grade} / {assignment.points}</Typography>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleOpenGradeDialog(submission)}
                                        >
                                            {submission.grade !== null ? 'Update Grade' : 'Grade'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Grading Dialog */}
            <Dialog open={!!gradingSubmission} onClose={handleCloseGradeDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Grade Submission: {gradingSubmission?.student?.fullName}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Submission Content Display */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                            <Typography variant="subtitle2" gutterBottom>Submission Content:</Typography>
                            {gradingSubmission?.content ? (
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {gradingSubmission.content}
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No text content</Typography>
                            )}

                            {gradingSubmission?.fileUrl && (
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        startIcon={<Download />}
                                        href={gradingSubmission.fileUrl}
                                        target="_blank"
                                    >
                                        Download File
                                    </Button>
                                </Box>
                            )}
                        </Paper>

                        <TextField
                            label={`Grade (Max: ${assignment.points})`}
                            type="number"
                            fullWidth
                            required
                            value={gradeData.grade}
                            onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                            inputProps={{ max: assignment.points, min: 0 }}
                        />
                        <TextField
                            label="Feedback"
                            fullWidth
                            multiline
                            rows={3}
                            value={gradeData.feedback}
                            onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                            placeholder="Optional feedback for the student"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseGradeDialog}>Cancel</Button>
                    <Button onClick={handleSaveGrade} variant="contained">
                        Save Grade
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
