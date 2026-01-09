import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import { validatePassword } from '../utils/passwordPolicy.js';
import { isValidEmail, isValidUUID } from '../utils/validators.js';
import { createAuditLog } from '../middleware/auditLogger.js';

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, search } = req.query;

        const where = {};

        if (role) {
            where.role = role;
        }

        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } }
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
                isActive: true,
                createdAt: true,
                lastLogin: true
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.user.count({ where });

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLogin: true,
                twoFactorEnabled: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

/**
 * Create new user (Admin only)
 */
export const createUser = async (req, res) => {
    try {
        const { username, email, password, fullName, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                error: 'Password does not meet requirements',
                details: passwordValidation.errors
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                fullName,
                role: role || 'STUDENT'
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true
            }
        });

        await createAuditLog(req.auditInfo, user.id, { action: 'USER_CREATED', createdBy: req.user.id });

        res.status(201).json({ user });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

/**
 * Update user
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const data = {};
        if (fullName) data.fullName = fullName;
        if (email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            data.email = email;
        }

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                updatedAt: true
            }
        });

        await createAuditLog(req.auditInfo, id, { action: 'USER_UPDATED', updatedBy: req.user.id });

        res.json({ user });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        await createAuditLog(req.auditInfo, id, { action: 'USER_DELETED', deletedBy: req.user.id });

        res.json({ message: 'User deactivated successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

/**
 * Change user role (Super Admin only)
 */
export const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const validRoles = ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'ASSISTANT', 'STUDENT', 'GUEST'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true
            }
        });

        await createAuditLog(req.auditInfo, id, {
            action: 'USER_ROLE_CHANGED',
            newRole: role,
            changedBy: req.user.id
        });

        res.json({ user });

    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ error: 'Failed to change user role' });
    }
};
