'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    MenuItem,
    TextField,
    Avatar,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    LinearProgress,
    Tabs,
    Tab
} from '@mui/material';
import {
    People,
    School,
    Quiz as QuizIcon,
    TrendingUp,
    Search,
    FilterList,
    Edit,
    Delete,
    Block,
    CheckCircle,
    Security,
    Assignment,
    Add
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { adminService } from '@/services/adminService';
import { authService, userService } from '@/services/authService';

export default function AdminDashboard() {
    const { t } = useTranslation();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [currentTab, setCurrentTab] = useState(0);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, usersData, logsData] = await Promise.all([
                adminService.getStats(),
                userService.getAll(),
                adminService.getLogs({ limit: 10 })
            ]);

            setStats(statsData.stats);
            setUsers(usersData.users || []);
            setLogs(logsData.logs || []);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await authService.changeRole(userId, newRole);
            alert('Role changed successfully!');
            fetchDashboardData();
        } catch (error) {
            alert('Failed to change role: ' + (error.response?.data?.error || error.message));
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role) => {
        const colors = {
            SUPER_ADMIN: 'error',
            ADMIN: 'warning',
            INSTRUCTOR: 'primary',
            ASSISTANT: 'info',
            STUDENT: 'success',
            GUEST: 'default'
        };
        return colors[role] || 'default';
    };

    const getActionColor = (action) => {
        if (action.includes('LOGIN')) return 'info';
        if (action.includes('CREATE') || action.includes('REGISTER')) return 'success';
        if (action.includes('DELETE')) return 'error';
        if (action.includes('UPDATE')) return 'warning';
        return 'default';
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* Modern Header with Gradient */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        borderRadius: 4,
                        p: 4,
                        mb: 4,
                        color: 'white',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h4" gutterBottom fontWeight="bold">
                                {t('dashboard.welcome')}, {user?.fullName || user?.username}!
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                System Administration & Management
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<Add />}
                                onClick={() => router.push('/instructor/create-course')}
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                            >
                                Create Course
                            </Button>
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    fontSize: '2rem',
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    border: '3px solid white'
                                }}
                            >
                                {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                            </Avatar>
                        </Box>
                    </Box>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: '0.3s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 3
                                }
                            }}
                            onClick={() => router.push('/admin/users')}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <People />
                                    <Typography variant="body2">Total Users</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="bold">
                                    {stats?.totalUsers || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Active accounts
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: 'white',
                                cursor: 'pointer',
                                transition: '0.3s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 3
                                }
                            }}
                            onClick={() => router.push('/admin/course-assignments')}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <School />
                                    <Typography variant="body2">Total Courses</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="bold">
                                    {stats?.totalCourses || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Published & drafts
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <QuizIcon />
                                    <Typography variant="body2">Total Quizzes</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="bold">
                                    {stats?.totalQuizzes || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Assessment items
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                            color: 'white'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <TrendingUp />
                                    <Typography variant="body2">Enrollments</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="bold">
                                    {stats?.totalEnrollments || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Active enrollments
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* User Roles Distribution */}
                {stats?.usersByRole && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                User Distribution by Role
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                {Object.entries(stats.usersByRole).map(([role, count]) => (
                                    <Grid item xs={6} sm={4} md={2} key={role}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Chip
                                                label={role}
                                                color={getRoleColor(role)}
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography variant="h5" fontWeight="bold">
                                                {count}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity & Users Section */}
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Security color="primary" />
                                        <Typography variant="h6">
                                            All Users (Instructors & Students)
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Filters */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search by username or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            select
                                            size="small"
                                            label="Filter by Role"
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <FilterList />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="ALL">All Roles</MenuItem>
                                            <MenuItem value="STUDENT">Student</MenuItem>
                                            <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                            <MenuItem value="ADMIN">Admin</MenuItem>
                                            <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            Showing {filteredUsers.length} of {users.length} users
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {/* User Table */}
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>User</strong></TableCell>
                                                <TableCell><strong>Email</strong></TableCell>
                                                <TableCell align="center"><strong>Role</strong></TableCell>
                                                <TableCell align="center"><strong>Status</strong></TableCell>
                                                <TableCell align="center"><strong>Actions</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredUsers.slice(0, 50).map((u) => ( // Increased limit
                                                <TableRow key={u.id} hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 32, height: 32 }}>
                                                                {u.fullName?.charAt(0) || u.username.charAt(0)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {u.fullName || u.username}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    @{u.username}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{u.email}</TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            select
                                                            size="small"
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                            sx={{ minWidth: 130 }}
                                                        >
                                                            <MenuItem value="STUDENT">Student</MenuItem>
                                                            <MenuItem value="ASSISTANT">Assistant</MenuItem>
                                                            <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                                            <MenuItem value="ADMIN">Admin</MenuItem>
                                                            <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                                                        </TextField>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={u.isActive ? 'Active' : 'Inactive'}
                                                            color={u.isActive ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton size="small" color="primary">
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="warning">
                                                            <Block fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}
