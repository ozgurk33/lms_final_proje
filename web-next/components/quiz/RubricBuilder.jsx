import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

/**
 * RubricBuilder Component
 * Creates rubric with multiple criteria and performance levels
 */
export default function RubricBuilder({ rubric, onChange }) {
    const [criteria, setCriteria] = useState(rubric?.criteria || [
        {
            name: 'Content Quality',
            weight: 40,
            levels: [
                { score: 10, label: 'Excellent', description: 'Outstanding work' },
                { score: 7, label: 'Good', description: 'Good quality' },
                { score: 4, label: 'Fair', description: 'Acceptable' },
                { score: 0, label: 'Poor', description: 'Needs improvement' }
            ]
        }
    ]);

    const handleCriteriaChange = (index, field, value) => {
        const updated = [...criteria];
        updated[index][field] = value;
        setCriteria(updated);
        onChange?.({ criteria: updated, totalPoints: calculateTotalPoints(updated) });
    };

    const handleLevelChange = (criteriaIndex, levelIndex, field, value) => {
        const updated = [...criteria];
        updated[criteriaIndex].levels[levelIndex][field] = value;
        setCriteria(updated);
        onChange?.({ criteria: updated, totalPoints: calculateTotalPoints(updated) });
    };

    const addCriteria = () => {
        const newCriteria = {
            name: 'New Criterion',
            weight: 20,
            levels: [
                { score: 10, label: 'Excellent', description: '' },
                { score: 7, label: 'Good', description: '' },
                { score: 4, label: 'Fair', description: '' },
                { score: 0, label: 'Poor', description: '' }
            ]
        };
        const updated = [...criteria, newCriteria];
        setCriteria(updated);
        onChange?.({ criteria: updated, totalPoints: calculateTotalPoints(updated) });
    };

    const removeCriteria = (index) => {
        const updated = criteria.filter((_, i) => i !== index);
        setCriteria(updated);
        onChange?.({ criteria: updated, totalPoints: calculateTotalPoints(updated) });
    };

    const calculateTotalPoints = (criteriaList) => {
        return criteriaList.reduce((sum, c) => sum + c.weight, 0);
    };

    const totalPoints = calculateTotalPoints(criteria);

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
                Create a rubric to evaluate essay questions. Each criterion has multiple performance levels.
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Rubric Criteria (Total: {totalPoints} points)
                </Typography>
                <Button startIcon={<Add />} variant="contained" onClick={addCriteria}>
                    Add Criterion
                </Button>
            </Box>

            {criteria.map((criterion, criteriaIndex) => (
                <Card key={criteriaIndex} sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                            <TextField
                                fullWidth
                                label="Criterion Name"
                                value={criterion.name}
                                onChange={(e) => handleCriteriaChange(criteriaIndex, 'name', e.target.value)}
                            />
                            <TextField
                                type="number"
                                label="Weight (points)"
                                value={criterion.weight}
                                onChange={(e) => handleCriteriaChange(criteriaIndex, 'weight', parseInt(e.target.value) || 0)}
                                sx={{ width: 150 }}
                            />
                            <IconButton color="error" onClick={() => removeCriteria(criteriaIndex)}>
                                <Delete />
                            </IconButton>
                        </Box>

                        <Typography variant="subtitle2" gutterBottom>
                            Performance Levels
                        </Typography>

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
                                                value={level.label}
                                                onChange={(e) => handleLevelChange(criteriaIndex, levelIndex, 'label', e.target.value)}
                                                sx={{ width: 120 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={level.score}
                                                onChange={(e) => handleLevelChange(criteriaIndex, levelIndex, 'score', parseInt(e.target.value) || 0)}
                                                sx={{ width: 80 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                multiline
                                                rows={2}
                                                value={level.description}
                                                onChange={(e) => handleLevelChange(criteriaIndex, levelIndex, 'description', e.target.value)}
                                                placeholder="Describe this performance level..."
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}

            {criteria.length === 0 && (
                <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                            No criteria yet. Click "Add Criterion" to get started.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
