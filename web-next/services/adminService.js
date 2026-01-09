import api from './api';

export const adminService = {
    getLogs: async (params) => {
        const response = await api.get('/admin/logs', { params });
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },
};
