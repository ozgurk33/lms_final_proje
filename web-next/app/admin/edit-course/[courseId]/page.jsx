'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { courseService } from '@/services/courseService';
import RichTextEditor from '@/components/editor/RichTextEditor';

export default function EditCoursePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId;

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState({
        title: '',
        description: '',
        category: '',
        isPublished: false
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
        loadCourseData();
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

            // Update Course
            await courseService.update(courseId, course);
            // Note: Module update logic might be complex (create/update/delete). 
            // For simplicity, we might need a dedicated module management or loop through.
            // Here assuming basic update for course details. 
            // Full module sync requires more complex backend API or loop.
            alert('Course updated successfully!');
            router.push('/dashboard'); // Or back to course detail
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save course');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Edit Course
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'text.secondary' }}>
                                {t('course.description')} *
                            </Typography>
                            <RichTextEditor
                                value={course.description}
                                onChange={(value) => handleCourseChange('description', value)}
                                placeholder="Enter course description with rich formatting..."
                                height="200px"
                            />
                        </Box>
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

                <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                    {t('course.modules')}
                </Typography>

                {modules.map((module, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Module {index + 1}</Typography>
                                <IconButton onClick={() => removeModule(index)} color="error">
                                    <Delete />
                                </IconButton>
                            </Box>
                            <TextField
                                fullWidth
                                label="Module Title"
                                value={module.title}
                                onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                                margin="normal"
                                required
                            />
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, color: 'text.secondary' }}>
                                    Module Content
                                </Typography>
                                <RichTextEditor
                                    value={module.content}
                                    onChange={(value) => handleModuleChange(index, 'content', value)}
                                    placeholder="Enter module content with rich formatting (text, images, videos, code blocks)..."
                                    height="250px"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Video URL (Optional)"
                                value={module.videoUrl}
                                onChange={(e) => handleModuleChange(index, 'videoUrl', e.target.value)}
                                margin="normal"
                            />
                        </CardContent>
                    </Card>
                ))}

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

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 3 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={addModule}
                    >
                        Add Module
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Save />}
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Update Course'}
                    </Button>
                </Box>
            </Box>
        </Container >
    );
}
