import api from './api';

export const enrollmentService = {
    getMyEnrollments: async () => {
        const response = await api.get('/enrollments/my');
        return response.data;
    },

    getCourseEnrollments: async (courseId) => {
        const response = await api.get(`/courses/${courseId}/enrollments`);
        return response.data;
    }
};
