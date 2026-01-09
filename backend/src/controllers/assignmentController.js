import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';
import { createAuditLog } from '../middleware/auditLogger.js';

/**
 * Create assignment
 */
export const createAssignment = async (req, res) => {
    try {
        const { courseId, title, description, dueDate, points } = req.body;

        if (!isValidUUID(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const assignment = await prisma.assignment.create({
            data: {
                courseId,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                points: points || 100
            }
        });

        await createAuditLog(req.auditInfo, assignment.id, {
            action: 'ASSIGNMENT_CREATED',
            courseId,
            title
        });

        res.status(201).json({ assignment });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
};

/**
 * Get course assignments
 */
export const getCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;

        if (!isValidUUID(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        const assignments = await prisma.assignment.findMany({
            where: { courseId },
            include: {
                submissions: {
                    where: { studentId: req.user.id }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Add "isSubmitted" flag for students
        const result = assignments.map(a => ({
            ...a,
            isSubmitted: a.submissions.length > 0,
            grade: a.submissions[0]?.grade
        }));

        res.json({ assignments: result });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

/**
 * Get all assignments for instructor's courses
 */
export const getInstructorAssignments = async (req, res) => {
    try {
        const assignments = await prisma.assignment.findMany({
            where: {
                course: {
                    instructorId: req.user.id
                }
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                _count: {
                    select: {
                        submissions: true
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        const result = await Promise.all(assignments.map(async (a) => {
            // Get total students for course to calculate percentage
            const totalStudents = await prisma.enrollment.count({
                where: { courseId: a.courseId }
            });

            return {
                ...a,
                courseName: a.course.title,
                submissions: a._count.submissions,
                totalStudents
            };
        }));

        res.json({ assignments: result });
    } catch (error) {
        console.error('Get instructor assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        instructorId: true
                    }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // If student, check if submitted
        let submission = null;
        if (req.user.role === 'STUDENT') {
            submission = await prisma.assignmentSubmission.findUnique({
                where: {
                    assignmentId_studentId: {
                        assignmentId: id,
                        studentId: req.user.id
                    }
                }
            });
        }

        res.json({ assignment, submission });
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ error: 'Failed to fetch assignment' });
    }
};

/**
 * Update assignment
 */
export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, points } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }

        const assignment = await prisma.assignment.update({
            where: { id },
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                points
            }
        });

        await createAuditLog(req.auditInfo, id, { action: 'ASSIGNMENT_UPDATED' });

        res.json({ assignment });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ error: 'Failed to update assignment' });
    }
};

/**
 * Delete assignment
 */
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }

        await prisma.assignment.delete({
            where: { id }
        });

        await createAuditLog(req.auditInfo, id, { action: 'ASSIGNMENT_DELETED' });

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
};

/**
 * Submit assignment
 */
export const submitAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, fileUrl } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }

        const submission = await prisma.assignmentSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId: id,
                    studentId: req.user.id
                }
            },
            update: {
                content,
                fileUrl,
                submittedAt: new Date()
            },
            create: {
                assignmentId: id,
                studentId: req.user.id,
                content,
                fileUrl
            }
        });

        await createAuditLog(req.auditInfo, id, {
            action: 'ASSIGNMENT_SUBMITTED',
            submissionId: submission.id
        });

        res.json({ submission });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
};

/**
 * Get all submissions for an assignment (Instructor)
 */
export const getSubmissions = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid assignment ID' });
        }

        const submissions = await prisma.assignmentSubmission.findMany({
            where: { assignmentId: id },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        res.json({ submissions });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

/**
 * Grade submission (Instructor)
 */
export const gradeSubmission = async (req, res) => {
    try {
        const { id, submissionId } = req.params;
        const { grade, feedback } = req.body;

        if (!isValidUUID(submissionId)) {
            return res.status(400).json({ error: 'Invalid submission ID' });
        }

        const submission = await prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                grade: parseFloat(grade),
                feedback
            }
        });

        // Optionally update course grade? (Not implemented here but could be linked to Gradebook)

        await createAuditLog(req.auditInfo, id, {
            action: 'ASSIGNMENT_GRADED',
            submissionId,
            grade
        });

        res.json({ submission });
    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ error: 'Failed to grade submission' });
    }
};
