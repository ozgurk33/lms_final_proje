import express from 'express';
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
    getEnrollments,
    getMyEnrollments
} from '../controllers/courseController.js';
import { authenticate, authenticateOptional } from '../middleware/auth.js';
import { requireRole, requireMinRole } from '../middleware/rbac.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/auditLogger.js';

const router = express.Router();

// Public routes (with optional auth for Admins to see unpublished courses)
router.get('/', authenticateOptional, getAllCourses);
router.get('/:id', getCourseById);

// Protected routes
router.use(authenticate);

// Get my enrollments
router.get('/enrollments/my', getMyEnrollments);

// Course management (Instructor+)
router.post('/', requireMinRole('INSTRUCTOR'), writeLimiter, auditLog('CREATE_COURSE', 'COURSE'), createCourse);
router.put('/:id', requireMinRole('INSTRUCTOR'), writeLimiter, updateCourse);
router.delete('/:id', requireMinRole('INSTRUCTOR'), writeLimiter, deleteCourse);

// Enrollment
router.post('/:id/enroll', writeLimiter, enrollInCourse);

// Get course enrollments (Instructor+)
router.get('/:id/enrollments', requireMinRole('INSTRUCTOR'), getEnrollments);

// Module management
router.post('/:id/modules', requireMinRole('INSTRUCTOR'), writeLimiter, addModule);
router.put('/:id/modules/reorder', requireMinRole('INSTRUCTOR'), writeLimiter, reorderModules);
router.put('/:id/modules/:moduleId', requireMinRole('INSTRUCTOR'), writeLimiter, updateModule);
router.delete('/:id/modules/:moduleId', requireMinRole('INSTRUCTOR'), writeLimiter, deleteModule);

export default router;

