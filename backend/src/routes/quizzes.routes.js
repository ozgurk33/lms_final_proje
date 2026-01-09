import express from 'express';
import {
    getAllQuizzes,
    getQuizById,
    createQuiz,
    startQuizAttempt,
    submitQuiz,
    getQuizResults,
    getQuizAttemptDetails,
    getQuestions,
    getSEBConfig
} from '../controllers/quizController.js';
import {
    createOMRQuiz,
    getOMRQuizzes,
    gradeOMRSheet
} from '../controllers/omrQuizController.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/auditLogger.js';
import { checkSEB } from '../middleware/sebChecker.js';

const router = express.Router();

// Protected routes
router.use(authenticate);

// OMR Quiz Routes (INSTRUCTOR+)
router.post('/omr/create', requireMinRole('INSTRUCTOR'), writeLimiter, auditLog('CREATE_OMR_QUIZ', 'QUIZ'), createOMRQuiz);
router.get('/omr/list', requireMinRole('INSTRUCTOR'), getOMRQuizzes);
router.post('/omr/grade', requireMinRole('INSTRUCTOR'), auditLog('GRADE_OMR_SHEET', 'QUIZ_ATTEMPT'), gradeOMRSheet);

// Read routes
router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);

// Create quiz (INSTRUCTOR+)
router.post('/', requireMinRole('INSTRUCTOR'), writeLimiter, auditLog('CREATE_QUIZ', 'QUIZ'), createQuiz);

// Start quiz attempt - with SEB check
router.post('/:id/start', checkSEB, startQuizAttempt);

// Submit quiz - with SEB check
router.post('/:id/submit', checkSEB, auditLog('SUBMIT_QUIZ', 'QUIZ_ATTEMPT'), submitQuiz);

// Get results
router.get('/:id/attempts/:attemptId', authenticate, getQuizAttemptDetails);
router.get('/:id/results', authenticate, getQuizResults);
router.get('/:id/questions', authenticate, getQuestions);

// SEB (Safe Exam Browser) config download
router.get('/:id/seb-config', authenticate, getSEBConfig);

export default router;
