'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { School, CheckCircle, Visibility } from '@mui/icons-material';

// Predefined course templates
const COURSE_TEMPLATES = [
    {
        id: 'basic',
        title: 'Basic Course',
        description: 'A simple course structure with 4 modules',
        modules: [
            { title: 'Introduction', description: 'Course overview and objectives', order: 0, contents: [] },
            { title: 'Module 1', description: 'First main topic', order: 1, contents: [] },
            { title: 'Module 2', description: 'Second main topic', order: 2, contents: [] },
            { title: 'Conclusion', description: 'Summary and next steps', order: 3, contents: [] }
        ]
    },
    {
        id: 'programming',
        title: 'Programming Course',
        description: 'Structured for coding courses with theory and practice',
        modules: [
            { title: 'Setup & Environment', description: 'Installing tools and IDEs', order: 0, contents: [] },
            { title: 'Basic Concepts', description: 'Fundamental programming concepts', order: 1, contents: [] },
            { title: 'Hands-on Practice', description: 'Coding exercises and projects', order: 2, contents: [] },
            { title: 'Advanced Topics', description: 'Deep dive into complex concepts', order: 3, contents: [] },
            { title: 'Final Project', description: 'Capstone project', order: 4, contents: [] }
        ]
    },
    {
        id: 'language',
        title: 'Language Learning',
        description: 'Template for language courses',
        modules: [
            { title: 'Alphabet & Pronunciation', description: 'Basic sounds and letters', order: 0, contents: [] },
            { title: 'Vocabulary Builder', description: 'Essential words and phrases', order: 1, contents: [] },
            { title: 'Grammar Basics', description: 'Sentence structure and rules', order: 2, contents: [] },
            { title: 'Conversation Practice', description: 'Speaking and listening', order: 3, contents: [] },
            { title: 'Cultural Context', description: 'Understanding the culture', order: 4, contents: [] }
        ]
    },
    {
        id: 'business',
        title: 'Business Course',
        description: 'Professional business training structure',
        modules: [
            { title: 'Industry Overview', description: 'Market and landscape', order: 0, contents: [] },
            { title: 'Core Concepts', description: 'Fundamental business principles', order: 1, contents: [] },
            { title: 'Case Studies', description: 'Real-world examples', order: 2, contents: [] },
            { title: 'Practical Application', description: 'Apply what you learned', order: 3, contents: [] },
            { title: 'Assessment', description: 'Evaluate your knowledge', order: 4, contents: [] }
        ]
    },
    {
        id: 'science',
        title: 'Science Course',
        description: 'Laboratory and theory-based structure',
        modules: [
            { title: 'Scientific Method', description: 'Research methodology', order: 0, contents: [] },
            { title: 'Theory & Principles', description: 'Theoretical foundation', order: 1, contents: [] },
            { title: 'Laboratory Work', description: 'Experiments and observations', order: 2, contents: [] },
            { title: 'Data Analysis', description: 'Interpreting results', order: 3, contents: [] },
            { title: 'Research Project', description: 'Independent investigation', order: 4, contents: [] }
        ]
    },
    {
        id: 'comprehensive',
        title: 'Comprehensive Course',
        description: 'Full semester course with 12 weeks',
        modules: [
            { title: 'Week 1: Introduction', description: 'Course kickoff', order: 0, contents: [] },
            { title: 'Week 2-3: Fundamentals', description: 'Basic concepts', order: 1, contents: [] },
            { title: 'Week 4-5: Intermediate', description: 'Building on basics', order: 2, contents: [] },
            { title: 'Week 6: Midterm Review', description: 'Consolidation', order: 3, contents: [] },
            { title: 'Week 7-8: Advanced Topics', description: 'Complex subjects', order: 4, contents: [] },
            { title: 'Week 9-10: Specialization', description: 'Focus areas', order: 5, contents: [] },
            { title: 'Week 11: Project Work', description: 'Practical application', order: 6, contents: [] },
            { title: 'Week 12: Final Assessment', description: 'Course completion', order: 7, contents: [] }
        ]
    }
];

/**
 * CourseTemplates Component
 * Displays predefined course templates
 * Allows applying a template to current course
 */
export default function CourseTemplates({ onApplyTemplate }) {
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const handleApply = (template) => {
        onApplyTemplate(template);
        setPreviewTemplate(null);
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School />
                Course Templates
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose a template to quickly set up your course structure
            </Typography>

            <Grid container spacing={2}>
                {COURSE_TEMPLATES.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {template.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {template.description}
                                </Typography>
                                <Chip
                                    label={`${template.modules.length} modules`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    startIcon={<Visibility />}
                                    onClick={() => setPreviewTemplate(template)}
                                >
                                    Preview
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<CheckCircle />}
                                    variant="contained"
                                    onClick={() => handleApply(template)}
                                >
                                    Use Template
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Preview Dialog */}
            <Dialog
                open={previewTemplate !== null}
                onClose={() => setPreviewTemplate(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {previewTemplate?.title}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {previewTemplate?.description}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                        Modules:
                    </Typography>
                    {previewTemplate?.modules.map((module, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 1, p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {index + 1}. {module.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {module.description}
                            </Typography>
                        </Card>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewTemplate(null)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleApply(previewTemplate)}
                        startIcon={<CheckCircle />}
                    >
                        Apply Template
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
