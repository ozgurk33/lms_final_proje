import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';

/**
 * Get audit logs (Admin only)
 */
export const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;

        const where = {};

        if (action) {
            where.action = action;
        }

        if (userId && isValidUUID(userId)) {
            where.userId = userId;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit)
        });

        const total = await prisma.auditLog.count({ where });

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

/**
 * Get system stats (Admin only)
 */
export const getStats = async (req, res) => {
    try {
        const [
            userCount,
            courseCount,
            quizCount,
            enrollmentCount,
            usersByRole
        ] = await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.course.count(),
            prisma.quiz.count(),
            prisma.enrollment.count(),
            prisma.user.groupBy({
                by: ['role'],
                _count: true,
                where: { isActive: true }
            })
        ]);

        res.json({
            stats: {
                totalUsers: userCount,
                totalCourses: courseCount,
                totalQuizzes: quizCount,
                totalEnrollments: enrollmentCount,
                usersByRole: usersByRole.reduce((acc, item) => {
                    acc[item.role] = item._count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

/**
 * Get all users with stats (Admin only)
 */
export const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        const where = {};

        if (role) {
            where.role = role;
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } }
            ];
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                grade: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        enrollments: true,
                        coursesAssigned: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Get statistics for admin dashboard (mobile app compatible)
 */
export const getStatistics = async (req, res) => {
    try {
        const [
            totalUsers,
            totalCourses,
            totalEnrollments
        ] = await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.course.count(),
            prisma.enrollment.count()
        ]);

        res.json({
            totalUsers,
            totalCourses,
            totalEnrollments
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!isValidUUID(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Prevent deleting own account
        if (userId === req.user.id) {
            return res.status(403).json({ error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
