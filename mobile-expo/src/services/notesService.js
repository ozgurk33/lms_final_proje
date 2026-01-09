import api from '../utils/api';

const notesService = {
    /**
     * Get all notes for a module
     */
    async getNotes(moduleId) {
        try {
            const response = await api.get(`/api/notes/module/${moduleId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch notes',
            };
        }
    },

    /**
     * Create a new note
     */
    async createNote(moduleId, title, content) {
        try {
            const response = await api.post('/api/notes', {
                moduleId,
                title,
                content,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create note',
            };
        }
    },

    /**
     * Update a note
     */
    async updateNote(noteId, title, content) {
        try {
            const response = await api.put(`/api/notes/${noteId}`, {
                title,
                content,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update note',
            };
        }
    },

    /**
     * Delete a note
     */
    async deleteNote(noteId) {
        try {
            const response = await api.delete(`/api/notes/${noteId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete note',
            };
        }
    },
};

export default notesService;
