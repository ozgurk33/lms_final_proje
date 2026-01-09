import express from 'express';
import { createRequire } from 'module';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const require = createRequire(import.meta.url);
const omrController = require('../controllers/omr.controller.cjs');

const router = express.Router();

// Live frame processing endpoint (no auth required for mobile demo)
router.post('/process-frame-live', omrController.processFrameLive);

// Save image for manual processing (no auth required for mobile demo)
router.post('/save-for-manual', omrController.saveForManualProcess);

// All other OMR routes require authentication and instructor role
router.use(authenticate);
router.use(requireRole('INSTRUCTOR', 'ADMIN'));

// Upload OMR sheet image
router.post('/upload', omrController.uploadOMRSheet);

// Process OMR sheet
router.post('/process/:sheetId', omrController.processOMRSheet);

// Get instructor's OMR sheets
router.get('/sheets', omrController.getInstructorSheets);

// Get specific OMR sheet
router.get('/sheet/:id', omrController.getOMRSheet);

// Get OMR result
router.get('/result/:sheetId', omrController.getOMRResult);

// Validate OMR result
router.put('/validate/:resultId', omrController.validateOMRResult);

// Submit OMR result to quiz system
router.post('/submit/:sheetId', authenticate, requireRole('INSTRUCTOR', 'ADMIN'), omrController.submitOMRToQuiz);

// Delete OMR sheet
router.delete('/sheet/:id', authenticate, requireRole('INSTRUCTOR', 'ADMIN'), omrController.deleteOMRSheet);

// Debug endpoints (MOCK MODE)
router.get('/debug/stats', omrController.getMockStats);
router.post('/debug/reset', omrController.resetMockStorage);

export default router;
