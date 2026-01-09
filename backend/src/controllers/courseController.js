import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { sendEmail } from '../services/emailService.js';

/**
 * Get all courses
 */
export const getAllCourses = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, instructorId } = req.query;

        const where = {};

        // Only enforce isPublished = true for non-admins (students/instructors viewing public list)
        // However, Instructors might want to see their own drafts? 
        // For now, let's allow Admins to see everything.
        // Admin sees all. Instructors see published + their own drafts. General public/students see only published.
        if (req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
            // No filter, show all
        } else if (req.user && req.user.role === 'INSTRUCTOR') {
            where.OR = [
                { isPublished: true },
                { instructorId: req.user.id }
            ];
        } else {
            where.isPublished = true;
        }

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (instructorId) {
            where.instructorId = instructorId;
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                },
                _count: {
                    select: {
                        modules: true,
                        enrollments: true
                    }
                }
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.course.count({ where });

        res.json({
            courses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

/**
 * Get course by ID
 */
export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                },
                modules: {
                    orderBy: { order: 'asc' }
                },
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        passingScore: true,
                        startDate: true,
                        endDate: true
                    }
                },
                assignments: {
                    select: {
                        id: true,
                        title: true,
                        dueDate: true,
                        points: true
                    }
                },
                enrollments: {
                    select: {
                        id: true,
                        userId: true,
                        enrolledAt: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { enrolledAt: 'desc' }
                },
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ course });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
};

/**
 * Create course
 */
export const createCourse = async (req, res) => {
    try {
        const { title, description, category, thumbnail } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const course = await prisma.course.create({
            data: {
                title,
                description,
                category,
                thumbnail,
                instructorId: req.user.id,
                requiredGrades: req.body.requiredGrades || []
            },
            include: {
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                }
            }
        });

        await createAuditLog(req.auditInfo, course.id, {
            action: 'COURSE_CREATED',
            title: course.title
        });

        res.status(201).json({ course });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Failed to create course' });
    }
};

/**
 * Update course
 */
export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, thumbnail, isPublished, instructorId } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const course = await prisma.course.findUnique({
            where: { id }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check permissions: Must be course instructor or admin
        const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
        const isInstructor = course.instructorId === req.user.id;

        if (!isAdmin && !isInstructor) {
            return res.status(403).json({ error: 'Not authorized to update this course' });
        }

        // Prepare update data
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
        if (isPublished !== undefined) updateData.isPublished = isPublished;
        if (req.body.requiredGrades !== undefined) updateData.requiredGrades = req.body.requiredGrades;

        // Only admin can change instructor
        if (instructorId !== undefined && isAdmin) {
            if (!isValidUUID(instructorId)) {
                return res.status(400).json({ error: 'Invalid instructor ID' });
            }
            updateData.instructorId = instructorId;
        }

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: updateData,
            include: {
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                }
            }
        });
        await createAuditLog(req.auditInfo, id, { action: 'COURSE_UPDATED' });

        res.json({ course: updatedCourse });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
};

/**
 * Delete course
 */
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        await prisma.course.delete({
            where: { id }
        });

        await createAuditLog(req.auditInfo, id, { action: 'COURSE_DELETED' });

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
};

/**
 * Enroll in course
 */
