import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    createNote,
    getAllNotes,
    getNoteById,
    updateNote,
    deleteNote,
    getModuleNotes,
    getCourseNotes
} from '../controllers/notesController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all notes (with optional query filters)
router.get('/', getAllNotes);

// Get notes for a specific module
router.get('/module/:moduleId', getModuleNotes);

// Get notes for a specific course
router.get('/course/:courseId', getCourseNotes);

// Create a new note
router.post('/', createNote);

// Get, update, delete a specific note
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
