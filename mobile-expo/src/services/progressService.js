import api from '../utils/api';

const progressService = {
    /**
     * Get progress for a module
     */
    async getProgress(moduleId) {
        try {
            const response = await api.get(`/api/progress/${moduleId}`);
            return { success: true, data: response.data };
        } catch (error) {
            // Silently fail if endpoint doesn't exist
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch progress',
            };
        }
    },

    /**
     * Update progress for a module
     */
    async updateProgress(moduleId, progressData) {
        try {
            const response = await api.post(`/api/progress/${moduleId}`, progressData);
            return { success: true, data: response.data };
        } catch (error) {
            // Silently fail if endpoint doesn't exist
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update progress',
            };
        }
    },

    /**
     * Mark module as completed
     */
    async markCompleted(moduleId) {
        try {
            const response = await api.post(`/api/progress/${moduleId}/complete`);
            return { success: true, data: response.data };
        } catch (error) {
            // Silently fail if endpoint doesn't exist
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to mark as completed',
            };
        }
    },
};

export default progressService;
