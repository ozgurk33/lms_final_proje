import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Alert,
    Chip,
    LinearProgress
} from '@mui/material';
import { Search, Warning } from '@mui/icons-material';

/**
 * PlagiarismChecker Component
 * Checks text similarity against other student answers
 */
export default function PlagiarismChecker({ text, courseId, quizId, onCheck }) {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);

    const calculateSimilarity = (text1, text2) => {
        // Simple Jaccard similarity (word-based)
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        return (intersection.size / union.size) * 100;
    };

    const handleCheck = async () => {
        setChecking(true);

        try {
            // TODO: Replace with real API call
            // const response = await plagiarismService.check({ text, courseId, quizId });

            // Mock implementation for now
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockMatches = [
                {
                    student: 'Student A',
                    similarity: 85,
                    excerpt: 'Lorem ipsum dolor sit amet...'
                },
                {
                    student: 'Student B',
                    similarity: 45,
                    excerpt: 'consectetur adipiscing elit...'
                }
            ].filter(m => m.similarity > 40);

            const mockResult = {
                maxSimilarity: mockMatches.length > 0 ? Math.max(...mockMatches.map(m => m.similarity)) : 0,
                matches: mockMatches,
                status: mockMatches.some(m => m.similarity > 70) ? 'high' :
                    mockMatches.some(m => m.similarity > 40) ? 'medium' : 'low'
            };

            setResult(mockResult);
            onCheck?.(mockResult);
        } catch (error) {
            console.error('Plagiarism check failed:', error);
        } finally {
            setChecking(false);
        }
    };

    const getSeverityColor = (similarity) => {
        if (similarity >= 70) return 'error';
        if (similarity >= 40) return 'warning';
        return 'success';
    };

    const getStatusColor = (status) => {
        if (status === 'high') return 'error';
        if (status === 'medium') return 'warning';
        return 'success';
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
                Check this answer for similarities with other student submissions in this course.
            </Alert>

            <Button
                variant="contained"
                startIcon={checking ? <CircularProgress size={20} /> : <Search />}
                onClick={handleCheck}
                disabled={checking || !text}
                fullWidth
                sx={{ mb: 3 }}
            >
                {checking ? 'Checking for Plagiarism...' : 'Check Plagiarism'}
            </Button>

            {result && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Plagiarism Report
                            </Typography>
                            <Chip
                                label={result.status.toUpperCase()}
                                color={getStatusColor(result.status)}
                                icon={result.status === 'high' ? <Warning /> : undefined}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Maximum Similarity Detected
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={result.maxSimilarity}
                                        color={getSeverityColor(result.maxSimilarity)}
                                        sx={{ height: 10, borderRadius: 1 }}
                                    />
                                </Box>
                                <Typography variant="h6" color={`${getSeverityColor(result.maxSimilarity)}.main`}>
                                    {result.maxSimilarity.toFixed(1)}%
                                </Typography>
                            </Box>
                        </Box>

                        {result.matches.length > 0 ? (
                            <>
                                <Typography variant="subtitle2" gutterBottom>
                                    Similar Submissions ({result.matches.length})
                                </Typography>
                                <List>
                                    {result.matches.map((match, index) => (
                                        <ListItem key={index} divider sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body1">
                                                            {match.student}
                                                        </Typography>
                                                        <Chip
                                                            label={`${match.similarity.toFixed(1)}%`}
                                                            color={getSeverityColor(match.similarity)}
                                                            size="small"
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        "{match.excerpt}"
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        ) : (
                            <Alert severity="success">
                                No significant similarities found. This appears to be original work.
                            </Alert>
                        )}

                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                            Note: Similarity scores are calculated using text comparison algorithms.
                            High similarity may indicate plagiarism but could also result from common phrases or proper citations.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
