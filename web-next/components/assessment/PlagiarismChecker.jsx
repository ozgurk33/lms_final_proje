'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    LinearProgress,
    Alert,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import { Search, Warning, CheckCircle } from '@mui/icons-material';

/**
 * PlagiarismChecker Component
 * Checks similarity between student submissions
 * Uses simple text comparison (Levenshtein distance / Jaccard similarity)
 * For production, consider integrating with services like Turnitin API
 */
export default function PlagiarismChecker() {
    const [submissions, setSubmissions] = useState([
        { id: 1, student: 'Student A', text: 'The quick brown fox jumps over the lazy dog.' },
        { id: 2, student: 'Student B', text: 'A quick brown fox jumped over a lazy dog.' },
        { id: 3, student: 'Student C', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
    ]);
    const [results, setResults] = useState([]);
    const [checking, setChecking] = useState(false);
    const [threshold, setThreshold] = useState(70);

    // Simple Jaccard similarity calculation
    const calculateJaccardSimilarity = (text1, text2) => {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);

        const set1 = new Set(words1);
        const set2 = new Set(words2);

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return (intersection.size / union.size) * 100;
    };

    const handleCheck = () => {
        setChecking(true);
        const comparisonResults = [];

        // Compare each submission with every other submission
        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const similarity = calculateJaccardSimilarity(
                    submissions[i].text,
                    submissions[j].text
                );

                if (similarity >= threshold) {
                    comparisonResults.push({
                        student1: submissions[i].student,
                        student2: submissions[j].student,
                        similarity: similarity.toFixed(2),
                        flagged: similarity >= 80
                    });
                }
            }
        }

        setTimeout(() => {
            setResults(comparisonResults);
            setChecking(false);
        }, 1000);
    };

    const getSeverityColor = (similarity) => {
        if (similarity >= 90) return 'error';
        if (similarity >= 80) return 'warning';
        return 'info';
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Plagiarism Checker
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
                This tool compares student submissions to detect potential plagiarism.
                For production use, integrate with professional plagiarism detection services.
            </Alert>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                        <TextField
                            type="number"
                            label="Similarity Threshold (%)"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value) || 70)}
                            sx={{ width: 200 }}
                            inputProps={{ min: 0, max: 100 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={handleCheck}
                            disabled={checking || submissions.length < 2}
                        >
                            Check for Plagiarism
                        </Button>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                        Submissions to check: {submissions.length}
                    </Typography>
                </CardContent>
            </Card>

            {checking && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Analyzing submissions...
                    </Typography>
                    <LinearProgress />
                </Box>
            )}

            {!checking && results.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Results ({results.length} potential matches found)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <List>
                            {results.map((result, index) => (
                                <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                                        <Typography variant="subtitle1">
                                            {result.student1} ↔ {result.student2}
                                        </Typography>
                                        <Chip
                                            label={`${result.similarity}% similar`}
                                            color={getSeverityColor(parseFloat(result.similarity))}
                                            size="small"
                                            icon={result.flagged ? <Warning /> : <CheckCircle />}
                                        />
                                    </Box>
                                    {result.flagged && (
                                        <Alert severity="warning" sx={{ width: '100%', mt: 1 }}>
                                            High similarity detected! Manual review recommended.
                                        </Alert>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {!checking && results.length === 0 && submissions.length >= 2 && (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                            No results yet. Click &quot;Check for Plagiarism&quot; to start analysis.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
