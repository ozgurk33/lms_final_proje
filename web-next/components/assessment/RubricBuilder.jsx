'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Paper,
    Chip,
    Divider
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';

/**
 * RubricBuilder Component
 * Creates rubrics for open-ended question assessment
 * Allows defining criteria and performance levels
 */
export default function RubricBuilder({ rubric, onChange }) {
    const [localRubric, setLocalRubric] = useState(rubric || {
        title: '',
        description: '',
        criteria: [
            {
                name: 'Content Quality',
                levels: [
                    { name: 'Excellent', score: 10, description: 'Exceeds expectations' },
                    { name: 'Good', score: 7, description: 'Meets expectations' },
                    { name: 'Fair', score: 5, description: 'Partially meets' },
                    { name: 'Poor', score: 2, description: 'Does not meet' }
                ]
            }
        ]
    });

    const handleTitleChange = (value) => {
        const updated = { ...localRubric, title: value };
        setLocalRubric(updated);
        onChange?.(updated);
    };

    const handleDescriptionChange = (value) => {
        const updated = { ...localRubric, description: value };
        setLocalRubric(updated);
        onChange?.(updated);
    };

    const addCriterion = () => {
        const updated = {
            ...localRubric,
            criteria: [
                ...localRubric.criteria,
                {
                    name: 'New Criterion',
                    levels: [
                        { name: 'Excellent', score: 10, description: '' },
                        { name: 'Good', score: 7, description: '' },
                        { name: 'Fair', score: 5, description: '' },
                        { name: 'Poor', score: 2, description: '' }
                    ]
                }
            ]
        };
        setLocalRubric(updated);
        onChange?.(updated);
    };

    const removeCriterion = (index) => {
        const updated = {
            ...localRubric,
            criteria: localRubric.criteria.filter((_, i) => i !== index)
        };
        setLocalRubric(updated);
        onChange?.(updated);
    };

    const updateCriterion = (criterionIndex, field, value) => {
        const updated = { ...localRubric };
        updated.criteria[criterionIndex][field] = value;
        setLocalRubric(updated);
        onChange?.(updated);
    };

    const updateLevel = (criterionIndex, levelIndex, field, value) => {
        const updated = { ...localRubric };
        updated.criteria[criterionIndex].levels[levelIndex][field] = value;
        setLocalRubric(updated);
        onChange?.(updated);
    };

    const getTotalPossibleScore = () => {
        return localRubric.criteria.reduce((sum, criterion) => {
            const maxScore = Math.max(...criterion.levels.map(l => l.score || 0));
            return sum + maxScore;
        }, 0);
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Rubric Builder
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <TextField
                        fullWidth
                        label="Rubric Title"
                        value={localRubric.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Description"
                        value={localRubric.description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                            label={`Total Points: ${getTotalPossibleScore()}`}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                </CardContent>
            </Card>

            {localRubric.criteria.map((criterion, criterionIndex) => (
                <Card key={criterionIndex} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <TextField
                                label="Criterion Name"
                                value={criterion.name}
                                onChange={(e) => updateCriterion(criterionIndex, 'name', e.target.value)}
                                sx={{ flex: 1, mr: 2 }}
                            />
                            <IconButton
                                color="error"
                                onClick={() => removeCriterion(criterionIndex)}
                            >
                                <Delete />
                            </IconButton>
                        </Box>

                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Level</strong></TableCell>
                                        <TableCell><strong>Score</strong></TableCell>
                                        <TableCell><strong>Description</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {criterion.levels.map((level, levelIndex) => (
                                        <TableRow key={levelIndex}>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={level.name}
                                                    onChange={(e) => updateLevel(criterionIndex, levelIndex, 'name', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={level.score}
                                                    onChange={(e) => updateLevel(criterionIndex, levelIndex, 'score', parseInt(e.target.value) || 0)}
                                                    sx={{ width: '80px' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    multiline
                                                    value={level.description}
                                                    onChange={(e) => updateLevel(criterionIndex, levelIndex, 'description', e.target.value)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            ))}

            <Button
                startIcon={<Add />}
                variant="outlined"
                onClick={addCriterion}
                fullWidth
            >
                Add Criterion
            </Button>
        </Box>
    );
}
