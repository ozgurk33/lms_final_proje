'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    Button
} from '@mui/material';
import { ArrowBack, Quiz as QuizIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { quizService } from '../../../services/courseService';

export default function QuizDetailPage() {
    const { t } = useTranslation();
    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        fetchQuizDetails();
    }, [id]);

    const fetchQuizDetails = async () => {
        try {
            setLoading(true);
            const quizData = await quizService.getById(id);
            setQuiz(quizData.quiz);

            // Fetch questions separately
            const questionsData = await quizService.getQuestions(id);
            setQuestions(questionsData.questions || []);
        } catch (error) {
            console.error('Failed to fetch quiz:', error);
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

    if (!quiz) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Quiz not found
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    sx={{ mb: 2 }}
                >
                    Back
                </Button>

                {/* Quiz Header */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <QuizIcon color="primary" sx={{ fontSize: 40 }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h4" gutterBottom>
                                    {quiz.title}
                                </Typography>
                                {quiz.description && (
                                    <Typography variant="body1" color="text.secondary">
                                        {quiz.description}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                            <Chip label={`${questions.length} Questions`} />
                            <Chip label={`${quiz.duration} minutes`} color="primary" />
                            <Chip label={`Passing: ${quiz.passingScore}%`} color="success" />
                        </Box>
                    </CardContent>
                </Card>

                {/* Questions List */}
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                    Questions
                </Typography>

                {questions.length === 0 ? (
                    <Alert severity="info">No questions added yet</Alert>
                ) : (
                    questions.map((question, idx) => {
                        // Determine the best display type
                        // 1. Check if enhanced options has 'originalType'
                        // 2. Fallback to question.type
                        const options = question.options || {};
                        const originalType = options.originalType?.toLowerCase() || question.type?.toLowerCase();

                        // Helper to get choices array safely
                        const getChoices = () => {
                            if (Array.isArray(options)) return options;
                            if (Array.isArray(options.choices)) return options.choices;
                            return [];
                        };

                        return (
                            <Card key={question.id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">
                                            Question {idx + 1}
                                        </Typography>
                                        <Chip
                                            label={originalType?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Typography variant="body1" paragraph fontWeight="medium">
                                        {question.content}
                                    </Typography>

                                    {/* RENDER BASED ON TYPE */}
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>

                                        {/* 1. Multiple Choice / Select / Dropdown / Checklist */}
                                        {['multiple_choice', 'multiple_select', 'dropdown', 'checklist'].includes(originalType) && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" gutterBottom>Options:</Typography>
                                                {getChoices().map((opt, i) => (
                                                    <Box key={i} sx={{
                                                        p: 1, mb: 0.5, borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: opt === question.correctAnswer ? 'success.main' : 'divider',
                                                        bgcolor: opt === question.correctAnswer ? 'success.light' : 'transparent'
                                                    }}>
                                                        <Typography variant="body2">
                                                            {i + 1}. {opt} {opt === question.correctAnswer && '✓'}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}

                                        {/* 2. True/False, Yes/No */}
                                        {['true_false', 'yes_no'].includes(originalType) && (
                                            <Typography variant="body2">
                                                Correct Answer: <strong>{question.correctAnswer}</strong>
                                            </Typography>
                                        )}

                                        {/* 3. Short Answer / Numerical / Fill Blank */}
                                        {['short_answer', 'numerical', 'fill_blank'].includes(originalType) && (
                                            <Box>
                                                {options.sentence && (
                                                    <Typography variant="body2" gutterBottom sx={{ fontStyle: 'italic' }}>
                                                        Template: {options.sentence}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2">
                                                    Expected Answer: <strong>{question.correctAnswer}</strong>
                                                </Typography>
                                                {options.tolerance && (
                                                    <Typography variant="caption" display="block">
                                                        Tolerance: ±{options.tolerance}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}

                                        {/* 4. Essay / Long Answer */}
                                        {['essay', 'long_answer'].includes(originalType) && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Students will write a detailed response.
                                                </Typography>
                                                {options.rubric && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="subtitle2">Rubric Criteria:</Typography>
                                                        {options.rubric.map((r, i) => (
                                                            <Box key={i} sx={{ ml: 2 }}>- {r.criterion} ({r.points} pts)</Box>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {/* 5. Matching */}
                                        {originalType === 'matching' && options.pairs && (
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>Matching Pairs:</Typography>
                                                {options.pairs.map((pair, i) => (
                                                    <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{pair.left}</Typography>
                                                        <Typography variant="body2">↔</Typography>
                                                        <Typography variant="body2">{pair.right}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}

                                        {/* 6. Ordering */}
                                        {originalType === 'ordering' && options.items && (
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>Correct Order:</Typography>
                                                {options.items.map((item, i) => (
                                                    <Box key={i} sx={{ ml: 2 }}>
                                                        <Typography variant="body2">{i + 1}. {item}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}

                                        {/* 7. Rating Scale */}
                                        {originalType === 'rating_scale' && (
                                            <Box>
                                                <Typography variant="body2">Max Rating: {options.expectedRating || 5}</Typography>
                                                <Typography variant="caption" color="text.secondary">Scale: 1 to {options.expectedRating || 5}</Typography>
                                            </Box>
                                        )}

                                        {/* 8. Likert Scale */}
                                        {originalType === 'likert_scale' && (
                                            <Box>
                                                <Typography variant="body2" fontStyle="italic">"{options.statement}"</Typography>
                                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                    Scale: Strongly Agree ... Strongly Disagree
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* 9. Grid */}
                                        {originalType === 'grid' && (
                                            <Box>
                                                <Typography variant="body2">Rows: {options.rows}</Typography>
                                                <Typography variant="body2">Columns: {options.columns}</Typography>
                                            </Box>
                                        )}

                                    </Box>

                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Points: {question.points}
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </Box>
        </Container>
    );
}
