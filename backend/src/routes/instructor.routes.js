import express from 'express';
import {
    getMyCourses,
    getAllStudents,
    assignStudentsToCourse,
    getCourseStudents
} from '../controllers/instructorController.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);
router.use(requireMinRole('INSTRUCTOR'));

// Instructor courses
router.get('/my-courses', getMyCourses);

// Student management
router.get('/students', getAllStudents);
router.post('/assign-students', writeLimiter, assignStudentsToCourse);
router.get('/course/:id/students', getCourseStudents);

export default router;
