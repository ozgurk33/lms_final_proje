import prisma from '../config/database.js';
import { isValidUUID } from '../utils/validators.js';
import { createAuditLog } from '../middleware/auditLogger.js';

/**
 * Create OMR Quiz
 * Creates a quiz with 10 MULTIPLE_CHOICE questions
 * Each question has options A,B,C,D with a specified correct answer
 */
export const createOMRQuiz = async (req, res) => {
    try {
        const {
            title,
            description,
            courseId,
            duration,
            passingScore,
            correctAnswers  // Array of 10 correct answers: ["A", "B", "C", "D", ...]
        } = req.body;

        // Validation
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required for OMR quiz' });
        }

        if (!correctAnswers || !Array.isArray(correctAnswers) || correctAnswers.length !== 10) {
            return res.status(400).json({
                error: 'Correct answers array is required with exactly 10 elements'
            });
        }

        // Validate each answer is A, B, C, or D
        const validOptions = ['A', 'B', 'C', 'D'];
        const invalidAnswers = correctAnswers.filter(ans => !validOptions.includes(ans));
        if (invalidAnswers.length > 0) {
            return res.status(400).json({
                error: 'All correct answers must be A, B, C, or D',
                invalidAnswers
            });
        }

        console.log('Creating OMR quiz:', { title, courseId, correctAnswers });

        // Create quiz and questions in transaction
        const result = await prisma.$transaction(async (prisma) => {
            // Create quiz
            const quiz = await prisma.quiz.create({
                data: {
                    title,
                    description: description || `Optik okuma sınavı - ${title}`,
                    courseId,
                    duration: duration ? parseInt(duration) : 30,
                    passingScore: passingScore ? parseFloat(passingScore) : 60,
                    isOMR: true,  // Mark as OMR quiz
                    isPublished: false,  // Hidden from students (optical exam on paper)
                    requireSEB: false,  // OMR quizzes don't need SEB
                    shuffleQuestions: false  // Fixed question order
                }
            });

            // Create 10 MULTIPLE_CHOICE questions
            const omrQuestions = correctAnswers.map((answer, index) => ({
                quizId: quiz.id,
                type: 'MULTIPLE_CHOICE',
                content: `Soru ${index + 1}`,  // Question text
                options: JSON.stringify(['A', 'B', 'C', 'D']),  // Options
                correctAnswer: JSON.stringify(answer),  // Correct answer
                points: 10,  // 10 points each (100 total)
                order: index
            }));

            await prisma.question.createMany({
                data: omrQuestions
            });

            return quiz;
        });

        await createAuditLog(req.auditInfo, result.id, {
            action: 'OMR_QUIZ_CREATED',
            title: result.title,
            courseId
        });

        console.log(`✅ OMR Quiz created: ${result.id}`);

        res.status(201).json({
            quiz: result,
            message: 'OMR quiz created successfully'
        });
    } catch (error) {
        console.error('Create OMR quiz error:', error);
        res.status(500).json({ error: 'Failed to create OMR quiz', details: error.message });
    }
};

/**
 * Get OMR quizzes for an instructor
 */
export const getOMRQuizzes = async (req, res) => {
    try {
        const { courseId } = req.query;

        const where = { isOMR: true };

        // Filter by course if provided
        if (courseId) {
            where.courseId = courseId;
        }

        // Instructors see only their course quizzes
        if (req.user.role === 'INSTRUCTOR') {
            const instructorCourses = await prisma.course.findMany({
                where: { instructorId: req.user.id },
                select: { id: true }
            });
            const courseIds = instructorCourses.map(c => c.id);
            where.courseId = { in: courseIds };
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
                        questions: true,
                        attempts: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ quizzes });
    } catch (error) {
        console.error('Get OMR quizzes error:', error);
        res.status(500).json({ error: 'Failed to fetch OMR quizzes' });
    }
};

/**
 * Grade OMR sheet (called after processing)
 * Compares student answers with correct answers and creates QuizAttempt
 */
export const gradeOMRSheet = async (req, res) => {
    try {
        const { quizId, studentId, answers } = req.body;

        // Validation
        if (!isValidUUID(quizId) || !isValidUUID(studentId)) {
            return res.status(400).json({ error: 'Invalid IDs' });
        }

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'Answers object is required' });
        }

        // Get quiz with questions
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        if (!quiz.isOMR) {
            return res.status(400).json({ error: 'This is not an OMR quiz' });
        }

        // Grade answers
        let totalScore = 0;
        const results = {};
        const detailedResults = [];

        quiz.questions.forEach((question, index) => {
            const questionNumber = (index + 1).toString();
            const studentAnswer = answers[questionNumber];
            const correctAnswer = JSON.parse(question.correctAnswer);

            const isCorrect = studentAnswer === correctAnswer;

            results[questionNumber] = {
                studentAnswer: studentAnswer || null,
                correctAnswer,
                isCorrect,
                points: isCorrect ? question.points : 0
            };

            detailedResults.push({
                questionId: question.id,
                questionNumber: index + 1,
                studentAnswer: studentAnswer || null,
                correctAnswer,
                isCorrect,
                points: isCorrect ? question.points : 0
            });

            if (isCorrect) {
                totalScore += question.points;
            }
        });

        // Calculate percentage
        const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const isPassed = percentage >= quiz.passingScore;

        // Create QuizAttempt
        const attempt = await prisma.quizAttempt.create({
            data: {
                quizId,
                userId: studentId,
                answers: results,
                score: percentage,
                isPassed,
                startedAt: new Date(),
                completedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        await createAuditLog(req.auditInfo, quizId, {
            action: 'OMR_SHEET_GRADED',
            studentId,
            score: percentage,
            attemptId: attempt.id
        });

        console.log(`✅ OMR Sheet graded - Score: ${percentage.toFixed(2)}%`);

        res.json({
            attempt,
            results: detailedResults,
            summary: {
                totalQuestions: quiz.questions.length,
                correctAnswers: detailedResults.filter(r => r.isCorrect).length,
                incorrectAnswers: detailedResults.filter(r => !r.isCorrect && r.studentAnswer).length,
                blankAnswers: detailedResults.filter(r => !r.studentAnswer).length,
                totalScore,
                maxScore,
                percentage: parseFloat(percentage.toFixed(2)),
                isPassed
            }
        });
    } catch (error) {
        console.error('Grade OMR sheet error:', error);
        res.status(500).json({ error: 'Failed to grade OMR sheet', details: error.message });
    }
};

export default {
    createOMRQuiz,
    getOMRQuizzes,
    gradeOMRSheet
};
