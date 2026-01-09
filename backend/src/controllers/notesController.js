import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';

/**
 * Create a new note
 * POST /api/notes
 */
export const createNote = async (req, res) => {
    try {
        const { moduleId, courseId, title, content, timestamp, pageNumber } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Note content is required' });
        }

        // Validate IDs if provided
        if (moduleId && !isValidUUID(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID' });
        }
        if (courseId && !isValidUUID(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const note = await prisma.note.create({
            data: {
                userId: req.user.id,
                moduleId: moduleId || null,
                courseId: courseId || null,
                title,
                content,
                timestamp,
                pageNumber
            },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.status(201).json({ note });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
};

/**
 * Get all notes for the current user
 * GET /api/notes
 */
export const getAllNotes = async (req, res) => {
    try {
        const { moduleId, courseId, search, limit = 50 } = req.query;

        const where = {
            userId: req.user.id
        };

        if (moduleId) {
            if (!isValidUUID(moduleId)) {
                return res.status(400).json({ error: 'Invalid module ID' });
            }
            where.moduleId = moduleId;
        }

        if (courseId) {
            if (!isValidUUID(courseId)) {
                return res.status(400).json({ error: 'Invalid course ID' });
            }
            where.courseId = courseId;
        }

        if (search) {
            where.OR = [
                { content: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } }
            ];
        }

        const notes = await prisma.note.findMany({
            where,
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                        course: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: parseInt(limit)
        });

        res.json({ notes, count: notes.length });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
};

/**
 * Get a single note by ID
 * GET /api/notes/:id
 */
export const getNoteById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const note = await prisma.note.findUnique({
            where: { id },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Ensure user owns the note
        if (note.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view this note' });
        }

        res.json({ note });
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
};

/**
 * Update a note
 * PUT /api/notes/:id
 */
export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, timestamp, pageNumber } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        // Check ownership
        const existingNote = await prisma.note.findUnique({
            where: { id }
        });

        if (!existingNote) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (existingNote.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this note' });
        }

        const note = await prisma.note.update({
            where: { id },
            data: {
                title,
                content,
                timestamp,
                pageNumber
            },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.json({ note });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
};

/**
 * Delete a note
 * DELETE /api/notes/:id
 */
export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        // Check ownership
        const existingNote = await prisma.note.findUnique({
            where: { id }
        });

        if (!existingNote) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (existingNote.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this note' });
        }

        await prisma.note.delete({
            where: { id }
        });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
};

/**
 * Get notes for a specific module
 * GET /api/notes/module/:moduleId
 */
export const getModuleNotes = async (req, res) => {
    try {
        const { moduleId } = req.params;

        if (!isValidUUID(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID' });
        }

        const notes = await prisma.note.findMany({
            where: {
                userId: req.user.id,
                moduleId
            },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true
                    }
                }
            },
            orderBy: [
                { timestamp: 'asc' }, // Video notes by timestamp
                { pageNumber: 'asc' }, // PDF notes by page
                { createdAt: 'desc' } // Others by date
            ]
        });

        res.json({ notes, count: notes.length });
    } catch (error) {
        console.error('Get module notes error:', error);
        res.status(500).json({ error: 'Failed to fetch module notes' });
    }
};

/**
 * Get notes for a specific course
 * GET /api/notes/course/:courseId
 */
export const getCourseNotes = async (req, res) => {
    try {
        const { courseId } = req.params;

        if (!isValidUUID(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const notes = await prisma.note.findMany({
            where: {
                userId: req.user.id,
                OR: [
                    { courseId }, // Direct course notes
                    {
                        module: {
                            courseId // Module notes in this course
                        }
                    }
                ]
            },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ notes, count: notes.length });
    } catch (error) {
        console.error('Get course notes error:', error);
        res.status(500).json({ error: 'Failed to fetch course notes' });
    }
};
