'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider
} from '@mui/material';
import {
    DragIndicator,
    Delete,
    Add,
    VideoLibrary,
    PictureAsPdf,
    Description
} from '@mui/icons-material';

/**
 * DragDropModuleEditor Component
 * Allows drag-and-drop reordering of course modules
 * Note: For full drag-and-drop, consider installing @dnd-kit/core
 * This is a simplified version with manual ordering
 */
export default function DragDropModuleEditor({ modules = [], onChange }) {
    const [draggedIndex, setDraggedIndex] = useState(null);

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newModules = [...modules];
        [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
        onChange(newModules);
    };

    const handleMoveDown = (index) => {
        if (index === modules.length - 1) return;
        const newModules = [...modules];
        [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
        onChange(newModules);
    };

    const handleAddModule = () => {
        onChange([...modules, {
            title: 'New Module',
            description: '',
            order: modules.length,
            contents: []
        }]);
    };

    const handleDeleteModule = (index) => {
        const newModules = modules.filter((_, i) => i !== index);
        onChange(newModules);
    };

    const handleModuleChange = (index, field, value) => {
        const newModules = [...modules];
        newModules[index] = {
            ...newModules[index],
            [field]: value
        };
        onChange(newModules);
    };

    const getContentIcon = (contentType) => {
        switch (contentType?.toLowerCase()) {
            case 'video':
                return <VideoLibrary />;
            case 'pdf':
                return <PictureAsPdf />;
            default:
                return <Description />;
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Course Modules
                </Typography>
                <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={handleAddModule}
                    size="small"
                >
                    Add Module
                </Button>
            </Box>

            <List>
                {modules.map((module, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                    >
                                        ▲
                                    </IconButton>
                                    <DragIndicator color="action" />
                                    <IconButton
                                        size="small"
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === modules.length - 1}
                                    >
                                        ▼
                                    </IconButton>
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label={`Module ${index + 1} - Title`}
                                        value={module.title || ''}
                                        onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Description"
                                        value={module.description || ''}
                                        onChange={(e) => handleModuleChange(index, 'description', e.target.value)}
                                    />

                                    {module.contents && module.contents.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Contents: {module.contents.length} item(s)
                                            </Typography>
                                            <List dense>
                                                {module.contents.slice(0, 3).map((content, cIndex) => (
                                                    <ListItem key={cIndex}>
                                                        {getContentIcon(content.type)}
                                                        <ListItemText
                                                            primary={content.title}
                                                            secondary={content.type}
                                                            sx={{ ml: 1 }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                </Box>

                                <IconButton
                                    color="error"
                                    onClick={() => handleDeleteModule(index)}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </List>

            {modules.length === 0 && (
                <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No modules yet. Click &quot;Add Module&quot; to get started.
                    </Typography>
                </Card>
            )}
        </Box>
    );
}
