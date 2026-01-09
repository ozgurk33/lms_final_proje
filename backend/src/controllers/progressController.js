import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';

/**
 * Save or update content progress
 * POST /api/progress/:moduleId
 */
export const saveProgress = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { contentType, progress, totalDuration, completed, lastPosition } = req.body;

        if (!isValidUUID(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID' });
        }

        // Verify module exists
        const module = await prisma.module.findUnique({
            where: { id: moduleId }
        });

        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Upsert progress (create or update)
        const progressRecord = await prisma.contentProgress.upsert({
            where: {
                userId_moduleId: {
                    userId: req.user.id,
                    moduleId: moduleId
                }
            },
            update: {
                progress,
                totalDuration,
                completed: completed || false,
                lastPosition,
                contentType,
                videoCompleted: req.body.videoCompleted !== undefined ? req.body.videoCompleted : undefined,
                pdfCompleted: req.body.pdfCompleted !== undefined ? req.body.pdfCompleted : undefined,
            },
            create: {
                userId: req.user.id,
                moduleId,
                contentType,
                progress,
                totalDuration,
                completed: completed || false,
                lastPosition,
                videoCompleted: req.body.videoCompleted || false,
                pdfCompleted: req.body.pdfCompleted || false,
            }
        });

        res.json({ progress: progressRecord });
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ error: 'Failed to save progress' });
    }
};

/**
 * Get progress for a specific module
 * GET /api/progress/:moduleId
 */
export const getProgress = async (req, res) => {
    try {
        const { moduleId } = req.params;

        if (!isValidUUID(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID' });
        }

        const progress = await prisma.contentProgress.findUnique({
            where: {
                userId_moduleId: {
                    userId: req.user.id,
                    moduleId: moduleId
                }
            },
            include: {
                module: {
                    select: {
                        title: true,
                        videoUrl: true,
                        pdfUrl: true
                    }
                }
            }
        });

        res.json({ progress });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
};

/**
 * Get all progress for a course
 * GET /api/progress/course/:courseId
 */
export const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;

        if (!isValidUUID(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        // Get all modules for the course
        const modules = await prisma.module.findMany({
            where: { courseId },
            select: { id: true }
        });

        const moduleIds = modules.map(m => m.id);

        // Get progress for all modules
        const progressRecords = await prisma.contentProgress.findMany({
            where: {
                userId: req.user.id,
                moduleId: { in: moduleIds }
            },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        videoUrl: true,
                        pdfUrl: true
                    }
                }
            },
            orderBy: {
                lastAccessedAt: 'desc'
            }
        });

        // Calculate overall course completion percentage
        const totalModules = modules.length;
        const completedModules = progressRecords.filter(p => p.completed).length;
        const completionPercentage = totalModules > 0
            ? Math.round((completedModules / totalModules) * 100)
            : 0;

        res.json({
            progress: progressRecords,
            summary: {
                totalModules,
                completedModules,
                completionPercentage
            }
        });
    } catch (error) {
        console.error('Get course progress error:', error);
        res.status(500).json({ error: 'Failed to fetch course progress' });
    }
};

/**
 * Get user's overall progress across all courses
 * GET /api/progress/my-progress
 */
export const getMyProgress = async (req, res) => {
    try {
        const progressRecords = await prisma.contentProgress.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                lastAccessedAt: 'desc'
            },
            take: 50 // Recent 50 items
        });

        res.json({ progress: progressRecords });
    } catch (error) {
        console.error('Get my progress error:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
};

/**
 * Delete progress for a module (for testing/reset)
 * DELETE /api/progress/:moduleId
 */
export const deleteProgress = async (req, res) => {
    try {
        const { moduleId } = req.params;

        if (!isValidUUID(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID' });
        }

        await prisma.contentProgress.deleteMany({
            where: {
                userId: req.user.id,
                moduleId
            }
        });

        res.json({ message: 'Progress deleted successfully' });
    } catch (error) {
        console.error('Delete progress error:', error);
        res.status(500).json({ error: 'Failed to delete progress' });
    }
};
