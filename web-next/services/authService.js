import api from './api';

export const authService = {
    login: async (usernameOrEmail, password) => {
        const response = await api.post('/auth/login', {
            usernameOrEmail,
            password,
        });
        return response.data;
    },

    register: async (username, email, password, fullName) => {
        const response = await api.post('/auth/register', {
            username,
            email,
            password,
            fullName,
        });
        return response.data;
    },

    googleAuth: async (credential) => {
        const response = await api.post('/auth/google', {
            credential,
        });
        return response.data;
    },

    setup2FA: async () => {
        const response = await api.post('/auth/2fa/setup');
        return response.data;
    },

    verify2FA: async (token) => {
        const response = await api.post('/auth/2fa/verify', {
            token,
        });
        return response.data;
    },

    login2FA: async (token) => {
        const response = await api.post('/auth/2fa/login', {
            token,
        });
        return response.data;
    },

    logout: async (refreshToken) => {
        const response = await api.post('/auth/logout', {
            refreshToken,
        });
        return response.data;
    },
};

export const userService = {
    getAll: async (params) => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    create: async (userData) => {
        const response = await api.post('/users', userData);
        return response.data;
    },

    update: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    changeRole: async (id, role) => {
        const response = await api.put(`/users/${id}/role`, { role });
        return response.data;
    },
};
