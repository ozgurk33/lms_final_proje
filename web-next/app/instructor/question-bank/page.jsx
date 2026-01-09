'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Chip,
    Autocomplete,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Alert
} from '@mui/material';
import { Add, Delete, Edit, FilterList } from '@mui/icons-material';
import { quizService } from '@/services/courseService';
import { QUESTION_TYPE_LABELS } from '@/utils/questionTypes';

export default function QuestionBankPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filters
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        loadQuestions();
        loadCategories();
        loadTags();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await quizService.getQuestionBank();
            setQuestions(response.data || response.questions || []);
        } catch (error) {
            console.error('Failed to load questions:', error);
            setError('Failed to load questions. Please try again.');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await quizService.getCategories();
            setCategories(response.data || response.categories || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
            setCategories(['General', 'Math', 'Science', 'Programming', 'History']);
        }
    };

    const loadTags = async () => {
        try {
            const response = await quizService.getTags();
            setAllTags(response.data || response.tags || []);
        } catch (error) {
            console.error('Failed to load tags:', error);
            setAllTags(['easy', 'medium', 'hard', 'review', 'important']);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesCategory = !selectedCategory || q.category === selectedCategory;
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => q.tags.includes(tag));
        const matchesSearch = !searchTerm || q.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesTags && matchesSearch;
    });

    const handleAddCategory = async () => {
        if (newCategory && !categories.includes(newCategory)) {
            try {
                await quizService.createCategory(newCategory);
                setCategories([...categories, newCategory]);
                setNewCategory('');
                setOpenDialog(false);
            } catch (error) {
                console.error('Failed to create category:', error);
                alert('Failed to create category');
            }
        }
    };

    const handleEditQuestion = (questionId) => {
        router.push(`/instructor/edit-question?id=${questionId}`);
    };

    const handleDeleteQuestion = async (id) => {
        if (confirm('Delete this question?')) {
            try {
                await quizService.deleteQuestion(id);
                setQuestions(questions.filter(q => q.id !== id));
            } catch (error) {
                console.error('Failed to delete question:', error);
                alert('Failed to delete question');
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Question Bank</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setOpenDialog(true)}
                        >
                            Add Category
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => router.push('/instructor/edit-question')}
                        >
                            Create Question
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Search Questions"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Enter keywords..."
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={categories}
                                    value={selectedCategory}
                                    onChange={(e, val) => setSelectedCategory(val)}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Category" placeholder="All Categories" />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    multiple
                                    options={allTags}
                                    value={selectedTags}
                                    onChange={(e, val) => setSelectedTags(val)}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Tags" placeholder="Select tags..." />
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
                        </Grid>
                    </CardContent>
                </Card>

                {/* Results */}
                <Typography variant="h6" gutterBottom>
                    {filteredQuestions.length} Question{filteredQuestions.length !== 1 ? 's' : ''} Found
                </Typography>

                <List>
                    {filteredQuestions.map((question) => (
                        <Card key={question.id} sx={{ mb: 2 }}>
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Typography variant="h6">{question.content}</Typography>
                                            <Chip label={QUESTION_TYPE_LABELS[question.type] || question.type} size="small" color="primary" />
                                            <Chip label={question.category} size="small" variant="outlined" />
                                            {question.tags.map(tag => (
                                                <Chip key={tag} label={tag} size="small" />
                                            ))}
                                        </Box>
                                    }
                                    secondary={`${question.points} points`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        sx={{ mr: 1 }}
                                        onClick={() => handleEditQuestion(question.id)}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton edge="end" onClick={() => handleDeleteQuestion(question.id)}>
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        </Card>
                    ))}
                </List>

                {filteredQuestions.length === 0 && (
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                No questions found. Try adjusting your filters or create a new question.
                            </Typography>
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Add Category Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Category Name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddCategory} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
