'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Alert,
    Chip,
    Grid,
    Tabs,
    Tab
} from '@mui/material';
import {
    ArrowBack,
    Add,
    Edit,
    Delete,
    DragIndicator,
    VideoLibrary,
    Description
} from '@mui/icons-material';
import api from '@/services/api';

export default function CourseManagementPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [moduleForm, setModuleForm] = useState({
        title: '',
        content: '',
        videoUrl: ''
    });

    useEffect(() => {
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/courses/${courseId}`);
            setCourse(response.data.course);
            setModules(response.data.course.modules || []);
        } catch (error) {
            console.error('Failed to load course:', error);
            setError('Failed to load course');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (module = null) => {
        if (module) {
            setEditingModule(module);
            setModuleForm({
                title: module.title,
                content: module.content || '',
                videoUrl: module.videoUrl || ''
            });
        } else {
            setEditingModule(null);
            setModuleForm({ title: '', content: '', videoUrl: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingModule(null);
        setModuleForm({ title: '', content: '', videoUrl: '' });
    };

    const handleSaveModule = async () => {
        try {
            if (!moduleForm.title) {
                alert('Title is required');
                return;
            }

            if (editingModule) {
                // Update
                await api.put(`/courses/${courseId}/modules/${editingModule.id}`, moduleForm);
            } else {
                // Create
                await api.post(`/courses/${courseId}/modules`, {
                    ...moduleForm,
                    order: modules.length
                });
            }

            handleCloseDialog();
            loadCourse();
        } catch (error) {
            console.error('Failed to save module:', error);
            alert('Failed to save module');
        }
    };

    const [draggedItem, setDraggedItem] = useState(null);

    // ... dialog states ...

    const handleDragStart = (e, index) => {
        setDraggedItem(modules[index]);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image styling if needed
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        const draggedOverItem = modules[index];

        // if the item is dragged over itself, ignore
        if (draggedItem === draggedOverItem) {
            return;
        }

        // filter out the currently dragged item
        let items = modules.filter(item => item !== draggedItem);

        // add the dragged item after the dragged over item
        items.splice(index, 0, draggedItem);

        setModules(items);
    };

    const handleDragEnd = async () => {
        setDraggedItem(null);

        // Save new order
        try {
            const reordered = modules.map((m, index) => ({
                id: m.id,
                order: index
            }));

            await api.put(`/courses/${courseId}/modules/reorder`, { modules: reordered });
            // Optional: Show success message
            // loadCourse(); // Reload correctly from server to confirm
        } catch (error) {
            console.error('Failed to save module order:', error);
            alert('Sıralama kaydedilemedi! Lütfen sayfayı yenileyip tekrar deneyin.');
            loadCourse(); // Revert to server state
        }
    };

    const handleGradeToggle = async (grade) => {
        try {
            const currentGrades = course.requiredGrades || [];
            const updated = currentGrades.includes(grade)
                ? currentGrades.filter(g => g !== grade)
                : [...currentGrades, grade].sort();

            await api.put(`/courses/${courseId}`, { requiredGrades: updated });
            loadCourse();
        } catch (error) {
            console.error('Failed to update grades:', error);
            alert('Failed to update required grades');
        }
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ my: 4, textAlign: 'center' }}>
                    <Typography>Loading...</Typography>
                </Box>
            </Container>
        );
    }

    if (!course) {
        return (
            <Container>
                <Box sx={{ my: 4 }}>
                    <Alert severity="error">Course not found</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.push('/instructor')}
                    sx={{ mb: 2 }}
                >
                    Back to Dashboard
                </Button>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {course.description}
                        </Typography>
                    </Box>
                    <Chip
                        label={course.isPublished ? 'Published' : 'Draft'}
                        color={course.isPublished ? 'success' : 'default'}
                    />
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Tabs */}
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                    <Tab label="Modules" />
                    <Tab label="Ön Koşullar" />
                </Tabs>

                {/* Tab 0: Modules */}
                {tabValue === 0 && (
                    <>
                        {/* Course Stats */}
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6">{modules.length}</Typography>
                                        <Typography variant="body2" color="text.secondary">Modules</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6">{course._count?.enrollments || 0}</Typography>
                                        <Typography variant="body2" color="text.secondary">Students Enrolled</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6">{course.quizzes?.length || 0}</Typography>
                                        <Typography variant="body2" color="text.secondary">Quizzes</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Modules Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">Course Modules</Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenDialog()}
                            >
                                Add Module
                            </Button>
                        </Box>

                        {modules.length === 0 ? (
                            <Card variant="outlined">
                                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                    <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography color="text.secondary">
                                        No modules yet. Add your first module to get started.
                                    </Typography>
                                </CardContent>
                            </Card>
                        ) : (
                            <List>
                                {modules.map((module, index) => (
                                    <Card
                                        key={module.id}
                                        sx={{
                                            mb: 2,
                                            cursor: 'grab',
                                            bgcolor: draggedItem?.id === module.id ? 'action.hover' : 'background.paper',
                                            transition: 'transform 0.2s',
                                            '&:active': { cursor: 'grabbing' }
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <ListItem>
                                            <IconButton
                                                edge="start"
                                                sx={{ cursor: 'grab' }}
                                                onMouseDown={(e) => e.stopPropagation()} // Prevent card drag on button click? Actually we want card drag.
                                            >
                                                <DragIndicator />
                                            </IconButton>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="h6">
                                                            {index + 1}. {module.title}
                                                        </Typography>
                                                        {module.videoUrl && (
                                                            <Chip
                                                                icon={<VideoLibrary />}
                                                                label="Video"
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    module.content
                                                        ? module.content.substring(0, 100) + (module.content.length > 100 ? '...' : '')
                                                        : 'No content'
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleOpenDialog(module)}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    color="error"
                                                    onClick={() => handleDeleteModule(module.id)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    </Card>
                                ))}
                            </List>
                        )}
                    </>
                )}

                {/* Tab 1: Prerequisites */}
                {tabValue === 1 && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Gerekli Sınıf Seviyeleri
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Öğrenciler bu kursa kaydolmak için aşağıdaki sınıflardan birinde olmalıdır
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {[1, 2, 3, 4].map(grade => (
                                    <label key={grade} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={course.requiredGrades?.includes(grade) || false}
                                            onChange={() => handleGradeToggle(grade)}
                                            style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <Typography variant="body1">{grade}. Sınıf</Typography>
                                    </label>
                                ))}
                            </Box>
                            {course.requiredGrades && course.requiredGrades.length > 0 && (
                                <Alert severity="info" sx={{ mt: 3 }}>
                                    Seçili sınıflar: {course.requiredGrades.join(', ')}. sınıf
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Add/Edit Module Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingModule ? 'Edit Module' : 'Add New Module'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Module Title"
                            value={moduleForm.title}
                            onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label="Content"
                            value={moduleForm.content}
                            onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                            placeholder="Enter module content (supports markdown)"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Video URL (Optional)"
                            value={moduleForm.videoUrl}
                            onChange={(e) => setModuleForm({ ...moduleForm, videoUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            helperText="YouTube, Vimeo, or direct video URL"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveModule} variant="contained">
                        {editingModule ? 'Update' : 'Add'} Module
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
