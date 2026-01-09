'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import { Search } from '@mui/icons-material';
import api from '@/services/api';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadUsers();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [roleFilter, search]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (search) params.search = search;

            const response = await api.get('/admin/users', { params });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    User Management
                </Typography>

                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                    <TextField
                        select
                        label="Filter by Role"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="">All Roles</MenuItem>
                        <MenuItem value="STUDENT">Student</MenuItem>
                        <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                        <MenuItem value="ADMIN">Admin</MenuItem>
                    </TextField>
                </Box>

                <Card>
                    <CardContent>
                        {loading && users.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Full Name</strong></TableCell>
                                            <TableCell><strong>Username</strong></TableCell>
                                            <TableCell><strong>Email</strong></TableCell>
                                            <TableCell><strong>Role</strong></TableCell>
                                            <TableCell><strong>Details</strong></TableCell>
                                            <TableCell align="center"><strong>Status</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id} hover>
                                                <TableCell>{user.fullName || '-'}</TableCell>
                                                <TableCell>{user.username}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={user.role}
                                                        color={user.role === 'INSTRUCTOR' ? 'secondary' : user.role === 'ADMIN' ? 'error' : 'primary'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {user.role === 'STUDENT' && user.grade && (
                                                        <Chip label={`Grade ${user.grade}`} size="small" variant="outlined" />
                                                    )}
                                                    {user.role === 'INSTRUCTOR' && (
                                                        <Chip label={`${user._count?.coursesAssigned || 0} Courses`} size="small" variant="outlined" />
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={user.isActive ? 'Active' : 'Inactive'}
                                                        color={user.isActive ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {users.length === 0 && !loading && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}
