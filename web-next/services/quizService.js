import api from './api';

/**
 * Extended Quiz Service with SEB support
 */
export const quizService = {
    getAll: async (params) => {
        const response = await api.get('/quizzes', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/quizzes/${id}`);
        return response.data;
    },

    create: async (quizData) => {
        const response = await api.post('/quizzes', quizData);
        return response.data;
    },

    startAttempt: async (id) => {
        const response = await api.post(`/quizzes/${id}/start`);
        return response.data;
    },

    submit: async (id, attemptId, answers) => {
        const response = await api.post(`/quizzes/${id}/submit`, {
            attemptId,
            answers,
        });
        return response.data;
    },

    getResults: async (id) => {
        const response = await api.get(`/quizzes/${id}/results`);
        return response.data;
    },

    getAttemptDetails: async (id, attemptId) => {
        const response = await api.get(`/quizzes/${id}/attempts/${attemptId}`);
        return response.data;
    },

    getQuestions: async (id) => {
        const response = await api.get(`/quizzes/${id}/questions`);
        return response.data;
    },

    // SEB Support
    downloadSEBConfig: async (quizId) => {
        try {
            const response = await api.get(`/quizzes/${quizId}/seb-config`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `quiz-${quizId}.seb`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('Failed to download SEB config:', error);
            return { success: false, error: error.message };
        }
    },

    // Rubric APIs
    saveRubric: async (questionId, rubric) => {
        const response = await api.post(`/questions/${questionId}/rubric`, rubric);
        return response.data;
    },

    getRubric: async (questionId) => {
        const response = await api.get(`/questions/${questionId}/rubric`);
        return response.data;
    },

    gradeWithRubric: async (attemptId, questionId, gradeData) => {
        const response = await api.post(`/attempts/${attemptId}/questions/${questionId}/grade`, gradeData);
        return response.data;
    },

    // Question Bank APIs
    getQuestionBank: async (params) => {
        const response = await api.get('/questions/bank', { params });
        return response.data;
    },

    createQuestion: async (questionData) => {
        const response = await api.post('/questions', questionData);
        return response.data;
    },

    updateQuestion: async (id, questionData) => {
        const response = await api.put(`/questions/${id}`, questionData);
        return response.data;
    },

    deleteQuestion: async (id) => {
        const response = await api.delete(`/questions/${id}`);
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/questions/categories');
        return response.data;
    },

    createCategory: async (name) => {
        const response = await api.post('/questions/categories', { name });
        return response.data;
    },

    getTags: async () => {
        const response = await api.get('/questions/tags');
        return response.data;
    },

    // Random Question Pool
    getRandomQuestions: async (quizId, poolConfig) => {
        const response = await api.post(`/quizzes/${quizId}/random-questions`, poolConfig);
        return response.data;
    }
};

// Grade service (already defined in previous work)
export const gradeService = {
    getGradebook: async (courseId) => {
        const response = await api.get(`/courses/${courseId}/grades`);
        return response.data;
    },

    getStudentGrades: async (courseId, studentId) => {
        const response = await api.get(`/courses/${courseId}/students/${studentId}/grades`);
        return response.data;
    },

    updateGrade: async (courseId, studentId, gradeData) => {
        const response = await api.put(`/courses/${courseId}/students/${studentId}/grade`, gradeData);
        return response.data;
    },

    exportGradebook: async (courseId, format = 'csv') => {
        const response = await api.get(`/courses/${courseId}/grades/export`, {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    }
};

export const getAllCourses = async () => {
    const response = await api.get('/courses');
    return response.data;
};
