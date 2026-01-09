import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changeUserRole
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireMinRole, requireOwnerOrAdmin } from '../middleware/rbac.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/auditLogger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (Admin+)
router.get('/', requireMinRole('ADMIN'), getAllUsers);

// Get user by ID
router.get('/:id', requireOwnerOrAdmin(req => req.params.id), getUserById);

// Create user (Admin+)
router.post('/', requireMinRole('ADMIN'), writeLimiter, auditLog('CREATE_USER', 'USER'), createUser);

// Update user
router.put('/:id', requireOwnerOrAdmin(req => req.params.id), writeLimiter, auditLog('UPDATE_USER', 'USER'), updateUser);

// Delete user (Admin+)
router.delete('/:id', requireMinRole('ADMIN'), auditLog('DELETE_USER', 'USER'), deleteUser);

// Change user role (Super Admin only)
router.put('/:id/role', requireRole('SUPER_ADMIN'), auditLog('CHANGE_ROLE', 'USER'), changeUserRole);

export default router;
