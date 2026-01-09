import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { gradeQuiz } from '../services/autoGrading.js';
import { sendEmail } from '../services/emailService.js';
import { generateSEBFile } from '../services/sebConfigGenerator.js';

/**
 * Get all quizzes
 */
export const getAllQuizzes = async (req, res) => {
    try {
        const { page = 1, limit = 20, courseId } = req.query;

        const where = { isPublished: true };

        if (courseId) {
            where.courseId = courseId;
        }

        if (req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR' && req.user.role !== 'SUPER_ADMIN') {
            const enrollments = await prisma.enrollment.findMany({
                where: { userId: req.user.id },
                select: { courseId: true }
            });
            const enrolledCourseIds = enrollments.map(e => e.courseId);

            // Add enrollment filter to where clause
            where.courseId = { in: enrolledCourseIds };
        }

        const quizzes = await prisma.quiz.findMany({
            where,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.quiz.count({ where });

        res.json({
            quizzes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
};

/**
 * Get quiz by ID
 */
export const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid quiz ID' });
        }

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Check access rights
        if (req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR' && req.user.role !== 'SUPER_ADMIN') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: req.user.id,
                        courseId: quiz.courseId
                    }
                }
            });

            if (!enrollment) {
                return res.status(403).json({ error: 'You must be enrolled in the course to view this quiz' });
            }
        }

        // Don't include questions yet (will be loaded on attempt)
        res.json({ quiz });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
};

/**
 * Create quiz
 */
export const createQuiz = async (req, res) => {
    try {
        console.log('Received create quiz request body:', JSON.stringify(req.body, null, 2));

        const {
            title,
            description,
            courseId,
            duration,
            passingScore,
            questions,
            startDate,
            endDate,
            requireSEB
        } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        console.log('Creating quiz with data:', { title, courseId, duration, passingScore, questionCount: questions?.length, startDate, endDate });

        const result = await prisma.$transaction(async (prisma) => {
            const quiz = await prisma.quiz.create({
                data: {
                    title,
                    description,
                    courseId: courseId || null,
                    duration: duration ? parseInt(duration) : 30,
                    passingScore: passingScore ? parseFloat(passingScore) : 60,
                    requireSEB: requireSEB ?? false,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    isPublished: true
                }
            });

            // Add questions if provided
            if (questions && questions.length > 0) {
                await prisma.question.createMany({
                    data: questions.map((q, index) => ({
                        quizId: quiz.id,
                        type: q.type === 'OPEN_ENDED' ? 'LONG_ANSWER' : q.type, // Map OPEN_ENDED to valid Schema type
                        content: q.content,
                        options: q.options || null,
                        correctAnswer: q.correctAnswer,
                        points: q.points ? parseInt(q.points) : 1, // Ensure points are integers
                        order: q.order !== undefined ? q.order : index
                    }))
                });
            }

            return quiz;
        });

        await createAuditLog(req.auditInfo, result.id, {
            action: 'QUIZ_CREATED',
            title: result.title
        });

        res.status(201).json({ quiz: result });
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ error: 'Failed to create quiz', details: error.message });
    }
};

/**
 * Start quiz attempt
 */
export const startQuizAttempt = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid quiz ID' });
        }

        // Get quiz with questions
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        type: true,
                        content: true,
                        options: true,
                        points: true,
                        order: true
                    }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Check SEB requirement
        if (quiz.requireSEB && process.env.REQUIRE_SEB === 'true') {
            const isSEB = req.isSEBBrowser;
            if (!isSEB) {
                return res.status(403).json({
                    error: 'Safe Exam Browser required',
                    message: 'This quiz requires Safe Exam Browser. Please download the SEB config file to start.',
                    sebRequired: true
                });
            }
        }

        // Randomize questions if enabled
        let questions = [...quiz.questions];
        if (quiz.shuffleQuestions) {
            // Fisher-Yates shuffle algorithm
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }
        }

        // Check enrollment for students
        if (req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR' && req.user.role !== 'SUPER_ADMIN') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: req.user.id,
                        courseId: quiz.courseId
                    }
                }
            });

            if (!enrollment) {
                return res.status(403).json({ error: 'You must be enrolled in the course to take this quiz' });
            }

            // Check if already completed
            const existingAttempt = await prisma.quizAttempt.findFirst({
                where: {
                    quizId: id,
                    userId: req.user.id,
                    completedAt: { not: null }
                }
            });

            if (existingAttempt) {
                return res.status(403).json({
                    error: 'You have already completed this quiz.',
                    redirect: `/student/quiz-history`
                });
            }
        }

        // Create attempt
        const attempt = await prisma.quizAttempt.create({
            data: {
                quizId: id,
                userId: req.user.id,
                answers: {}
            }
        });

        res.json({
            attempt,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                duration: quiz.duration,
                shuffleQuestions: quiz.shuffleQuestions,
                questions: questions.map(q => ({
                    ...q,
                    type: q.type === 'LONG_ANSWER' ? 'OPEN_ENDED' : q.type
                }))
            }
        });
    } catch (error) {
        console.error('Start quiz error:', error);
        res.status(500).json({ error: 'Failed to start quiz' });
    }
};

