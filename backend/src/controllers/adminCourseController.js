import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';

/**
 * Admin: Assign course to instructor
 */
export const assignCourseToInstructor = async (req, res) => {
    console.log('Backend: assignCourseToInstructor called with body:', req.body);
    try {
        const { courseId, instructorId } = req.body;

        if (!isValidUUID(courseId) || !isValidUUID(instructorId)) {
            return res.status(400).json({ error: 'Invalid IDs' });
        }

        // Verify instructor role
        const instructor = await prisma.user.findUnique({
            where: { id: instructorId }
        });

        if (!instructor || !['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(instructor.role)) {
            return res.status(400).json({ error: 'User is not an instructor' });
        }

        // Create assignment (Simpler approach: Just update the Course model)
        // Since the relationship is defined on Course model (instructorId), 
        // updating this field automatically handles the reassignment.
        await prisma.course.update({
            where: { id: courseId },
            data: { instructorId: instructorId }
        });

        // If we really need the CourseInstructor join table for history or M:N support in future,
        // we can keep it, but for 1-to-1 strict assignment, updating course.instructorId is enough.
        // Let's sync the CourseInstructor table just in case it's used elsewhere.
        await prisma.$transaction(async (tx) => {
            // 1. Delete old assignments
            await tx.courseInstructor.deleteMany({
                where: { courseId }
            });

            // 2. Create new assignment
            await tx.courseInstructor.create({
                data: {
                    courseId,
                    instructorId
                }
            });
        });

        res.status(201).json({ message: 'Course assigned successfully' });
    } catch (error) {
        console.error('Assign course error:', error);
        res.status(500).json({ error: 'Failed to assign course' });
    }
};

/**
 * Admin: Get all instructors
 */
export const getInstructors = async (req, res) => {
    try {
        const instructors = await prisma.user.findMany({
            where: {
                role: {
                    in: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']
                },
                isActive: true
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                role: true,
                _count: {
                    select: {
                        coursesAssigned: true
                    }
                }
            },
            orderBy: { fullName: 'asc' }
        });

        res.json({ instructors });
    } catch (error) {
        console.error('Get instructors error:', error);
        res.status(500).json({ error: 'Failed to fetch instructors' });
    }
};

/**
 * Admin: Get all students with grade
 */
export const getStudents = async (req, res) => {
    try {
        const { grade } = req.query;

        const where = {
            role: 'STUDENT',
            isActive: true
        };

        if (grade) {
            where.grade = parseInt(grade);
        }

        const students = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                grade: true,
                _count: {
                    select: {
                        enrollments: true
                    }
                }
            },
            orderBy: [
                { grade: 'asc' },
                { fullName: 'asc' }
            ]
        });

        res.json({ students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

/**
 * Admin: Get course assignments
 */
export const getCourseAssignments = async (req, res) => {
    try {
        const assignments = await prisma.courseInstructor.findMany({
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        category: true
                    }
                },
                instructor: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true
                    }
                }
            },
            orderBy: { assignedAt: 'desc' }
        });

        res.json({ assignments });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};
