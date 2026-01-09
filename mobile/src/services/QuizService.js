import api from '../utils/api';

const QuizService = {
    // Get quizzes for a course
    async getCourseQuizzes(courseId) {
        try {
            const response = await api.get(`/api/courses/${courseId}/quizzes`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get course quizzes error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch quizzes',
            };
        }
    },

    // Get quiz attempts/history for a specific quiz
    async getQuizHistory(quizId) {
        try {
            const response = await api.get(`/api/quizzes/${quizId}/attempts`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get quiz history error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch quiz history',
            };
        }
    },

    // Get attempt details
    async getAttemptDetails(attemptId) {
        try {
            const response = await api.get(`/api/quizzes/attempts/${attemptId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get attempt details error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch attempt details',
            };
        }
    },
};

export default QuizService;
