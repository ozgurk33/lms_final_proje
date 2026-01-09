'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Radio,
    RadioGroup,
    FormControlLabel,
    Checkbox,
    FormGroup,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Rating,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { QUESTION_TYPES } from '@/utils/questionTypes';

/**
 * QuestionAnswer Component
 * Student-facing answer input for quiz taking
 * Mirrors QuestionEditor structure for consistency
 */
export default function QuestionAnswer({ question, value, onChange }) {
    // Get original type from options if available
    const originalType = question.options?.originalType || question.type;

    // Normalize type for comparison
    const normalizedType = originalType?.toLowerCase().replace(/_/g, '_');

    const renderAnswerInput = () => {
        switch (normalizedType) {
            // 1. MULTIPLE CHOICE - Single selection
            case QUESTION_TYPES.MULTIPLE_CHOICE:
            case 'multiple_choice':
                const choices = question.options?.choices || [];
                return (
                    <Box>
                        <RadioGroup
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                        >
                            {choices.map((option, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    value={option}
                                    control={<Radio />}
                                    label={`${String.fromCharCode(65 + idx)}. ${option}`}
                                    sx={{ mb: 1 }}
                                />
                            ))}
                        </RadioGroup>
                    </Box>
                );

            // 2. MULTIPLE SELECT - Multiple selection
            case QUESTION_TYPES.MULTIPLE_SELECT:
            case 'multiple_select':
                const selectOptions = question.options?.choices || [];
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <Box>
                        <FormGroup>
                            {selectOptions.map((option, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={selectedValues.includes(option)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    onChange([...selectedValues, option]);
                                                } else {
                                                    onChange(selectedValues.filter(v => v !== option));
                                                }
                                            }}
                                        />
                                    }
                                    label={`${idx + 1}. ${option}`}
                                    sx={{ mb: 1 }}
                                />
                            ))}
                        </FormGroup>
                        <Typography variant="caption" color="text.secondary">
                            Select all that apply
                        </Typography>
                    </Box>
                );

            // 3. TRUE/FALSE
            case QUESTION_TYPES.TRUE_FALSE:
            case 'true_false':
                return (
                    <RadioGroup
                        value={value === '' ? '' : String(value)}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        <FormControlLabel value="true" control={<Radio />} label="True" />
                        <FormControlLabel value="false" control={<Radio />} label="False" />
                    </RadioGroup>
                );

            // 4. SHORT ANSWER
            case QUESTION_TYPES.SHORT_ANSWER:
            case 'short_answer':
                return (
                    <TextField
                        fullWidth
                        placeholder="Enter your short answer..."
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );

            // 5. ESSAY
            case QUESTION_TYPES.ESSAY:
            case 'essay':
            case 'long_answer':
                return (
                    <TextField
                        fullWidth
                        multiline
                        rows={8}
                        placeholder="Write your detailed answer here..."
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );

            // 6. NUMERICAL
            case QUESTION_TYPES.NUMERICAL:
            case 'numerical':
                return (
                    <TextField
                        type="number"
                        placeholder="Enter a number"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                );

            // 7. MATCHING
            case QUESTION_TYPES.MATCHING:
            case 'matching':
                const pairs = question.options?.pairs || [];
                const leftItems = pairs.map(p => p.left);
                const rightItems = pairs.map(p => p.right);
                const matchingAnswers = typeof value === 'object' ? value : {};

                return (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Match items from left to right:
                        </Typography>
                        {leftItems.map((leftItem, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                <Paper sx={{ p: 1.5, minWidth: 150, bgcolor: 'action.hover' }}>
                                    <Typography>{leftItem}</Typography>
                                </Paper>
                                <Typography>→</Typography>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <Select
                                        value={matchingAnswers[idx] || ''}
                                        onChange={(e) => {
                                            onChange({ ...matchingAnswers, [idx]: e.target.value });
                                        }}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select...</MenuItem>
                                        {rightItems.map((rightItem, ridx) => (
                                            <MenuItem key={ridx} value={rightItem}>{rightItem}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        ))}
                    </Box>
                );

            // 8. FILL IN THE BLANK
            case QUESTION_TYPES.FILL_BLANK:
            case 'fill_blank':
            case 'fill_in_blank':
                const sentence = question.options?.sentence || question.content;
                return (
                    <Box>
                        {sentence && sentence.includes('_____') && (
                            <Typography variant="body1" sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                {sentence}
                            </Typography>
                        )}
                        <TextField
                            fullWidth
                            placeholder="Fill in the blank..."
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    </Box>
                );

            // 9. ORDERING
            case QUESTION_TYPES.ORDERING:
            case 'ordering':
                const items = question.options?.items || [];
                const orderAnswers = typeof value === 'object' ? value : {};

                return (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Put items in correct order (enter 1, 2, 3...):
                        </Typography>
                        {items.map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                <TextField
                                    type="number"
                                    size="small"
                                    sx={{ width: 80 }}
                                    placeholder="#"
                                    value={orderAnswers[idx] || ''}
                                    onChange={(e) => {
                                        onChange({ ...orderAnswers, [idx]: parseInt(e.target.value) || '' });
                                    }}
                                    inputProps={{ min: 1, max: items.length }}
                                />
                                <Paper sx={{ p: 1.5, flex: 1, bgcolor: 'action.hover' }}>
                                    <Typography>{item}</Typography>
                                </Paper>
                            </Box>
                        ))}
                    </Box>
                );

            // 10. DROPDOWN
            case QUESTION_TYPES.DROPDOWN:
            case 'dropdown':
                const dropdownOptions = question.options?.choices || [];
                return (
                    <FormControl fullWidth>
                        <InputLabel>Select Answer</InputLabel>
                        <Select
                            value={value || ''}
                            label="Select Answer"
                            onChange={(e) => onChange(e.target.value)}
                        >
                            {dropdownOptions.map((option, idx) => (
                                <MenuItem key={idx} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );

            // 11. YES/NO
            case QUESTION_TYPES.YES_NO:
            case 'yes_no':
                return (
                    <RadioGroup
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio />} label="No" />
                    </RadioGroup>
                );

            // 12. RATING SCALE
            case QUESTION_TYPES.RATING_SCALE:
            case 'rating_scale':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Rating
                            value={parseInt(value) || 0}
                            onChange={(e, newValue) => onChange(newValue)}
                            size="large"
                        />
                        <Typography>({value || 0}/5)</Typography>
                    </Box>
                );

            // 13. LIKERT SCALE
            case QUESTION_TYPES.LIKERT_SCALE:
            case 'likert_scale':
                const likertOptions = [
                    'Strongly Agree',
                    'Agree',
                    'Neutral',
                    'Disagree',
                    'Strongly Disagree'
                ];
                return (
                    <Box>
                        {question.options?.statement && (
                            <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                                "{question.options.statement}"
                            </Typography>
                        )}
                        <RadioGroup
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                        >
                            {likertOptions.map((option, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    value={option}
                                    control={<Radio />}
                                    label={option}
                                />
                            ))}
                        </RadioGroup>
                    </Box>
                );

            // 14. CHECKLIST
            case QUESTION_TYPES.CHECKLIST:
            case 'checklist':
                const checklistItems = question.options?.items || [];
                const checkedItems = Array.isArray(value) ? value : [];
                return (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Check all items that apply:
                        </Typography>
                        <FormGroup>
                            {checklistItems.map((item, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={checkedItems.includes(idx)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    onChange([...checkedItems, idx]);
                                                } else {
                                                    onChange(checkedItems.filter(v => v !== idx));
                                                }
                                            }}
                                        />
                                    }
                                    label={item}
                                />
                            ))}
                        </FormGroup>
                    </Box>
                );

            // 15. GRID/MATRIX
            case QUESTION_TYPES.GRID:
            case 'grid':
                const rowLabels = (question.options?.rows || '').split(',').map(s => s.trim()).filter(Boolean);
                const colLabels = (question.options?.columns || '').split(',').map(s => s.trim()).filter(Boolean);
                const gridAnswers = typeof value === 'object' ? value : {};

                if (rowLabels.length === 0 || colLabels.length === 0) {
                    return <Typography color="text.secondary">Grid question not configured properly</Typography>;
                }

                return (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell></TableCell>
                                    {colLabels.map((col, idx) => (
                                        <TableCell key={idx} align="center">{col}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rowLabels.map((row, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                        <TableCell>{row}</TableCell>
                                        {colLabels.map((col, colIdx) => (
                                            <TableCell key={colIdx} align="center">
                                                <Radio
                                                    checked={gridAnswers[rowIdx] === colIdx}
                                                    onChange={() => {
                                                        onChange({ ...gridAnswers, [rowIdx]: colIdx });
                                                    }}
                                                    size="small"
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                );

            // Fallback for unknown types
            default:
                return (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Enter your answer..."
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            {renderAnswerInput()}
        </Box>
    );
}
