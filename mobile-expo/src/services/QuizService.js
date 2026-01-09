import api from '../utils/api';

const QuizService = {
    /**
     * Create OMR Quiz
     */
    createOMRQuiz: async (quizData) => {
        try {
            const response = await api.post('/api/quizzes/omr/create', quizData);
            return response.data;
        } catch (error) {
            console.error('Create OMR quiz error:', error);
            throw error;
        }
    },

    /**
     * Get OMR Quizzes for instructor
     */
    getOMRQuizzes: async (courseId = null) => {
        try {
            const params = courseId ? { courseId } : {};
            const response = await api.get('/api/quizzes/omr/list', { params });
            return response.data;
        } catch (error) {
            console.error('Get OMR quizzes error:', error);
            throw error;
        }
    },

    /**
     * Grade OMR Sheet
     */
    gradeOMRSheet: async (gradeData) => {
        try {
            const response = await api.post('/api/quizzes/omr/grade', gradeData);
            return response.data;
        } catch (error) {
            console.error('Grade OMR sheet error:', error);
            throw error;
        }
    },
    // Get all quizzes
    async getAll(params) {
        try {
            const response = await api.get('/api/quizzes', { params });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get all quizzes error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch quizzes',
            };
        }
    },

    // Get quiz by ID
    async getById(id) {
        try {
            const response = await api.get(`/api/quizzes/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get quiz error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch quiz',
            };
        }
    },

    // Get quizzes for a course
    async getCourseQuizzes(courseId) {
        try {
            const response = await api.get(`/api/courses/${courseId}/quizzes`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get course quizzes error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch quizzes',
            };
        }
    },

    // Get attempts for a quiz
    async getAttempts(id) {
        try {
            const response = await api.get(`/api/quizzes/${id}/attempts`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get attempts error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch attempts',
            };
        }
    },

    // Alias for backward compatibility
    async getQuizHistory(quizId) {
        return this.getAttempts(quizId);
    },

    // Get attempt details
    async getAttemptDetails(quizId, attemptId) {
        try {
            const response = await api.get(`/api/quizzes/${quizId}/attempts/${attemptId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get attempt details error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch attempt details',
            };
        }
    },

    // Get quiz results
    async getResults(id) {
        try {
            const response = await api.get(`/api/quizzes/${id}/results`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Get quiz results error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch results',
            };
        }
    },

    // NOTE: Start attempt and submit are NOT implemented on mobile
    // Users must use web or desktop for taking quizzes
    startAttempt(id, password) {
        return {
            success: false,
            error: 'Sınava giriş için Web veya Desktop uygulaması kullanın.',
        };
    },

    submit(id, attemptId, answers) {
        return {
            success: false,
            error: 'Sınav gönderimi için Web veya Desktop uygulaması kullanın.',
        };
    },
};

export default QuizService;
