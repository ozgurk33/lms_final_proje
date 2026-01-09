import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Radio,
    RadioGroup,
    FormControlLabel,
    Button,
    Alert,
    Chip
} from '@mui/material';
import { Save } from '@mui/icons-material';

/**
 * RubricGrader Component
 * Uses rubric to grade essay answers
 */
export default function RubricGrader({ rubric, studentAnswer, onGrade }) {
    const [selectedLevels, setSelectedLevels] = useState({});
    const [feedback, setFeedback] = useState('');

    const handleLevelSelect = (criteriaIndex, levelScore) => {
        setSelectedLevels({
            ...selectedLevels,
            [criteriaIndex]: levelScore
        });
    };

    const calculateTotalScore = () => {
        if (!rubric?.criteria) return 0;

        let totalScore = 0;
        rubric.criteria.forEach((criterion, index) => {
            const selectedScore = selectedLevels[index];
            if (selectedScore !== undefined) {
                // Calculate proportional score based on weight
                const maxLevel = Math.max(...criterion.levels.map(l => l.score));
                const proportion = selectedScore / (maxLevel || 1);
                totalScore += proportion * criterion.weight;
            }
        });

        return Math.round(totalScore * 10) / 10;
    };

    const handleSubmitGrade = () => {
        const totalScore = calculateTotalScore();
        const gradeData = {
            score: totalScore,
            maxScore: rubric.totalPoints || 100,
            rubricScores: selectedLevels,
            feedback
        };
        onGrade?.(gradeData);
    };

    const allCriteriaGraded = rubric?.criteria?.every((_, index) =>
        selectedLevels[index] !== undefined
    );

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
                Grade the student's answer using the rubric criteria below.
            </Alert>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Student Answer:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        {studentAnswer || 'No answer provided'}
                    </Typography>
                </CardContent>
            </Card>

            {rubric?.criteria?.map((criterion, criteriaIndex) => (
                <Card key={criteriaIndex} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                {criterion.name}
                            </Typography>
                            <Chip
                                label={`${criterion.weight} points`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell width="50px"></TableCell>
                                    <TableCell><strong>Level</strong></TableCell>
                                    <TableCell><strong>Score</strong></TableCell>
                                    <TableCell><strong>Description</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {criterion.levels.map((level, levelIndex) => (
                                    <TableRow
                                        key={levelIndex}
                                        sx={{
                                            bgcolor: selectedLevels[criteriaIndex] === level.score ? 'action.selected' : 'inherit',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                        onClick={() => handleLevelSelect(criteriaIndex, level.score)}
                                    >
                                        <TableCell>
                                            <Radio
                                                checked={selectedLevels[criteriaIndex] === level.score}
                                                onChange={() => handleLevelSelect(criteriaIndex, level.score)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <strong>{level.label}</strong>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={level.score} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {level.description}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Final Grade: {calculateTotalScore()} / {rubric?.totalPoints || 100}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSubmitGrade}
                            disabled={!allCriteriaGraded}
                            fullWidth
                        >
                            {allCriteriaGraded ? 'Submit Grade' : 'Please grade all criteria'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
