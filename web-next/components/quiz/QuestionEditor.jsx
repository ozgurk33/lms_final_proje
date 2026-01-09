'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    Checkbox,
    FormGroup,
    Select,
    MenuItem,
    IconButton,
    Slider,
    Rating,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { QUESTION_TYPES } from '@/utils/questionTypes';
import RubricBuilder from './RubricBuilder';

/**
 * QuestionEditor Component
 * Renders appropriate input fields based on question type
 */
export default function QuestionEditor({ questionType, questionData, onChange }) {
    const [data, setData] = useState(questionData || {});

    const updateData = (field, value) => {
        const updated = { ...data, [field]: value };
        setData(updated);
        onChange?.(updated);
    };

    const updateOption = (index, value) => {
        const options = [...(data.options || ['', '', '', ''])];
        options[index] = value;
        updateData('options', options);
    };

    const addOption = () => {
        const options = [...(data.options || []), ''];
        updateData('options', options);
    };

    const removeOption = (index) => {
        const options = (data.options || []).filter((_, i) => i !== index);
        updateData('options', options);
    };

    const renderEditor = () => {
        switch (questionType) {
            // 1. MULTIPLE CHOICE - Tek seçim, 4 şık
            case QUESTION_TYPES.MULTIPLE_CHOICE:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Options (4 choices)</Typography>
                        {[0, 1, 2, 3].map((i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <Radio
                                    checked={data.correctAnswer === i}
                                    onChange={() => updateData('correctAnswer', i)}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                    value={data.options?.[i] || ''}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                />
                            </Box>
                        ))}
                        <Typography variant="caption" color="text.secondary">
                            Select the radio button for the correct answer
                        </Typography>
                    </Box>
                );

            // 2. MULTIPLE SELECT - Çoklu seçim
            case QUESTION_TYPES.MULTIPLE_SELECT:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Options (select all correct)</Typography>
                        {(data.options || ['', '', '', '']).map((opt, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <Checkbox
                                    checked={data.correctAnswers?.includes(i)}
                                    onChange={(e) => {
                                        const current = data.correctAnswers || [];
                                        const updated = e.target.checked
                                            ? [...current, i]
                                            : current.filter(x => x !== i);
                                        updateData('correctAnswers', updated);
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                />
                                {i > 3 && (
                                    <IconButton size="small" onClick={() => removeOption(i)}>
                                        <Delete />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        <Button startIcon={<Add />} size="small" onClick={addOption}>
                            Add Option
                        </Button>
                    </Box>
                );

            // 3. TRUE/FALSE
            case QUESTION_TYPES.TRUE_FALSE:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Correct Answer</Typography>
                        <RadioGroup
                            value={data.correctAnswer || 'true'}
                            onChange={(e) => updateData('correctAnswer', e.target.value)}
                        >
                            <FormControlLabel value="true" control={<Radio />} label="True" />
                            <FormControlLabel value="false" control={<Radio />} label="False" />
                        </RadioGroup>
                    </Box>
                );

            // 4. SHORT ANSWER - Kısa text
            case QUESTION_TYPES.SHORT_ANSWER:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Expected Answer</Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter expected answer or keywords"
                            value={data.correctAnswer || ''}
                            onChange={(e) => updateData('correctAnswer', e.target.value)}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Student will type a short text response
                        </Typography>
                    </Box>
                );

            // 5. ESSAY - Uzun text with RUBRIC
            case QUESTION_TYPES.ESSAY:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                            Grading Rubric
                        </Typography>
                        <RubricBuilder
                            rubric={data.rubric}
                            onChange={(rubric) => updateData('rubric', rubric)}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                            Manual grading required - Student will write detailed answer
                        </Typography>
                    </Box>
                );

            // 6. NUMERICAL - Sayı
            case QUESTION_TYPES.NUMERICAL:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Correct Answer</Typography>
                        <TextField
                            type="number"
                            placeholder="Enter correct number"
                            value={data.correctAnswer || ''}
                            onChange={(e) => updateData('correctAnswer', e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            type="number"
                            label="Tolerance (±)"
                            placeholder="0"
                            value={data.tolerance || 0}
                            onChange={(e) => updateData('tolerance', e.target.value)}
                            size="small"
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                            Answer will be accepted within ±tolerance range
                        </Typography>
                    </Box>
                );

            // 7. MATCHING - Eşleştirme
            case QUESTION_TYPES.MATCHING:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Matching Pairs</Typography>
                        {(data.pairs || [{ left: '', right: '' }]).map((pair, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Left item"
                                    value={pair.left}
                                    onChange={(e) => {
                                        const pairs = [...(data.pairs || [])];
                                        pairs[i].left = e.target.value;
                                        updateData('pairs', pairs);
                                    }}
                                />
                                <Typography sx={{ alignSelf: 'center' }}>↔</Typography>
                                <TextField
                                    size="small"
                                    placeholder="Right match"
                                    value={pair.right}
                                    onChange={(e) => {
                                        const pairs = [...(data.pairs || [])];
                                        pairs[i].right = e.target.value;
                                        updateData('pairs', pairs);
                                    }}
                                />
                            </Box>
                        ))}
                        <Button
                            startIcon={<Add />}
                            size="small"
                            onClick={() => {
                                const pairs = [...(data.pairs || []), { left: '', right: '' }];
                                updateData('pairs', pairs);
                            }}
                        >
                            Add Pair
                        </Button>
                    </Box>
                );

            // 8. FILL IN THE BLANK - Boşluk doldurma
            case QUESTION_TYPES.FILL_BLANK:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Sentence (use _____ for blank)
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="The capital of France is _____"
                            value={data.sentence || ''}
                            onChange={(e) => updateData('sentence', e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Correct Answer"
                            placeholder="Paris"
                            value={data.correctAnswer || ''}
                            onChange={(e) => updateData('correctAnswer', e.target.value)}
                        />
                    </Box>
                );

            // 9. ORDERING - Sıralama
            case QUESTION_TYPES.ORDERING:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Items to Order (Correct sequence)</Typography>
                        {(data.items || ['']).map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <Typography sx={{ minWidth: 30 }}>{i + 1}.</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Item ${i + 1}`}
                                    value={item}
                                    onChange={(e) => {
                                        const items = [...(data.items || [])];
                                        items[i] = e.target.value;
                                        updateData('items', items);
                                    }}
                                />
                            </Box>
                        ))}
                        <Button
                            startIcon={<Add />}
                            size="small"
                            onClick={() => {
                                const items = [...(data.items || []), ''];
                                updateData('items', items);
                            }}
                        >
                            Add Item
                        </Button>
                    </Box>
                );

            // 10. DROPDOWN - Açılır liste
            case QUESTION_TYPES.DROPDOWN:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Dropdown Options</Typography>
                        {(data.options || ['', '', '']).map((opt, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <Radio
                                    checked={data.correctAnswer === i}
                                    onChange={() => updateData('correctAnswer', i)}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                />
                            </Box>
                        ))}
                        <Button startIcon={<Add />} size="small" onClick={addOption}>
                            Add Option
                        </Button>
                    </Box>
                );

            // 11. YES/NO
            case QUESTION_TYPES.YES_NO:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Correct Answer</Typography>
                        <RadioGroup
                            value={data.correctAnswer || 'yes'}
                            onChange={(e) => updateData('correctAnswer', e.target.value)}
                        >
                            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                            <FormControlLabel value="no" control={<Radio />} label="No" />
                        </RadioGroup>
                    </Box>
                );

            // 12. RATING SCALE - 1-5 derecelendirme
            case QUESTION_TYPES.RATING_SCALE:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Expected Rating</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Rating
                                value={data.expectedRating || 5}
                                onChange={(e, val) => updateData('expectedRating', val)}
                            />
                            <Typography>({data.expectedRating || 5}/5)</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            This is for feedback - no wrong answer
                        </Typography>
                    </Box>
                );

            // 13. LIKERT SCALE
            case QUESTION_TYPES.LIKERT_SCALE:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Statement</Typography>
                        <TextField
                            fullWidth
                            placeholder="e.g., I found this course helpful"
                            value={data.statement || ''}
                            onChange={(e) => updateData('statement', e.target.value)}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Student will choose: Strongly Agree / Agree / Neutral / Disagree / Strongly Disagree
                        </Typography>
                    </Box>
                );

            // 14. CHECKLIST
            case QUESTION_TYPES.CHECKLIST:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Checklist Items</Typography>
                        {(data.items || ['']).map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                <Checkbox
                                    checked={data.correctItems?.includes(i)}
                                    onChange={(e) => {
                                        const current = data.correctItems || [];
                                        const updated = e.target.checked
                                            ? [...current, i]
                                            : current.filter(x => x !== i);
                                        updateData('correctItems', updated);
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Item ${i + 1}`}
                                    value={item}
                                    onChange={(e) => {
                                        const items = [...(data.items || [])];
                                        items[i] = e.target.value;
                                        updateData('items', items);
                                    }}
                                />
                            </Box>
                        ))}
                        <Button
                            startIcon={<Add />}
                            size="small"
                            onClick={() => {
                                const items = [...(data.items || []), ''];
                                updateData('items', items);
                            }}
                        >
                            Add Item
                        </Button>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Check the boxes for items that should be selected
                        </Typography>
                    </Box>
                );

            // 15. GRID/MATRIX
            case QUESTION_TYPES.GRID:
                return (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Grid Question</Typography>
                        <TextField
                            fullWidth
                            label="Row Labels (comma separated)"
                            placeholder="Item 1, Item 2, Item 3"
                            value={data.rows || ''}
                            onChange={(e) => updateData('rows', e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Column Labels (comma separated)"
                            placeholder="Excellent, Good, Fair, Poor"
                            value={data.columns || ''}
                            onChange={(e) => updateData('columns', e.target.value)}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Creates a table where students select one option per row
                        </Typography>
                    </Box>
                );

            default:
                return (
                    <Typography color="text.secondary">
                        Select a question type to configure
                    </Typography>
                );
        }
    };

    return (
        <Box>
            {renderEditor()}
        </Box>
    );
}
