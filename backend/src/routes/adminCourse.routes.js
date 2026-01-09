import express from 'express';
import {
    assignCourseToInstructor,
    getInstructors,
    getStudents,
    getCourseAssignments
} from '../controllers/adminCourseController.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(authenticate);
router.use(requireMinRole('ADMIN'));

// Course assignment
router.post('/assign-course', writeLimiter, auditLog, assignCourseToInstructor);
router.get('/course-assignments', getCourseAssignments);

// User lists
router.get('/instructors', getInstructors);
router.get('/students', getStudents);

export default router;
