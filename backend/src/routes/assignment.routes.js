import express from 'express';
import {
    createAssignment,
    getCourseAssignments,
    getInstructorAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissions,
    gradeSubmission
} from '../controllers/assignmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireMinRole } from '../middleware/rbac.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(authenticate);

// List assignments for a course
router.get('/course/:courseId', getCourseAssignments);

// Get all instructor assignments
router.get('/instructor/all', requireMinRole('INSTRUCTOR'), getInstructorAssignments);

// Get specific assignment
router.get('/:id', getAssignmentById);

// Create assignment (Instructor)
router.post('/', requireMinRole('INSTRUCTOR'), writeLimiter, createAssignment);

// Update assignment (Instructor)
router.put('/:id', requireMinRole('INSTRUCTOR'), writeLimiter, updateAssignment);

// Delete assignment (Instructor)
router.delete('/:id', requireMinRole('INSTRUCTOR'), writeLimiter, deleteAssignment);

// Submit assignment (Student)
router.post('/:id/submit', requireRole('STUDENT'), writeLimiter, submitAssignment);

// Get all submissions for an assignment (Instructor)
router.get('/:id/submissions', requireMinRole('INSTRUCTOR'), getSubmissions);

// Grade submission (Instructor)
router.post('/:id/submissions/:submissionId/grade', requireMinRole('INSTRUCTOR'), writeLimiter, gradeSubmission);

export default router;
