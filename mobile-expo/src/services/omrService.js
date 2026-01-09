import api from '../utils/api';

/**
 * OMR (Optical Mark Recognition) Service
 * Handles all OMR-related API calls
 */

// Upload OMR sheet image
export const uploadOMRSheet = async (imageUri, instructorId, studentId = null, quizId = null, courseId = null) => {
    try {
        console.log('📤 uploadOMRSheet called with:');
        console.log('  - imageUri:', imageUri);
        console.log('  - instructorId:', instructorId);
        console.log('  - studentId:', studentId);
        console.log('  - quizId:', quizId);

        const formData = new FormData();

        // Append image file
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        console.log('📷 Image details:');
        console.log('  - filename:', filename);
        console.log('  - type:', type);

        formData.append('image', {
            uri: imageUri,
            name: filename,
            type
        });

        // Append metadata
        if (studentId) formData.append('studentId', studentId);
        if (quizId) formData.append('quizId', quizId);
        if (courseId) formData.append('courseId', courseId);
        formData.append('instructorId', instructorId);

        console.log('🌐 Sending to: /api/omr/upload');
        console.log('📦 FormData prepared');

        const response = await api.post('/api/omr/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('✅ Upload successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Upload OMR sheet error:', error);
        console.error('  - Error message:', error.message);
        console.error('  - Error response:', error.response?.data);
        console.error('  - Error status:', error.response?.status);
        console.error('  - Network error:', error.code);
        throw error;
    }
};

// Process OMR sheet
export const processOMRSheet = async (sheetId, studentId = null, quizId = null) => {
    try {
        const response = await api.post(`/api/omr/process/${sheetId}`, {
            studentId,
            quizId
        });
        return response.data;
    } catch (error) {
        console.error('Process OMR sheet error:', error);
        throw error;
    }
};

// Get instructor's OMR sheets
export const getInstructorSheets = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.courseId) params.append('courseId', filters.courseId);
        if (filters.quizId) params.append('quizId', filters.quizId);

        const response = await api.get(`/api/omr/sheets?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Get instructor sheets error:', error);
        throw error;
    }
};

// Get specific OMR sheet
export const getOMRSheet = async (sheetId) => {
    try {
        const response = await api.get(`/api/omr/sheet/${sheetId}`);
        return response.data;
    } catch (error) {
        console.error('Get OMR sheet error:', error);
        throw error;
    }
};

// Get OMR result
export const getOMRResult = async (sheetId) => {
    try {
        const response = await api.get(`/api/omr/result/${sheetId}`);
        return response.data;
    } catch (error) {
        console.error('Get OMR result error:', error);
        throw error;
    }
};

// Validate OMR result
export const validateOMRResult = async (resultId, answers) => {
    try {
        const response = await api.put(`/api/omr/validate/${resultId}`, { answers });
        return response.data;
    } catch (error) {
        console.error('Validate OMR result error:', error);
        throw error;
    }
};

// Submit OMR result to quiz system
export const submitOMRToQuiz = async (sheetId) => {
    try {
        const response = await api.post(`/api/omr/submit/${sheetId}`);
        return response.data;
    } catch (error) {
        console.error('Submit OMR to quiz error:', error);
        throw error;
    }
};

// Delete OMR sheet
export const deleteOMRSheet = async (sheetId) => {
    try {
        const response = await api.delete(`/api/omr/sheet/${sheetId}`);
        return response.data;
    } catch (error) {
        console.error('Delete OMR sheet error:', error);
        throw error;
    }
};

export default {
    uploadOMRSheet,
    processOMRSheet,
    getInstructorSheets,
    getOMRSheet,
    getOMRResult,
    validateOMRResult,
    submitOMRToQuiz,
    deleteOMRSheet
};
