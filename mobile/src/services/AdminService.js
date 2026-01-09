import api from '../utils/api';

const AdminService = {
    // Get all users
    async getAllUsers() {
        try {
            const response = await api.get('/api/admin/users');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get all users error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch users',
            };
        }
    },

    // Get all courses
    async getAllCourses() {
        try {
            const response = await api.get('/api/admin/courses');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get all courses error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch courses',
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
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch statistics',
            };
        }
    },
};

export default AdminService;
