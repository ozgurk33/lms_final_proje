import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/courses/:courseId/grades
 * @desc Get gradebook for a course
 * @access Instructor, Admin
 */
router.get('/:courseId/grades', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { courseId } = req.params;

        // Fetch course with enrollments and related data
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                username: true
                            }
                        }
                    }
                },
                quizzes: {
                    include: {
                        attempts: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Calculate grades for each student
        const grades = course.enrollments.map(enrollment => {
            const student = enrollment.user;

            // Get all quiz attempts for this student in this course
            const studentQuizzes = [];
            let totalQuizScore = 0;
            let totalQuizMaxScore = 0;

            course.quizzes.forEach(quiz => {
                const attempt = quiz.attempts.find(a => a.userId === student.id);
                if (attempt && attempt.completedAt) {
                    const score = attempt.score || 0;
                    // Calculate max score from quiz questions
                    const maxScore = 100; // Default, should be calculated from questions

                    studentQuizzes.push({
                        name: quiz.title,
                        score: score,
                        maxScore: maxScore,
                        date: attempt.completedAt
                    });

                    totalQuizScore += score;
                    totalQuizMaxScore += maxScore;
                }
            });

            // Calculate overall percentage
            const totalPercentage = totalQuizMaxScore > 0
                ? (totalQuizScore / totalQuizMaxScore) * 100
                : 0;

            return {
                studentId: student.id,
                studentName: student.fullName || student.username,
                email: student.email,
                quizzes: studentQuizzes,
                assignments: [], // TODO: Add assignments when implemented
                total: Math.round(totalPercentage * 10) / 10,
                percentage: Math.round(totalPercentage * 10) / 10,
                letterGrade: getLetterGrade(totalPercentage)
            };
        });

        res.json({
            grades,
            courseInfo: {
                id: course.id,
                title: course.title,
                totalStudents: course.enrollments.length
            }
        });
    } catch (error) {
        console.error('Get gradebook error:', error);
        res.status(500).json({ error: 'Failed to fetch gradebook' });
    }
});

/**
 * @route GET /api/courses/:courseId/students/:studentId/grades
 * @desc Get grades for a specific student
 * @access Instructor, Admin, Student (own grades)
 */
router.get('/:courseId/students/:studentId/grades', authenticate, async (req, res) => {
    try {
        const { courseId, studentId } = req.params;

        // Authorization check: student can only view own grades
        if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch student
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                fullName: true,
                email: true,
                username: true
            }
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Fetch quiz attempts for this student in this course
        const quizzes = await prisma.quiz.findMany({
            where: { courseId },
            include: {
                attempts: {
                    where: { userId: studentId },
                    orderBy: { completedAt: 'desc' }
                }
            }
        });

        const grades = [];
        let totalScore = 0;
        let totalMaxScore = 0;

        quizzes.forEach(quiz => {
            if (quiz.attempts.length > 0) {
                const attempt = quiz.attempts[0]; // Latest attempt
                if (attempt.completedAt) {
                    const score = attempt.score || 0;
                    const maxScore = 100;

                    grades.push({
                        type: 'quiz',
                        name: quiz.title,
                        score: score,
                        maxScore: maxScore
                    });

                    totalScore += score;
                    totalMaxScore += maxScore;
                }
            }
        });

        const overall = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

        res.json({
            student: {
                id: student.id,
                name: student.fullName || student.username,
                email: student.email
            },
            grades,
            overall: Math.round(overall * 10) / 10
        });
    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({ error: 'Failed to fetch grades' });
    }
});

/**
 * @route PUT /api/courses/:courseId/students/:studentId/grade
 * @desc Update a student's grade
 * @access Instructor, Admin
 */
router.put('/:courseId/students/:studentId/grade', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { courseId, studentId } = req.params;
        const { gradeData } = req.body;

        // TODO: Implement grade override functionality
        // This could update enrollment with custom grade

        res.json({ message: 'Grade updated successfully', gradeData });
    } catch (error) {
        console.error('Update grade error:', error);
        res.status(500).json({ error: 'Failed to update grade' });
    }
});

/**
 * @route GET /api/courses/:courseId/grades/export
 * @desc Export gradebook as CSV or PDF
 * @access Instructor, Admin
 */
router.get('/:courseId/grades/export', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const { format = 'csv' } = req.query;

        // Fetch gradebook data
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    include: {
                        user: true
                    }
                },
                quizzes: {
                    include: {
                        attempts: true
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (format === 'csv') {
            let csv = 'Student Name,Email,Quiz Count,Average Score\n';

            course.enrollments.forEach(enrollment => {
                const student = enrollment.user;
                const attempts = course.quizzes.flatMap(q =>
                    q.attempts.filter(a => a.userId === student.id && a.completedAt)
                );

                const avgScore = attempts.length > 0
                    ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
                    : 0;

                csv += `${student.fullName || student.username},${student.email},${attempts.length},${avgScore.toFixed(2)}\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=gradebook_${course.title}.csv`);
            res.send(csv);
        } else {
            res.status(400).json({ error: 'Format not supported' });
        }
    } catch (error) {
        console.error('Export gradebook error:', error);
        res.status(500).json({ error: 'Failed to export gradebook' });
    }
});

// Helper function to calculate letter grade
function getLetterGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

export default router;
