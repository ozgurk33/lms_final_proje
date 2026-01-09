import api from './api';

export const courseService = {
    getAll: async (params) => {
        const response = await api.get('/courses', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },

    create: async (courseData) => {
        const response = await api.post('/courses', courseData);
        return response.data;
    },

    update: async (id, courseData) => {
        const response = await api.put(`/courses/${id}`, courseData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    },

    enroll: async (id) => {
        const response = await api.post(`/courses/${id}/enroll`);
        return response.data;
    },

    addModule: async (id, moduleData) => {
        const response = await api.post(`/courses/${id}/modules`, moduleData);
        return response.data;
    },

    getAllCourses: async () => {
        const response = await api.get('/courses');
        return response.data;
    }
};

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

    update: async (id, quizData) => {
        const response = await api.put(`/quizzes/${id}`, quizData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/quizzes/${id}`);
        return response.data;
    },

    startAttempt: async (id, password) => {
        const response = await api.post(`/quizzes/${id}/start`, { password });
        return response.data;
    },

    submit: async (id, attemptId, answers) => {
        const response = await api.post(`/quizzes/${id}/submit`, { attemptId, answers });
        return response.data;
    },

    getAttempts: async (id) => {
        const response = await api.get(`/quizzes/${id}/attempts`);
        return response.data;
    },

    getQuestions: async (id) => {
        const response = await api.get(`/quizzes/${id}/questions`);
        return response.data;
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
    },

    // Get quiz results (all attempts for a quiz)
    getResults: async (id) => {
        const response = await api.get(`/quizzes/${id}/results`);
        return response.data;
    },

    // Get detailed attempt results
    getAttemptDetails: async (quizId, attemptId) => {
        const response = await api.get(`/quizzes/${quizId}/attempts/${attemptId}`);
        return response.data;
    }
};

export const gradeService = {
    // Get gradebook for a course
    getGradebook: async (courseId) => {
        const response = await api.get(`/courses/${courseId}/grades`);
        return response.data;
    },

    // Get student's grades
    getStudentGrades: async (courseId, studentId) => {
        const response = await api.get(`/courses/${courseId}/students/${studentId}/grades`);
        return response.data;
    },

    // Update grade
    updateGrade: async (courseId, studentId, gradeData) => {
        const response = await api.put(`/courses/${courseId}/students/${studentId}/grade`, gradeData);
        return response.data;
    },

    // Export gradebook
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
