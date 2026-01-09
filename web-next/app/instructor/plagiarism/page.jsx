'use client';

import { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Alert,
    LinearProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Paper
} from '@mui/material';
import {
    ContentPaste,
    CheckCircle,
    Warning,
    Error as ErrorIcon,
    Search
} from '@mui/icons-material';

export default function PlagiarismPage() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const checkPlagiarism = async () => {
        if (!text.trim()) {
            setError('Please enter text to check');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // TODO: Replace with actual API call
            const response = await fetch('http://localhost:3000/api/plagiarism/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error('Failed to check plagiarism');
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error('Plagiarism check error:', err);
            setError(err.message || 'Failed to check plagiarism. Using mock data for demo.');

            // Mock result for demo
            setResult({
                maxSimilarity: 35.7,
                status: 'low',
                matches: [
                    {
                        student: 'Student A',
                        similarity: 35.7,
                        excerpt: 'This is similar content that was found in another submission...'
                    },
                    {
                        student: 'Student B',
                        similarity: 28.3,
                        excerpt: 'Another piece of text with some overlap in vocabulary...'
                    }
                ],
                checkedAt: new Date()
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'high':
                return {
                    color: 'error',
                    icon: <ErrorIcon />,
                    text: 'High Similarity - Review Required',
                    bgColor: '#ffebee'
                };
            case 'medium':
                return {
                    color: 'warning',
                    icon: <Warning />,
                    text: 'Medium Similarity - Check Recommended',
                    bgColor: '#fff3e0'
                };
            default:
                return {
                    color: 'success',
                    icon: <CheckCircle />,
                    text: 'Low Similarity - Likely Original',
                    bgColor: '#e8f5e9'
                };
        }
    };

    const statusInfo = result ? getStatusInfo(result.status) : null;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    <ContentPaste sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Plagiarism Checker
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Check text similarity against other student submissions
                </Typography>
            </Box>

            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        label="Enter text to check"
                        placeholder="Paste the student's answer or essay here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {text.length} characters | {text.split(/\s+/).filter(w => w).length} words
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={loading ? null : <Search />}
                            onClick={checkPlagiarism}
                            disabled={loading || !text.trim()}
                        >
                            {loading ? 'Checking...' : 'Check Plagiarism'}
                        </Button>
                    </Box>

                    {loading && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Analyzing text and comparing with submissions...
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {result && statusInfo && (
                <Card>
                    <CardContent>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Plagiarism Report
                            </Typography>
                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: statusInfo.bgColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {statusInfo.icon}
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        {statusInfo.text}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`${result.maxSimilarity.toFixed(1)}% Similarity`}
                                    color={statusInfo.color}
                                    size="large"
                                />
                            </Paper>
                        </Box>

                        {result.matches && result.matches.length > 0 && (
                            <>
                                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                                    Similar Submissions ({result.matches.length})
                                </Typography>
                                <List>
                                    {result.matches.map((match, index) => (
                                        <Box key={index}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <Typography variant="subtitle2">
                                                                {match.student}
                                                            </Typography>
                                                            <Chip
                                                                label={`${match.similarity.toFixed(1)}%`}
                                                                size="small"
                                                                color={
                                                                    match.similarity >= 70 ? 'error' :
                                                                        match.similarity >= 40 ? 'warning' : 'default'
                                                                }
                                                                sx={{ ml: 2 }}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {match.excerpt}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                            {index < result.matches.length - 1 && <Divider />}
                                        </Box>
                                    ))}
                                </List>
                            </>
                        )}

                        {result.matches && result.matches.length === 0 && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                No significant similarities found with other submissions.
                            </Alert>
                        )}

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Checked at: {new Date(result.checkedAt).toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
}
