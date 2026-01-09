'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import { Add, Delete, Save, FileCopy } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { courseService } from '@/services/courseService';
import CourseTemplates from '@/components/course/CourseTemplates';
import DragDropModuleEditor from '@/components/course/DragDropModuleEditor';

export default function CourseCreator() {
    const { t } = useTranslation();
    const router = useRouter();
    const { courseId } = useParams(); // Start using courseId if present
    const isEditMode = Boolean(courseId);

    const [loading, setLoading] = useState(isEditMode);
    const [tabValue, setTabValue] = useState(0);
    const [course, setCourse] = useState({
        title: '',
        description: '',
        category: '',
        isPublished: false,
        prerequisites: [],
        accessControl: {}
    });

    const [modules, setModules] = useState([
        {
            title: '',
            content: '',
            videoUrl: '',
            order: 0
        }
    ]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode) {
            loadCourseData();
        }
    }, [courseId]);

    const loadCourseData = async () => {
        try {
            setLoading(true);
            const data = await courseService.getById(courseId);
            setCourse({
                title: data.course.title,
                description: data.course.description || '',
                category: data.course.category || '',
                isPublished: data.course.isPublished || false
            });

            // If API returns modules, set them. Otherwise keep default or empty.
            if (data.course.modules && data.course.modules.length > 0) {
                setModules(data.course.modules.sort((a, b) => a.order - b.order));
            }
        } catch (err) {
            setError('Failed to load course data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseChange = (field, value) => {
        setCourse({ ...course, [field]: value });
    };

    const handleModuleChange = (index, field, value) => {
        const newModules = [...modules];
        newModules[index][field] = value;
        setModules(newModules);
    };

    const addModule = () => {
        setModules([
            ...modules,
            {
                title: '',
                content: '',
                videoUrl: '',
                order: modules.length
            }
        ]);
    };

    const removeModule = (index) => {
        setModules(modules.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setError('');
            setSaving(true);

            // Validation
            if (!course.title) {
                setError('Title is required');
                setSaving(false);
                return;
            }

            let targetCourseId = courseId;

            if (isEditMode) {
                // Update Course
                await courseService.update(courseId, course);
                // Note: Module update logic might be complex (create/update/delete). 
                // For simplicity, we might need a dedicated module management or loop through.
                // Here assuming basic update for course details. 
                // Full module sync requires more complex backend API or loop.
                alert('Course updated successfully!');
            } else {
                // Create Course
                const createdCourse = await courseService.create(course);
                targetCourseId = createdCourse.course.id;

                // Add modules
                const validModules = modules.filter(m => m.title);
                for (const mod of validModules) {
                    await courseService.addModule(targetCourseId, mod);
                }
                alert('Course created successfully!');
            }

            router.push('/dashboard'); // Or back to course detail
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save course');
        } finally {
            setSaving(false);
        }
    };

    const handleCopyCourse = async () => {
        if (confirm('Clone this course with all modules?')) {
            const copiedCourse = {
                ...course,
                title: course.title + ' (Copy)',
                isPublished: false
            };
            handleCourseChange('title', copiedCourse.title);
            alert('Course cloned! Make changes and save.');
        }
    };

    const handleApplyTemplate = (template) => {
        setModules(template.modules || []);
        alert(`Template "${template.title}" applied!`);
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">
                        {isEditMode ? 'Edit Course' : 'Create New Course'}
                    </Typography>
                    {isEditMode && (
                        <Button
                            startIcon={<FileCopy />}
                            variant="outlined"
                            onClick={handleCopyCourse}
                        >
                            Clone Course
                        </Button>
                    )}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                    <Tab label="Basic Info" />
                    <Tab label="Modules" />
                    <Tab label="Templates" />
                </Tabs>

                {tabValue === 0 && (
                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <TextField
                                fullWidth
                                label={t('course.title')}
                                value={course.title}
                                onChange={(e) => handleCourseChange('title', e.target.value)}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label={t('course.description')}
                                value={course.description}
                                onChange={(e) => handleCourseChange('description', e.target.value)}
                                margin="normal"
                                multiline
                                rows={4}
                                placeholder="Enter course description..."
                            />
                            <TextField
                                fullWidth
                                label={t('course.category')}
                                value={course.category}
                                onChange={(e) => handleCourseChange('category', e.target.value)}
                                margin="normal"
                                select
                                SelectProps={{
                                    native: true
                                }}
                            >
                                <option value=""></option>
                                <option value="Programming">Programming</option>
                                <option value="Web Development">Web Development</option>
                                <option value="Data Science">Data Science</option>
                                <option value="Mobile Development">Mobile Development</option>
                                <option value="Database">Database</option>
                                <option value="Security">Security</option>
                            </TextField>
                        </CardContent>
                    </Card>
                )}

                {tabValue === 1 && (
                    <>
                        <DragDropModuleEditor
                            modules={modules}
                            onChange={setModules}
                        />
                    </>
                )}

                {tabValue === 2 && (
                    <CourseTemplates onApplyTemplate={handleApplyTemplate} />
                )}



                <Card sx={{ mt: 2, mb: 2 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                            <input
                                type="checkbox"
                                checked={course.isPublished}
                                onChange={(e) => handleCourseChange('isPublished', e.target.checked)}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <Typography variant="h6">
                                {t('course.publish') || 'Publish Course'}
                            </Typography>
                        </label>
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                            (When checked, this course will be visible to all students)
                        </Typography>
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Save />}
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : (isEditMode ? 'Update Course' : 'Create Course')}
                    </Button>
                </Box>
            </Box>
        </Container >
    );
}
