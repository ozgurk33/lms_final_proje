import api from './api';

/**
 * Plagiarism Detection Service
 * Checks text similarity against other submissions
 */

/**
 * Calculate Jaccard similarity between two texts
 */
function calculateJaccardSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return (intersection.size / union.size) * 100;
}

/**
 * Calculate cosine similarity between two texts
 */
function calculateCosineSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    // Create word frequency maps
    const freq1 = {};
    const freq2 = {};
    const allWords = new Set([...words1, ...words2]);

    words1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
    words2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);

    // Calculate dot product and magnitudes
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    allWords.forEach(word => {
        const f1 = freq1[word] || 0;
        const f2 = freq2[word] || 0;
        dotProduct += f1 * f2;
        mag1 += f1 * f1;
        mag2 += f2 * f2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;
    return (dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2))) * 100;
}

export const plagiarismService = {
    /**
     * Check plagiarism against other student submissions
     */
    async checkAgainstSubmissions(text, courseId, quizId, questionId) {
        try {
            const response = await api.post('/plagiarism/check', {
                text,
                courseId,
                quizId,
                questionId
            });
            return response.data;
        } catch (error) {
            console.error('Plagiarism check failed:', error);
            throw error;
        }
    },

    /**
     * Client-side similarity check (fallback if API not available)
     */
    async checkSimilarityLocal(text, otherTexts) {
        const matches = otherTexts.map(other => ({
            student: other.studentName || 'Unknown',
            text: other.text,
            jaccardSimilarity: calculateJaccardSimilarity(text, other.text),
            cosineSimilarity: calculateCosineSimilarity(text, other.text)
        }));

        // Average the two similarity scores
        matches.forEach(match => {
            match.similarity = (match.jaccardSimilarity + match.cosineSimilarity) / 2;
        });

        // Filter matches above threshold (40%)
        const significantMatches = matches
            .filter(m => m.similarity > 40)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5); // Top 5 matches

        const maxSimilarity = significantMatches.length > 0
            ? Math.max(...significantMatches.map(m => m.similarity))
            : 0;

        return {
            maxSimilarity,
            matches: significantMatches.map(m => ({
                student: m.student,
                similarity: Math.round(m.similarity * 10) / 10,
                excerpt: m.text.substring(0, 100) + '...'
            })),
            status: maxSimilarity >= 70 ? 'high' : maxSimilarity >= 40 ? 'medium' : 'low'
        };
    },

    /**
     * Get plagiarism report for a student's answer
     */
    async getReport(attemptId, questionId) {
        try {
            const response = await api.get(`/plagiarism/report/${attemptId}/${questionId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get plagiarism report:', error);
            throw error;
        }
    }
};