/**
 * Submit quiz
 */
export const submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { attemptId, answers } = req.body;

        if (!isValidUUID(id) || !isValidUUID(attemptId)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        // Get quiz with questions
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Grade quiz
        const { totalScore, results } = gradeQuiz(quiz.questions, answers);

        // Calculate percentage
        // Calculate percentage
        const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
        let percentage = 0;
        if (maxScore > 0) {
            percentage = (totalScore / maxScore) * 100;
        }
        const isPassed = percentage >= quiz.passingScore;

        // Update attempt
        const attempt = await prisma.quizAttempt.update({
            where: { id: attemptId },
            data: {
                answers,
                score: percentage,
                isPassed,
                completedAt: new Date()
            },
            include: {
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
            action: 'QUIZ_SUBMITTED',
            attemptId,
            score: percentage
        });

        // Send email notification to student
        if (attempt.user?.email) {
            // Get number of attempts for this quiz
            const attemptCount = await prisma.quizAttempt.count({
                where: {
                    quizId: id,
                    userId: req.user.id,
                    completedAt: { not: null }
                }
            });

            sendEmail(attempt.user.email, 'quizResult', {
                userName: attempt.user.fullName || attempt.user.username,
                quizTitle: quiz.title,
                score: percentage.toFixed(2),
                passingScore: quiz.passingScore,
                isPassed,
                quizId: id,
                attempt: attemptCount
            }).catch(err => console.error('Failed to send quiz result email:', err));
        }

        res.json({
            attempt,
            results,
            totalScore,
            maxScore,
            percentage,
            isPassed
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
};

/**
 * Get questions for a quiz (for instructors/admins to view)
 */
export const getQuestions = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid quiz ID' });
        }

        // Only Admins and Instructors can view all questions directly
        if (req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to view questions' });
        }

        const questions = await prisma.question.findMany({
            where: { quizId: id },
            orderBy: { order: 'asc' }
        });

        const mappedQuestions = questions.map(q => ({
            ...q,
            type: q.type === 'LONG_ANSWER' ? 'OPEN_ENDED' : q.type
        }));

        res.json({ questions: mappedQuestions });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
};

/**
 * Get detailed attempt results (re-calculated)
 */
export const getQuizAttemptDetails = async (req, res) => {
    try {
        const { id, attemptId } = req.params;

        if (!isValidUUID(id) || !isValidUUID(attemptId)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        // Get quiz with questions
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: attemptId }
        });

        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found' });
        }

        // Ensure user owns attempt (or is instructor/admin)
        if (attempt.userId !== req.user.id && req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Re-grade quiz to get detailed breakdown
        const { totalScore, results } = gradeQuiz(quiz.questions, attempt.answers);

        // Map undefined answers to null/neutral for display safety
        const safeResults = results.map(r => ({
            ...r,
            userAnswer: r.userAnswer ?? null
        }));

        res.json({
            attempt,
            results: safeResults,
            totalScore,
            maxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
            percentage: attempt.score,
            isPassed: attempt.isPassed
        });
    } catch (error) {
        console.error('Get attempt details error:', error);
        res.status(500).json({ error: 'Failed to fetch attempt details' });
    }
};

/**
 * Get quiz results
 */
export const getQuizResults = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid quiz ID' });
        }

        const attempts = await prisma.quizAttempt.findMany({
            where: {
                quizId: id,
                userId: req.user.id,
                completedAt: { not: null }
            },
            orderBy: { completedAt: 'desc' }
        });

        res.json({ attempts });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
};

/**
 * Get SEB configuration file for a quiz
 * Downloads .seb file that opens quiz in Safe Exam Browser
 */
export const getSEBConfig = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            return res.status(400).json({ error: 'Invalid quiz ID' });
        }

        // Get quiz details
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                duration: true,
                courseId: true,
                requireSEB: true,
            },
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Only generate SEB config for quizzes that require it
        if (!quiz.requireSEB) {
            return res.status(400).json({
                error: 'This quiz does not require Safe Exam Browser',
                message: 'SEB configuration is only available for quizzes that require SEB.'
            });
        }

        // Check if user has access to this quiz
        if (req.user.role === 'STUDENT' || req.user.role === 'GUEST') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: req.user.id,
                        courseId: quiz.courseId,
                    },
                },
            });

            if (!enrollment) {
                return res.status(403).json({ error: 'You must be enrolled in the course to access this quiz' });
            }
        }

        // Generate SEB config file with user's token for auto-login
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const userToken = req.headers.authorization?.replace('Bearer ', '') || null;
        const sebConfig = generateSEBFile(quiz, frontendUrl, userToken);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/seb');
        res.setHeader('Content-Disposition', `attachment; filename="${quiz.title.replace(/[^a-z0-9]/gi, '_')}_SEB.seb"`);

        // Send file
        res.send(sebConfig);

        console.log(`✅ SEB Config generated for quiz: ${quiz.title}`);
    } catch (error) {
        console.error('Get SEB config error:', error);
        res.status(500).json({ error: 'Failed to generate SEB configuration' });
    }
};
