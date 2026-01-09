import express from 'express';
import {
    register,
    login,
    googleAuth,
    setup2FA,
    verify2FA,
    login2FA,
    refreshTokenHandler,
    logout
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/auditLogger.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, auditLog('REGISTER', 'USER'), register);
router.post('/login', authLimiter, auditLog('LOGIN', 'USER'), login);
router.post('/google', authLimiter, auditLog('GOOGLE_AUTH', 'USER'), googleAuth);
router.post('/refresh', refreshTokenHandler);

// Protected routes (requires authentication)
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, auditLog('2FA_VERIFY', 'USER'), verify2FA);
router.post('/2fa/login', authenticate, auditLog('2FA_LOGIN', 'USER'), login2FA);
router.post('/logout', authenticate, auditLog('LOGOUT', 'USER'), logout);

export default router;
