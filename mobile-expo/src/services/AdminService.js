import api from '../utils/api';

const AdminService = {
    // Get all users
    async getAllUsers(params) {
        try {
            const response = await api.get('/api/admin/users', { params });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get all users error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch users',
            };
        }
    },

    // Get all courses (admin view)
    async getAllCourses(params) {
        try {
            const response = await api.get('/api/admin/courses', { params });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get all courses error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch courses',
            };
        }
    },

    // Get dashboard statistics
    async getStatistics() {
        try {
            const response = await api.get('/api/admin/statistics');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get statistics error:', error);
            // Return fallback data if endpoint doesn't exist
            return {
                success: true,
                data: {
                    totalUsers: 0,
                    totalCourses: 0,
                    totalEnrollments: 0,
                },
            };
        }
    },

    // Create user
    async createUser(userData) {
        try {
            const response = await api.post('/api/admin/users', userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Create user error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create user',
            };
        }
    },

    // Update user
    async updateUser(id, userData) {
        try {
            const response = await api.put(`/api/admin/users/${id}`, userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Update user error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update user',
            };
        }
    },

    // Delete user
    async deleteUser(id) {
        try {
            const response = await api.delete(`/api/admin/users/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Delete user error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete user',
            };
        }
    },

    // Change user role
    async changeRole(id, role) {
        try {
            const response = await api.put(`/api/admin/users/${id}/role`, { role });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Change role error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to change role',
            };
        }
    },
};

export default AdminService;
