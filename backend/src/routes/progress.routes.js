import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    saveProgress,
    getProgress,
    getCourseProgress,
    getMyProgress,
    deleteProgress
} from '../controllers/progressController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Save or update progress for a module
router.post('/:moduleId', saveProgress);

// Get progress for a specific module
router.get('/:moduleId', getProgress);

// Get all progress for a course
router.get('/course/:courseId', getCourseProgress);

// Get user's overall progress
router.get('/my-progress', getMyProgress);

// Delete progress (for testing/reset)
router.delete('/:moduleId', deleteProgress);

export default router;
