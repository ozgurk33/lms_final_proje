import api from '../utils/api';

const CourseService = {
    // Student: Get enrolled courses
    async getEnrolledCourses() {
        try {
            const response = await api.get('/api/courses/enrolled');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get enrolled courses error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch courses',
            };
        }
    },

    // Get course details
    async getCourseDetails(courseId) {
        try {
            const response = await api.get(`/api/courses/${courseId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get course details error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch course details',
            };
        }
    },

    // Instructor: Get instructor's courses
    async getInstructorCourses() {
        try {
            const response = await api.get('/api/instructor/courses');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get instructor courses error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch courses',
            };
        }
    },

    // Instructor: Create new course
    async createCourse(courseData) {
        try {
            const response = await api.post('/api/courses', courseData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Create course error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create course',
            };
        }
    },

    // Instructor: Update course
    async updateCourse(courseId, courseData) {
        try {
            const response = await api.put(`/api/courses/${courseId}`, courseData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Update course error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update course',
            };
        }
    },

    // Get course modules/content
    async getCourseModules(courseId) {
        try {
            const response = await api.get(`/api/courses/${courseId}/modules`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get course modules error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch course content',
            };
        }
    },
};

export default CourseService;
