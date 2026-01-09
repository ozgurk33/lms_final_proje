import express from 'express';
import { getAuditLogs, getStats, getAllUsers, getStatistics, deleteUser } from '../controllers/adminController.js';
import { getAllCourses } from '../controllers/courseController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { assignCourseToInstructor as assignCourse } from '../controllers/adminCourseController.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

// Get audit logs
router.get('/logs', getAuditLogs);

// Get system stats (legacy)
router.get('/stats', getStats);

// Get statistics for admin dashboard
router.get('/statistics', getStatistics);

// Get all users
router.get('/users', getAllUsers);

// Delete user
router.delete('/users/:userId', deleteUser);

// Get all courses (admin view)
router.get('/courses', getAllCourses);

// Assign course to instructor
router.post('/courses/assign-course', assignCourse);

export default router;
