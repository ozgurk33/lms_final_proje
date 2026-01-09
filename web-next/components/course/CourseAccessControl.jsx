'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControlLabel,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    InputAdornment,
    IconButton,
    Alert
} from '@mui/material';
import {
    ExpandMore,
    Lock,
    Schedule,
    Group,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';

/**
 * CourseAccessControl Component
 * Manages course access restrictions:
 * - Date range (start/end dates)
 * - Group-based access
 * - Password protection
 */
export default function CourseAccessControl({ accessControl = {}, onChange }) {
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (field, value) => {
        onChange({
            ...accessControl,
            [field]: value
        });
    };

    const handleDateChange = (type, value) => {
        onChange({
            ...accessControl,
            dateRestriction: {
                ...accessControl.dateRestriction,
                [type]: value
            }
        });
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock />
                Access Control
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
                Configure who can access this course and when
            </Alert>

            {/* Date Restriction */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Schedule color="primary" />
                        <Typography>Date Restriction</Typography>
                        {accessControl.dateRestriction?.enabled && (
                            <Chip label="Active" color="primary" size="small" sx={{ ml: 'auto', mr: 2 }} />
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={accessControl.dateRestriction?.enabled || false}
                                    onChange={(e) => handleDateChange('enabled', e.target.checked)}
                                />
                            }
                            label="Enable date restriction"
                        />

                        {accessControl.dateRestriction?.enabled && (
                            <>
                                <TextField
                                    label="Start Date"
                                    type="datetime-local"
                                    value={accessControl.dateRestriction?.startDate || ''}
                                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="End Date"
                                    type="datetime-local"
                                    value={accessControl.dateRestriction?.endDate || ''}
                                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Group Restriction */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Group color="primary" />
                        <Typography>Group Restriction</Typography>
                        {accessControl.groupRestriction?.enabled && (
                            <Chip label="Active" color="primary" size="small" sx={{ ml: 'auto', mr: 2 }} />
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={accessControl.groupRestriction?.enabled || false}
                                    onChange={(e) => handleChange('groupRestriction', {
                                        ...accessControl.groupRestriction,
                                        enabled: e.target.checked
                                    })}
                                />
                            }
                            label="Restrict to specific groups"
                        />

                        {accessControl.groupRestriction?.enabled && (
                            <TextField
                                label="Allowed Groups (comma-separated)"
                                placeholder="e.g., Group A, Group B, Class 2024"
                                value={accessControl.groupRestriction?.groups?.join(', ') || ''}
                                onChange={(e) => handleChange('groupRestriction', {
                                    ...accessControl.groupRestriction,
                                    groups: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                                })}
                                fullWidth
                                multiline
                                rows={2}
                                helperText="Students must belong to at least one of these groups"
                            />
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Password Protection */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Lock color="primary" />
                        <Typography>Password Protection</Typography>
                        {accessControl.passwordProtection?.enabled && (
                            <Chip label="Active" color="primary" size="small" sx={{ ml: 'auto', mr: 2 }} />
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={accessControl.passwordProtection?.enabled || false}
                                    onChange={(e) => handleChange('passwordProtection', {
                                        ...accessControl.passwordProtection,
                                        enabled: e.target.checked
                                    })}
                                />
                            }
                            label="Require password to enroll"
                        />

                        {accessControl.passwordProtection?.enabled && (
                            <TextField
                                label="Enrollment Password"
                                type={showPassword ? 'text' : 'password'}
                                value={accessControl.passwordProtection?.password || ''}
                                onChange={(e) => handleChange('passwordProtection', {
                                    ...accessControl.passwordProtection,
                                    password: e.target.value
                                })}
                                fullWidth
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                helperText="Students will need this password to enroll in the course"
                            />
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
