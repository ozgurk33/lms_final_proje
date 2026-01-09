import api from '../utils/api';

const CourseService = {
    // Get all courses (for students: their enrolled courses)
    async getAll(params) {
        try {
            const response = await api.get('/api/courses', { params });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get all courses error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch courses',
            };
        }
    },

    // Alias for backward compatibility
    async getEnrolledCourses() {
        return this.getAll();
    },

    // Get course by ID
    async getById(id) {
        try {
            const response = await api.get(`/api/courses/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get course by ID error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch course',
            };
        }
    },

    // Alias
    async getCourseDetails(courseId) {
        return this.getById(courseId);
    },

    // Create course (Instructor)
    async create(courseData) {
        try {
            const response = await api.post('/api/courses', courseData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Create course error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create course',
            };
        }
    },

    // Alias
    async createCourse(courseData) {
        return this.create(courseData);
    },

    // Update course (Instructor)
    async update(id, courseData) {
        try {
            const response = await api.put(`/api/courses/${id}`, courseData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Update course error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update course',
            };
        }
    },

    // Alias
    async updateCourse(courseId, courseData) {
        return this.update(courseId, courseData);
    },

    // Delete course
    async delete(id) {
        try {
            const response = await api.delete(`/api/courses/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Delete course error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete course',
            };
        }
    },

    // Enroll in course
    async enroll(id) {
        try {
            const response = await api.post(`/api/courses/${id}/enroll`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Enroll error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to enroll',
            };
        }
    },

    // Add module to course
    async addModule(id, moduleData) {
        try {
            const response = await api.post(`/api/courses/${id}/modules`, moduleData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Add module error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to add module',
            };
        }
    },

    // Get course modules (alias for compatibility)
    async getCourseModules(courseId) {
        try {
            const response = await api.get(`/api/courses/${courseId}/modules`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get course modules error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch modules',
            };
        }
    },

    // Get instructor courses
    async getInstructorCourses() {
        try {
            // Backend returns instructor's courses when called by instructor role
            const response = await api.get('/api/courses');
            return { success: true, data: response.data.courses || response.data };
        } catch (error) {
            console.error('Get instructor courses error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch courses',
            };
        }
    },
};

export default CourseService;
