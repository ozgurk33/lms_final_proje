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
    Autocomplete,
    Chip,
    Alert,
    Grid
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { quizService } from '@/services/courseService';
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, QUESTION_TYPE_DESCRIPTIONS } from '@/utils/questionTypes';
import QuestionEditor from '@/components/quiz/QuestionEditor';

export default function EditQuestionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const questionId = searchParams.get('id');

    const [question, setQuestion] = useState({
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        content: '',
        points: 10,
        category: '',
        tags: [],
        data: {
            options: ['', '', '', ''],
            correctAnswer: null
        }
    });

    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadCategories();
        loadTags();
        if (questionId) {
            loadQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionId]);

    const loadQuestion = async () => {
        try {
            setLoading(true);
            const response = await quizService.getQuestionBank({ id: questionId });
            const q = response.data?.find(item => item.id === questionId) || response.questions?.[0];
            if (q) {
                setQuestion(q);
            }
        } catch (error) {
            console.error('Failed to load question:', error);
            setError('Failed to load question');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await quizService.getCategories();
            setCategories(response.data || response.categories || ['General', 'Math', 'Science', 'Programming']);
        } catch (error) {
            console.error('Failed to load categories:', error);
            setCategories(['General', 'Math', 'Science', 'Programming']);
        }
    };

    const loadTags = async () => {
        try {
            const response = await quizService.getTags();
            setAllTags(response.data || response.tags || ['easy', 'medium', 'hard', 'review', 'important']);
        } catch (error) {
            console.error('Failed to load tags:', error);
            setAllTags(['easy', 'medium', 'hard', 'review', 'important']);
        }
    };

    const handleChange = (field, value) => {
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
            setQuestion({ ...question, type: value, data: defaultData });
        } else {
            setQuestion({ ...question, [field]: value });
        }
    };

    const handleSave = async () => {
        try {
            setError('');
            setSaving(true);

            if (!question.content || question.content.trim() === '') {
                setError('Please enter question text');
                setSaving(false);
                return;
            }

            // Type-specific validation
            if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
                const options = question.data?.options || [];
                const correctAnswer = question.data?.correctAnswer;

                if (options.filter(o => o && o.trim()).length < 2) {
                    setError('Please provide at least 2 options');
                    setSaving(false);
                    return;
                }
                if (correctAnswer === undefined || correctAnswer === null) {
                    setError('Please select the correct answer');
                    setSaving(false);
                    return;
                }
            }

            const questionData = {
                ...question,
                ...question.data // Merge data from QuestionEditor
            };

            if (questionId) {
                await quizService.updateQuestion(questionId, questionData);
                alert('Question updated successfully!');
            } else {
                await quizService.createQuestion(questionData);
                alert('Question created successfully!');
            }

            router.push('/instructor/question-bank');
        } catch (err) {
            console.error('Failed to save question:', err);
            setError(err.response?.data?.error || 'Failed to save question');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.push('/instructor/question-bank')}
                    sx={{ mb: 2 }}
                >
                    Back to Question Bank
                </Button>

                <Typography variant="h4" gutterBottom fontWeight="bold">
                    {questionId ? 'Edit Question' : 'Create New Question'}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Card sx={{ mb: 4, p: 2 }}>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Question Type</InputLabel>
                                    <Select
                                        value={question.type}
                                        label="Question Type"
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                                            <MenuItem key={key} value={key}>{label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    {QUESTION_TYPE_DESCRIPTIONS[question.type]}
                                </Alert>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Question Text"
                                    value={question.content}
                                    onChange={(e) => handleChange('content', e.target.value)}
                                    placeholder="Enter your question here..."
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Points"
                                    value={question.points}
                                    onChange={(e) => handleChange('points', e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Autocomplete
                                    options={categories}
                                    value={question.category}
                                    onChange={(e, val) => handleChange('category', val)}
                                    freeSolo
                                    renderInput={(params) => (
                                        <TextField {...params} label="Category" placeholder="Select or type..." />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Autocomplete
                                    multiple
                                    options={allTags}
                                    value={question.tags || []}
                                    onChange={(e, val) => handleChange('tags', val)}
                                    freeSolo
                                    renderInput={(params) => (
                                        <TextField {...params} label="Tags" placeholder="Add tags..." />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                key={option}
                                                label={option}
                                                {...getTagProps({ index })}
                                                size="small"
                                            />
                                        ))
                                    }
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    Question Details
                                </Typography>
                                <QuestionEditor
                                    questionType={question.type}
                                    questionData={question.data}
                                    onChange={(data) => handleChange('data', data)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => router.push('/instructor/question-bank')}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                        {saving ? 'Saving...' : questionId ? 'Update Question' : 'Create Question'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}
