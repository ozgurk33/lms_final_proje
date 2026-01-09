'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Grid,
    FormControlLabel,
    Radio,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Checkbox
} from '@mui/material';
import { Add, Delete, Save, ArrowBack, Lock } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { quizService } from '@/services/courseService';
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, QUESTION_TYPE_DESCRIPTIONS } from '@/utils/questionTypes';

export default function QuizBuilder() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get courseId from query param instead of location.state
    // Usage: /instructor/quiz-builder?courseId=123
    const [courseId, setCourseId] = useState(searchParams.get('courseId') || null);

    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        duration: 30,
        passingScore: 60,
        requireSEB: false,
        startDate: '',
        endDate: ''
    });

    const [questions, setQuestions] = useState([]);

    // New Question Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        content: '',
        points: 10,
        options: ['', '', '', ''],
        correctAnswer: '',
        useRandomPool: false // For random question selection
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!courseId) {
            // Fallback: try to get from URL params if state failed (already handled above via proper Next.js hook)
        }
    }, [courseId]);


    const handleQuizChange = (field, value) => {
        setQuiz({ ...quiz, [field]: value });
    };

    const handleOpenDialog = () => {
        setNewQuestion({
            type: QUESTION_TYPES.MULTIPLE_CHOICE,
            content: '',
            points: 10,
            options: ['', '', '', ''],
            correctAnswer: '',
            useRandomPool: false
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleNewQuestionChange = (field, value) => {
        setNewQuestion({ ...newQuestion, [field]: value });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...newQuestion.options];
        newOptions[index] = value;
        setNewQuestion({ ...newQuestion, options: newOptions });
    };

    const handleAddQuestion = () => {
        // Validation for new question
        if (!newQuestion.content) return;
        if (newQuestion.type === 'MULTIPLE_CHOICE') {
            if (newQuestion.options.some(opt => !opt)) return; // All options filled
            if (!newQuestion.correctAnswer) return;
        } else {
            // For open ended, we might want a reference answer
            if (!newQuestion.correctAnswer) return;
        }

        setQuestions([...questions, { ...newQuestion }]);
        setOpenDialog(false);
    };

    const handleRemoveQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setError('');
            setSaving(true);

            if (!quiz.title) {
                setError('Title is required');
                setSaving(false);
                return;
            }
            if (questions.length === 0) {
                setError('Please add at least one question');
                setSaving(false);
                return;
            }

            const quizData = {
                ...quiz,
                duration: parseInt(quiz.duration),
                passingScore: parseFloat(quiz.passingScore),
                courseId,
                questions: questions.map((q, idx) => ({
                    ...q,
                    points: parseInt(q.points),
                    order: idx
                }))
            };

            await quizService.create(quizData);
            router.push(`/courses/${courseId}`);
        } catch (err) {
            console.error('Failed to create quiz:', err);
            setError(err.response?.data?.error || 'Failed to create quiz');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    sx={{ mb: 2 }}
                >
                    Back to Course
                </Button>

                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Create New Exam
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Quiz Details */}
                <Card sx={{ mb: 4, p: 2 }}>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Exam Title"
                                    value={quiz.title}
                                    onChange={(e) => handleQuizChange('title', e.target.value)}
                                    placeholder="e.g., Midterm Exam"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Description"
                                    value={quiz.description}
                                    onChange={(e) => handleQuizChange('description', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Duration (minutes)"
                                    value={quiz.duration}
                                    onChange={(e) => handleQuizChange('duration', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Passing Score (%)"
                                    value={quiz.passingScore}
                                    onChange={(e) => handleQuizChange('passingScore', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    label="Start Date"
                                    value={quiz.startDate || ''}
                                    onChange={(e) => handleQuizChange('startDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    label="End Date"
                                    value={quiz.endDate || ''}
                                    onChange={(e) => handleQuizChange('endDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={quiz.requireSEB}
                                            onChange={(e) => handleQuizChange('requireSEB', e.target.checked)}
                                            icon={<Lock />}
                                            checkedIcon={<Lock color="primary" />}
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography>Require Safe Exam Browser (SEB)</Typography>
                                            <Chip
                                                label="Secure"
                                                size="small"
                                                color="primary"
                                                sx={{ height: 20 }}
                                            />
                                        </Box>
                                    }
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -1 }}>
                                    Students must use Safe Exam Browser to take this quiz. A config file will be generated for them.
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Questions List */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Questions ({questions.length})</Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenDialog}
                    >
                        Add Question
                    </Button>
                </Box>

                {questions.map((q, idx) => (
                    <Card key={idx} sx={{ mb: 2, position: 'relative' }}>
                        <IconButton
                            color="error"
                            sx={{ position: 'absolute', top: 5, right: 5 }}
                            onClick={() => handleRemoveQuestion(idx)}
                        >
                            <Delete />
                        </IconButton>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Question {idx + 1} - {QUESTION_TYPE_LABELS[q.type]} ({q.points} pts)
                                {q.useRandomPool && <Chip label="Random Pool" size="small" sx={{ ml: 1 }} />}
                            </Typography>
                            <Typography variant="h6" gutterBottom>{q.content}</Typography>

                            {q.type === 'MULTIPLE_CHOICE' && (
                                <Box sx={{ mt: 1 }}>
                                    {q.options.map((opt, i) => (
                                        <Typography key={i} variant="body2" sx={{
                                            color: opt === q.correctAnswer ? 'success.main' : 'text.primary',
                                            fontWeight: opt === q.correctAnswer ? 'bold' : 'normal',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            {String.fromCharCode(65 + i)}. {opt}
                                            {opt === q.correctAnswer && <span style={{ fontSize: '0.8em' }}>(Correct)</span>}
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                            {q.type === 'OPEN_ENDED' && (
                                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                    Expected Answer: {q.correctAnswer}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                ))}

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Save />}
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? 'Creating Exam...' : 'Create Exam'}
                    </Button>
                </Box>

            </Box>

            {/* Add Question Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogContent>
                    <Box sx={{ height: 10 }} /> {/* Spacer */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Question Type</InputLabel>
                        <Select
                            value={newQuestion.type}
                            label="Question Type"
                            onChange={(e) => handleNewQuestionChange('type', e.target.value)}
                        >
                            {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                                <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Alert severity="info" sx={{ mb: 2 }}>
                        {QUESTION_TYPE_DESCRIPTIONS[newQuestion.type]}
                    </Alert>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newQuestion.useRandomPool || false}
                                onChange={(e) => handleNewQuestionChange('useRandomPool', e.target.checked)}
                            />
                        }
                        label="Use Random Question Pool"
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Points"
                        type="number"
                        value={newQuestion.points}
                        onChange={(e) => handleNewQuestionChange('points', e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Question Text"
                        value={newQuestion.content}
                        onChange={(e) => handleNewQuestionChange('content', e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    {newQuestion.type === 'MULTIPLE_CHOICE' ? (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>Options</Typography>
                            {newQuestion.options.map((opt, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Radio
                                        checked={newQuestion.correctAnswer === opt && opt !== ''}
                                        onChange={() => handleNewQuestionChange('correctAnswer', opt)}
                                        disabled={!opt}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                        value={opt}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    />
                                </Box>
                            ))}
                            <Typography variant="caption" color="text.secondary">
                                Fill options and select the radio button for the correct answer.
                            </Typography>
                        </Box>
                    ) : (
                        <TextField
                            fullWidth
                            label="Correct Answer (Model Answer)"
                            value={newQuestion.correctAnswer}
                            onChange={(e) => handleNewQuestionChange('correctAnswer', e.target.value)}
                            helperText="This will be used for auto-grading or reference."
                        />
                    )}

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleAddQuestion} variant="contained">Add Question</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
