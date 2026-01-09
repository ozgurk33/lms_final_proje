'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';
import api from '../../services/api';

export default function StudentAssignmentDialog({ open, onClose, courseId, courseTitle, onAssignSuccess }) {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (open) {
            fetchStudents();
            setSelectedStudent('');
            setError('');
        }
    }, [open]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            // Fetch all students.
            // Note: In a real app with many students, this should be a search/autocomplete field.
            // For now, fetching all students is acceptable as per current requirements.
            const response = await api.get('/instructor/students');
            console.log('Students API response:', response.data);

            const fetchedStudents = response.data.students || [];
            setStudents(fetchedStudents);

            if (fetchedStudents.length === 0) {
                console.warn('No students found in the system');
            } else {
                console.log(`Loaded ${fetchedStudents.length} students`);
            }
        } catch (err) {
            console.error('Failed to fetch students:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to load student list.';
            setError(`Error loading students: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedStudent) {
            setError('Please select a student.');
            return;
        }

        try {
            setAssigning(true);
            setError('');

            // Call the existing instructor endpoint to assign student(s)
            await api.post('/instructor/assign-students', {
                courseId: courseId,
                studentIds: [selectedStudent] // API expects an array
            });

            if (onAssignSuccess) onAssignSuccess();
            onClose();
            alert('Student assigned successfully!');
        } catch (err) {
            console.error('Assign error:', err);
            setError(err.response?.data?.error || 'Failed to assign student.');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Assign Student to &quot;{courseTitle}&quot;</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}

                {loading ? (
                    <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
                ) : students.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No students found in the system. Please contact an administrator to add students first.
                    </Alert>
                ) : (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Select Student</InputLabel>
                        <Select
                            value={selectedStudent}
                            label="Select Student"
                            onChange={(e) => setSelectedStudent(e.target.value)}
                        >
                            {students.map((student) => (
                                <MenuItem key={student.id} value={student.id}>
                                    {student.fullName} ({student.username})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={assigning}>Cancel</Button>
                <Button
                    onClick={handleAssign}
                    variant="contained"
                    disabled={!selectedStudent || assigning || loading}
                >
                    {assigning ? 'Assigning...' : 'Assign'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
