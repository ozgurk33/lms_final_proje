import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = express.Router();

/**
 * Calculate text similarity using Jaccard index
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
 * @route POST /api/plagiarism/check
 * @desc Check plagiarism against other student submissions
 * @access Instructor, Admin
 */
router.post('/check', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { text, courseId, quizId, questionId } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // TODO: Fetch other student answers from database
        // const otherAnswers = await QuizAttempt.find({ course Id, quizId, questionId });

        // Mock data for now
        const mockAnswers = [
            {
                studentName: 'Student A',
                text: 'This is a sample answer that talks about photosynthesis and how plants convert light energy.'
            },
            {
                studentName: 'Student B',
                text: 'Photosynthesis is the process by which plants make their own food using sunlight.'
            }
        ];

        const matches = mockAnswers.map(answer => ({
            student: answer.studentName,
            similarity: calculateJaccardSimilarity(text, answer.text),
            excerpt: answer.text.substring(0, 100) + '...'
        })).filter(m => m.similarity > 40).sort((a, b) => b.similarity - a.similarity);

        const maxSimilarity = matches.length > 0 ? Math.max(...matches.map(m => m.similarity)) : 0;
        const status = maxSimilarity >= 70 ? 'high' : maxSimilarity >= 40 ? 'medium' : 'low';

        res.json({
            maxSimilarity: Math.round(maxSimilarity * 10) / 10,
            matches: matches.slice(0, 5), // Top 5 matches
            status,
            checkedAt: new Date()
        });
    } catch (error) {
        console.error('Plagiarism check error:', error);
        res.status(500).json({ error: 'Failed to check plagiarism' });
    }
});

/**
 * @route GET /api/plagiarism/report/:attemptId/:questionId
 * @desc Get plagiarism report for a specific answer
 * @access Instructor, Admin
 */
router.get('/report/:attemptId/:questionId', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { attemptId, questionId } = req.params;

        // TODO: Fetch stored plagiarism report from database

        const mockReport = {
            attemptId,
            questionId,
            maxSimilarity: 35,
            status: 'low',
            matches: [],
            checkedAt: new Date()
        };

        res.json(mockReport);
    } catch (error) {
        console.error('Get plagiarism report error:', error);
        res.status(500).json({ error: 'Failed to fetch plagiarism report' });
    }
});

/**
 * @route POST /api/plagiarism/batch-check
 * @desc Batch check plagiarism for all answers in a quiz
 * @access Instructor, Admin
 */
router.post('/batch-check', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { quizId, questionId } = req.body;

        // TODO: Fetch all answers and run plagiarism check

        res.json({
            message: 'Batch plagiarism check started',
            quizId,
            questionId,
            status: 'processing'
        });
    } catch (error) {
        console.error('Batch plagiarism check error:', error);
        res.status(500).json({ error: 'Failed to start batch check' });
    }
});

export default router;
