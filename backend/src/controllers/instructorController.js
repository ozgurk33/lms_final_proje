import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';

/**
 * Instructor: Get my assigned courses
 */
/**
 * Instructor: Get my assigned courses
 */
export const getMyCourses = async (req, res) => {
    try {
        // Fetch courses directly where this user is the instructor
        const courses = await prisma.course.findMany({
            where: { instructorId: req.user.id },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        modules: true
                        // content/quizzes might effectively be modules or separate relations
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ courses });
    } catch (error) {
        console.error('Get my courses error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

/**
 * Instructor: Get all students (with grade filter)
 */
export const getAllStudents = async (req, res) => {
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
 * Instructor: Assign students to course
 */
export const assignStudentsToCourse = async (req, res) => {
    try {
        const { courseId, studentIds } = req.body;

        if (!isValidUUID(courseId) || !Array.isArray(studentIds)) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        // Fetch course with grade requirements
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
                requiredGrades: true
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Allow if user is ADMIN or the assigned instructor
        if (course.instructorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Course not assigned to you' });
        }

        // Check grade requirements if any are set
        if (course.requiredGrades && course.requiredGrades.length > 0) {
            // Fetch students with their grades
            const students = await prisma.user.findMany({
                where: {
                    id: { in: studentIds },
                    role: 'STUDENT'
                },
                select: { id: true, username: true, fullName: true, grade: true }
            });

            // Find students who don't meet grade requirements
            const invalidStudents = students.filter(student =>
                !student.grade || !course.requiredGrades.includes(student.grade)
            );

            if (invalidStudents.length > 0) {
                const names = invalidStudents.map(s => s.fullName || s.username).join(', ');
                const requiredText = course.requiredGrades.join('. veya ') + '. sınıf';
                return res.status(403).json({
                    error: `Bu ders ${requiredText} için gereklidir. Uygun olmayan öğrenciler: ${names}`
                });
            }
        }

        // Bulk create enrollments
        const enrollments = [];
        for (const studentId of studentIds) {
            try {
                const enrollment = await prisma.enrollment.create({
                    data: {
                        userId: studentId,
                        courseId,
                        enrolledBy: req.user.id
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true
                            }
                        }
                    }
                });
                enrollments.push(enrollment);
            } catch (error) {
                if (error.code !== 'P2002') { // Skip if already enrolled
                    throw error;
                }
            }
        }

        res.status(201).json({
            enrollments,
            created: enrollments.length
        });
    } catch (error) {
        console.error('Assign students error:', error);
        res.status(500).json({ error: 'Failed to assign students' });
    }
};

/**
 * Instructor: Get students enrolled in specific course
 */
export const getCourseStudents = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        // Verify instructor has this course
        const assignment = await prisma.courseInstructor.findUnique({
            where: {
                courseId_instructorId: {
                    courseId: id,
                    instructorId: req.user.id
                }
            }
        });

        if (!assignment) {
            return res.status(403).json({ error: 'Course not assigned to you' });
        }

        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        email: true,
                        grade: true
                    }
                },
                assignedBy: {
                    select: {
                        username: true,
                        fullName: true
                    }
                }
            },
            orderBy: { enrolledAt: 'desc' }
        });

        res.json({ enrollments });
    } catch (error) {
        console.error('Get course students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};
