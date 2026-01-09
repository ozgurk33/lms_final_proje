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
import QuestionEditor from '@/components/quiz/QuestionEditor';
import api from '@/services/api';

export default function QuizBuilder() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get courseId from query param instead of location.state
    // Usage: /instructor/quiz-builder?courseId=123
    const [courseId, setCourseId] = useState(searchParams.get('courseId') || '');
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

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
        data: {}, // QuestionEditor data
        useRandomPool: false
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            const response = await api.get('/instructor/my-courses');
            setCourses(response.data.courses || []);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
            // Fallback to all courses if instructor endpoint fails
            try {
                const response = await api.get('/courses');
                setCourses(response.data.courses || []);
            } catch (e) {
                console.error('Failed to fetch all courses:', e);
            }
        } finally {
            setLoadingCourses(false);
        }
    };


    const handleQuizChange = (field, value) => {
        setQuiz({ ...quiz, [field]: value });
    };

    const handleOpenDialog = () => {
        setNewQuestion({
            type: QUESTION_TYPES.MULTIPLE_CHOICE,
            content: '',
            points: 10,
            data: { // QuestionEditor expects data here
                options: ['', '', '', ''],
                correctAnswer: null
            },
            useRandomPool: false
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleNewQuestionChange = (field, value) => {
        if (field === 'type') {
            // Reset data when type changes
            let defaultData = {};
            switch (value) {
                case QUESTION_TYPES.MULTIPLE_CHOICE:
                    defaultData = { options: ['', '', '', ''], correctAnswer: null };
                    break;
                case QUESTION_TYPES.MULTIPLE_SELECT:
                    defaultData = { options: ['', '', '', ''], correctAnswers: [] };
                    break;
                case QUESTION_TYPES.TRUE_FALSE:
                    defaultData = { correctAnswer: 'true' };
                    break;
                default:
                    defaultData = {};
            }
            setNewQuestion({ ...newQuestion, type: value, data: defaultData });
        } else {
            setNewQuestion({ ...newQuestion, [field]: value });
        }
    };


    const handleAddQuestion = () => {
        console.log('Adding question:', newQuestion);

        // Basic validation
        if (!newQuestion.content || newQuestion.content.trim() === '') {
            alert('Please enter question text');
            return;
        }

        // Type-specific validation
        if (newQuestion.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
            const options = newQuestion.data?.options || [];
            const correctAnswer = newQuestion.data?.correctAnswer;

            if (options.filter(o => o && o.trim()).length < 2) {
                alert('Please provide at least 2 options');
                return;
            }
            if (correctAnswer === undefined || correctAnswer === null) {
                alert('Please select the correct answer');
                return;
            }
        }

        // Add question to list - merge data from QuestionEditor
        const questionToAdd = {
            type: newQuestion.type,
            content: newQuestion.content,
            points: newQuestion.points,
            useRandomPool: newQuestion.useRandomPool,
            ...newQuestion.data, // Spread the data from QuestionEditor (options, correctAnswer, etc.)
            id: Date.now()
        };

        console.log('Question added:', questionToAdd);
        setQuestions([...questions, questionToAdd]);
        setOpenDialog(false);
    };


    const handleRemoveQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setError('');
            setSaving(true);

            if (!courseId) {
                setError('Please select a course for this exam');
                setSaving(false);
                return;
            }
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

            // DEBUG: Show user how many questions will be sent
            alert(`Quiz will be created with ${questions.length} question(s). Check console for details.`);

            const quizData = {
                ...quiz,
                duration: parseInt(quiz.duration),
                passingScore: parseFloat(quiz.passingScore),
                courseId,
                questions: questions.map((q, idx) => {
                    // Comprehensive mapping: 15 frontend types → 8 database types
                    const mapQuestionType = (frontendType) => {
                        const typeMap = {
                            'multiple_choice': 'MULTIPLE_CHOICE',
                            'multiple_select': 'MULTIPLE_CHOICE',
                            'true_false': 'TRUE_FALSE',
                            'short_answer': 'SHORT_ANSWER',
                            'essay': 'LONG_ANSWER',
                            'numerical': 'SHORT_ANSWER',
                            'matching': 'MATCHING',
                            'fill_blank': 'FILL_IN_BLANK',
                            'ordering': 'ORDERING',
                            'dropdown': 'MULTIPLE_CHOICE',
                            'yes_no': 'TRUE_FALSE',
                            'rating_scale': 'SHORT_ANSWER',
                            'likert_scale': 'SHORT_ANSWER',
                            'checklist': 'MULTIPLE_CHOICE',
                            'grid': 'LONG_ANSWER'
                        };
                        const normalized = frontendType?.toLowerCase();
                        return typeMap[normalized] || 'SHORT_ANSWER';
                    };

                    const questionType = mapQuestionType(q.type);

                    // Format correctAnswer based on original type
                    let correctAnswer = q.correctAnswer;

                    if (q.type === 'multiple_choice' && typeof correctAnswer === 'number') {
                        correctAnswer = q.options?.[correctAnswer] || '';
                    }

                    if (q.type === 'multiple_select' && Array.isArray(q.correctAnswers)) {
                        correctAnswer = q.correctAnswers.map(idx => q.options?.[idx]).filter(Boolean);
                    }

                    if ((q.type === 'true_false' || q.type === 'yes_no') && typeof correctAnswer !== 'string') {
                        correctAnswer = correctAnswer ? 'true' : 'false';
                    }

                    // Enhanced options object to preserve specific data for frontend display
                    const enhancedOptions = {
                        originalType: q.type,
                        choices: Array.isArray(q.options) ? q.options : [],
                        pairs: q.pairs,
                        items: q.items,
                        statement: q.statement,
                        rows: q.rows,
                        columns: q.columns,
                        expectedRating: q.expectedRating,
                        tolerance: q.tolerance,
                        sentence: q.sentence,
                        correctItems: q.correctItems,
                        useRandomPool: q.useRandomPool,
                        rubric: q.rubric
                    };

                    return {
                        type: questionType,
                        content: q.content,
                        points: parseInt(q.points) || 1,
                        options: enhancedOptions,
                        correctAnswer: correctAnswer !== undefined && correctAnswer !== null ? correctAnswer : '',
                        order: idx
                    };
                })
            };

            console.log('📤 Submitting quiz data:', quizData);
            const result = await quizService.create(quizData);
            console.log('✅ Quiz created:', result);

            // Show success message and redirect to instructor dashboard
            alert(`✅ Quiz "${quiz.title}" created successfully!\n\n${quiz.requireSEB ? '⚠️ This quiz requires SEB. Students will download their personalized SEB file when they start the quiz.' : 'Students can now take this quiz from their course page.'}`);
            router.push('/instructor');
        } catch (err) {
            console.error('❌ Failed to create quiz:', err);
            console.error('Error details:', err.response?.data);
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
                                <FormControl fullWidth required>
                                    <InputLabel>Course</InputLabel>
                                    <Select
                                        value={courseId}
                                        label="Course"
                                        onChange={(e) => setCourseId(e.target.value)}
                                        disabled={loadingCourses}
                                    >
                                        {courses.map((course) => (
                                            <MenuItem key={course.id} value={course.id}>
                                                {course.title}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {!courseId && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                        Please select a course for this exam
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Exam Title"
                                    value={quiz.title}
                                    onChange={(e) => handleQuizChange('title', e.target.value)}
                                    placeholder="e.g., Midterm Exam"
                                    required
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
                                    {q.options?.map((opt, i) => (
                                        <Typography key={i} variant="body2" sx={{
                                            color: i === q.correctAnswer ? 'success.main' : 'text.primary',
                                            fontWeight: i === q.correctAnswer ? 'bold' : 'normal',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            {String.fromCharCode(65 + i)}. {opt}
                                            {i === q.correctAnswer && <span style={{ fontSize: '0.8em' }}>(Correct)</span>}
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

                    {/* Question Type Specific Editor */}
                    <QuestionEditor
                        questionType={newQuestion.type}
                        questionData={newQuestion.data}
                        onChange={(data) => handleNewQuestionChange('data', data)}
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleAddQuestion} variant="contained">Add Question</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
