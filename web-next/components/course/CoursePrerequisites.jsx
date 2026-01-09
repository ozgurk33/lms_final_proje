'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    FormControl,
    Autocomplete,
    TextField,
    Chip,
    Card,
    CardContent,
    Alert
} from '@mui/material';
import { School, ArrowRight } from '@mui/icons-material';
import { courseService } from '@/services/courseService';

/**
 * CoursePrerequisites Component
 * Allows selecting prerequisite courses for a course
 * Displays dependency tree visualization
 */
export default function CoursePrerequisites({
    selectedPrerequisites = [],
    onChange,
    currentCourseId = null
}) {
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, [currentCourseId]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getAllCourses();
            // Exclude current course from prerequisites
            const filtered = response.data.filter(
                course => course._id !== currentCourseId
            );
            setAvailableCourses(filtered);
        } catch (error) {
            console.error('Failed to load courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrerequisiteChange = (event, newValue) => {
        onChange(newValue.map(course => course._id));
    };

    const getSelectedCourseObjects = () => {
        return availableCourses.filter(course =>
            selectedPrerequisites.includes(course._id)
        );
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School />
                Course Prerequisites
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
                Select courses that students must complete before enrolling in this course.
            </Alert>

            <FormControl fullWidth sx={{ mb: 3 }}>
                <Autocomplete
                    multiple
                    loading={loading}
                    options={availableCourses}
                    value={getSelectedCourseObjects()}
                    onChange={handlePrerequisiteChange}
                    getOptionLabel={(option) => option.title || ''}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Prerequisite Courses"
                            placeholder="Search courses..."
                        />
                    )}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                key={option._id}
                                label={option.title}
                                {...getTagProps({ index })}
                                color="primary"
                            />
                        ))
                    }
                />
            </FormControl>

            {selectedPrerequisites.length > 0 && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                            Prerequisite Chain:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                            {getSelectedCourseObjects().map((course, index) => (
                                <Box key={course._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        label={course.title}
                                        size="small"
                                        color="secondary"
                                        icon={<School fontSize="small" />}
                                    />
                                    {index < selectedPrerequisites.length - 1 && (
                                        <ArrowRight color="action" />
                                    )}
                                </Box>
                            ))}
                            <ArrowRight color="action" />
                            <Chip
                                label="Current Course"
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