export const enrollInCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        // Fetch course to check grade requirements
        const course = await prisma.course.findUnique({
            where: { id },
            select: { requiredGrades: true, title: true }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check grade requirements
        if (course.requiredGrades && course.requiredGrades.length > 0) {
            const student = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { grade: true }
            });

            if (!student.grade || !course.requiredGrades.includes(student.grade)) {
                const requiredGradesText = course.requiredGrades.join('. veya ') + '. sınıf';
                const studentGradeText = student.grade ? `${student.grade}. sınıf` : 'belirsiz';
                return res.status(403).json({
                    error: `Bu ders ${requiredGradesText} için gereklidir. Sizin sınıf seviyeniz: ${studentGradeText}`
                });
            }
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId: id
                }
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId: req.user.id,
                courseId: id
            },
            include: {
                course: {
                    select: {
                        title: true,
                        description: true,
                        instructor: {
                            select: {
                                fullName: true,
                                username: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        email: true,
                        fullName: true,
                        username: true
                    }
                }
            }
        });

        await createAuditLog(req.auditInfo, id, {
            action: 'COURSE_ENROLLED',
            userId: req.user.id
        });

        // Send enrollment confirmation email
        if (enrollment.user?.email) {
            sendEmail(enrollment.user.email, 'enrollment', {
                userName: enrollment.user.fullName || enrollment.user.username,
                courseName: enrollment.course.title,
                courseDescription: enrollment.course.description,
                instructorName: enrollment.course.instructor?.fullName || enrollment.course.instructor?.username,
                courseId: id
            }).catch(err => console.error('Failed to send enrollment email:', err));
        }

        res.status(201).json({ enrollment });
    } catch (error) {
        console.error('Enroll error:', error);
        res.status(500).json({ error: 'Failed to enroll in course' });
    }
};

/**
 * Add module to course
 */
export const addModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, videoUrl, order } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const module = await prisma.module.create({
            data: {
                courseId: id,
                title,
                content,
                videoUrl,
                order: order || 0
            }
        });

        res.status(201).json({ module });
    } catch (error) {
        console.error('Add module error:', error);
        res.status(500).json({ error: 'Failed to add module' });
    }
};

/**
 * Update module
 */
export const updateModule = async (req, res) => {
    try {
        const { id, moduleId } = req.params;
        const { title, content, videoUrl } = req.body;

        if (!isValidUUID(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID' });
        }

        // Verify module belongs to course
        const existingModule = await prisma.module.findUnique({
            where: { id: moduleId },
            include: { course: true }
        });

        if (!existingModule) {
            return res.status(404).json({ error: 'Module not found' });
        }

        if (existingModule.courseId !== id) {
            return res.status(404).json({ error: 'Module not found in this course' });
        }

        const module = await prisma.module.update({
            where: { id: moduleId },
            data: {
                title,
                content,
                videoUrl
            }
        });

        res.json({ module });
    } catch (error) {
        console.error('Update module error:', error);
        res.status(500).json({ error: 'Failed to update module' });
    }
};

/**
 * Delete module
 */
export const deleteModule = async (req, res) => {
    try {
        const { id, moduleId } = req.params;

        if (!isValidUUID(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID' });
        }

        // Verify module belongs to course
        const existingModule = await prisma.module.findUnique({
            where: { id: moduleId }
        });

        if (!existingModule || existingModule.courseId !== id) {
            return res.status(404).json({ error: 'Module not found' });
        }

        await prisma.module.delete({
            where: { id: moduleId }
        });

        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('Delete module error:', error);
        res.status(500).json({ error: 'Failed to delete module' });
    }
};

/**
 * Reorder modules
 */
export const reorderModules = async (req, res) => {
    try {
        const { id } = req.params;
        const { modules } = req.body; // Array of { id, order }

        if (!Array.isArray(modules)) {
            return res.status(400).json({ error: 'Modules must be an array' });
        }

        // Update each module's order
        await Promise.all(
            modules.map(({ id: moduleId, order }) =>
                prisma.module.update({
                    where: { id: moduleId },
                    data: { order }
                })
            )
        );

        res.json({ message: 'Modules reordered successfully' });
    } catch (error) {
        console.error('Reorder modules error:', error);
        res.status(500).json({ error: 'Failed to reorder modules' });
    }
};

/**
 * Get course enrollments (Instructor/Admin only)
 */
export const getEnrollments = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { enrolledAt: 'desc' }
        });

        res.json({ enrollments });
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
};

/**
 * Get user's enrollments
 */
export const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: req.user.id },
            include: {
                course: {
                    include: {
                        instructor: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true
                            }
                        },
                        _count: {
                            select: {
                                modules: true,
                                quizzes: true
                            }
                        }
                    }
                }
            },
            orderBy: { enrolledAt: 'desc' }
        });

        res.json({ enrollments });
    } catch (error) {
        console.error('Get my enrollments error:', error);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
};
