const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const omrProcessingService = require('../services/omrProcessing.service.cjs');

// MOCK STORAGE - NO DATABASE REQUIRED!
const mockOMRStorage = require('../utils/mockOMRStorage.cjs');

// Mock user/quiz data for testing
const mockUsers = {
    instructor: { id: 'mock-instructor-1', fullName: 'Test Instructor', email: 'instructor@test.com' },
    student: { id: 'mock-student-1', fullName: 'Test Student', email: 'student@test.com' }
};

const mockQuiz = {
    id: 'mock-quiz-1',
    title: 'Mock OMR Quiz',
    questions: Array.from({ length: 50 }, (_, i) => ({
        id: `q-${i + 1}`,
        order: i + 1,
        points: 1,
        correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
    }))
};

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/omr');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'omr-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpg, jpeg, png) are allowed'));
        }
    }
}).single('image');

// Upload OMR sheet image
exports.uploadOMRSheet = async (req, res) => {
    console.log('🔵 ===== OMR UPLOAD REQUEST RECEIVED =====');
    console.log('  - Method:', req.method);
    console.log('  - URL:', req.originalUrl);
    console.log('  - Content-Type:', req.get('Content-Type'));
    console.log('  - Has User:', !!req.user);
    console.log('  - User ID:', req.user?.id || 'NO USER');

    try {
        upload(req, res, async (err) => {
            if (err) {
                console.error('❌ Multer error:', err.message);
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                console.error('❌ No file provided in request');
                return res.status(400).json({ error: 'No image file provided' });
            }

            const { studentId, quizId, courseId } = req.body;
            const instructorId = req.user?.id || mockUsers.instructor.id;

            // Debug: Log file details
            console.log('📁 File upload details:');
            console.log(' - Original name:', req.file.originalname);
            console.log(' - Saved path:', req.file.path);
            console.log(' - Destination:', req.file.destination);
            console.log(' - Filename:', req.file.filename);

            // Create OMR sheet record in MOCK storage
            const omrSheet = mockOMRStorage.createSheet({
                instructorId,
                studentId: studentId || null,
                quizId: quizId || mockQuiz.id,
                courseId: courseId || null,
                imageUrl: req.file.path,  // Use full path from multer
                status: 'PENDING',
                instructor: { id: instructorId, fullName: mockUsers.instructor.fullName, email: mockUsers.instructor.email },
                student: studentId ? mockUsers.student : null,
                quiz: { id: mockQuiz.id, title: mockQuiz.title }
            });

            res.status(201).json({
                message: 'OMR sheet uploaded successfully (MOCK MODE)',
                sheet: omrSheet
            });
        });
    } catch (error) {
        console.error('❌ Upload OMR sheet error:', error);
        res.status(500).json({ error: 'Failed to upload OMR sheet' });
    }
};

// Process OMR sheet
exports.processOMRSheet = async (req, res) => {
    try {
        const { sheetId } = req.params;
        const { studentId, quizId } = req.body;

        // Get sheet from MOCK storage
        const sheet = mockOMRStorage.findSheetById(sheetId);

        if (!sheet) {
            return res.status(404).json({ error: 'OMR sheet not found' });
        }

        // Update sheet status
        mockOMRStorage.updateSheet(sheetId, {
            status: 'PROCESSING',
            studentId: studentId || sheet.studentId,
            quizId: quizId || sheet.quizId
        });

        console.log('🔍 Processing OMR image with OCR:', sheet.imageUrl);

        // Ensure absolute path for image
        const path = require('path');
        let absoluteImagePath = sheet.imageUrl;

        // If path doesn't start with C: or /, it's relative - make it absolute
        if (!absoluteImagePath.startsWith('C:') && !absoluteImagePath.startsWith('/') && !absoluteImagePath.includes(':\\')) {
            absoluteImagePath = path.resolve(sheet.imageUrl);
        }

        console.log(' - Resolved path:', absoluteImagePath);

        // Process image with OCR
        const processingResult = await omrProcessingService.processOMRImage(absoluteImagePath);

        console.log('✅ OCR Processing complete:', {
            answersCount: Object.keys(processingResult.answers).length,
            testId: processingResult.testId,
            rollNo: processingResult.rollNo
        });

        // Create result in MOCK storage
        const omrResult = mockOMRStorage.createResult({
            sheetId: sheet.id,
            answers: processingResult.answers,
            confidence: processingResult.confidence,
            testId: processingResult.testId,
            rollNo: processingResult.rollNo
        });

        // Update sheet status
        const hasLowConfidence = Object.values(processingResult.confidence || {}).some(c => c < 0.6);
        mockOMRStorage.updateSheet(sheetId, {
            status: hasLowConfidence ? 'VALIDATION' : 'COMPLETED'
        });

        res.json({
            message: 'OMR sheet processed successfully with OCR (MOCK MODE)',
            result: omrResult,
            requiresValidation: hasLowConfidence,
            ocrStats: {
                totalAnswers: Object.keys(processingResult.answers).length,
                avgConfidence: Object.values(processingResult.confidence || {}).reduce((a, b) => a + b, 0) / 50
            }
        });
    } catch (error) {
        console.error('Process OMR sheet error:', error);

        // Update status to failed
        if (req.params.sheetId) {
            mockOMRStorage.updateSheet(req.params.sheetId, { status: 'FAILED' });
        }

        res.status(500).json({ error: 'Failed to process OMR sheet', details: error.message });
    }
};

// Get instructor's OMR sheets
exports.getInstructorSheets = async (req, res) => {
    try {
        const instructorId = req.user?.id || mockUsers.instructor.id;
        const { status, courseId, quizId } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (courseId) filters.courseId = courseId;
        if (quizId) filters.quizId = quizId;

        const sheets = mockOMRStorage.findSheetsByInstructor(instructorId, filters);

        res.json({
            sheets,
            mockMode: true,
            stats: mockOMRStorage.getStats()
        });
    } catch (error) {
        console.error('Get instructor sheets error:', error);
        res.status(500).json({ error: 'Failed to fetch OMR sheets' });
    }
};

// Get specific OMR sheet
exports.getOMRSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = mockOMRStorage.findSheetById(id);

        if (!sheet) {
            return res.status(404).json({ error: 'OMR sheet not found' });
        }

        res.json({ sheet, mockMode: true });
    } catch (error) {
        console.error('Get OMR sheet error:', error);
        res.status(500).json({ error: 'Failed to fetch OMR sheet' });
    }
};

// Get OMR result
exports.getOMRResult = async (req, res) => {
    try {
        const { sheetId } = req.params;
        const result = mockOMRStorage.findResultBySheetId(sheetId);

        if (!result) {
            return res.status(404).json({ error: 'OMR result not found' });
        }

        // Add mock quiz questions for validation
        result.sheet.quiz = mockQuiz;

        res.json({ result, mockMode: true });
    } catch (error) {
        console.error('Get OMR result error:', error);
        res.status(500).json({ error: 'Failed to fetch OMR result' });
    }
};

// Validate and update OMR result
exports.validateOMRResult = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { answers } = req.body;
        const userId = req.user?.id || mockUsers.instructor.id;

        const result = mockOMRStorage.updateResult(resultId, {
            answers,
            validated: true,
            validatedBy: userId,
            validatedAt: new Date()
        });

        if (!result) {
            return res.status(404).json({ error: 'OMR result not found' });
        }

        // Update sheet status
        mockOMRStorage.updateSheet(result.sheetId, { status: 'COMPLETED' });

        res.json({
            message: 'OMR result validated successfully (MOCK MODE)',
            result
        });
    } catch (error) {
        console.error('Validate OMR result error:', error);
        res.status(500).json({ error: 'Failed to validate OMR result' });
    }
};

// Submit OMR result to quiz system
exports.submitOMRToQuiz = async (req, res) => {
    try {
        const { sheetId } = req.params;
        const sheet = mockOMRStorage.findSheetById(sheetId);

        if (!sheet) {
            return res.status(404).json({ error: 'OMR sheet not found' });
        }

        if (!sheet.studentId || !sheet.quizId) {
            return res.status(400).json({ error: 'Student and Quiz must be assigned before submission' });
        }

        if (!sheet.result) {
            return res.status(400).json({ error: 'OMR sheet has not been processed yet' });
        }

        // Calculate score using mock quiz
        const answers = sheet.result.answers;
        let totalScore = 0;
        let maxScore = 0;
        const detailedAnswers = {};

        mockQuiz.questions.forEach((question, index) => {
            const questionNumber = (index + 1).toString();
            const studentAnswer = answers[questionNumber];
            const correctAnswer = question.correctAnswer;

            const isCorrect = studentAnswer === correctAnswer;

            detailedAnswers[question.id] = {
                answer: studentAnswer,
                isCorrect,
                points: isCorrect ? question.points : 0
            };

            if (isCorrect) {
                totalScore += question.points;
            }
            maxScore += question.points;
        });

        const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const isPassed = scorePercentage >= 60;

        // Mock quiz attempt (would be created in real database)
        const quizAttempt = {
            id: `mock-attempt-${Date.now()}`,
            quizId: sheet.quizId,
            userId: sheet.studentId,
            answers: detailedAnswers,
            score: scorePercentage,
            isPassed,
            startedAt: new Date(),
            completedAt: new Date()
        };

        // Update sheet status
        mockOMRStorage.updateSheet(sheetId, { status: 'SUBMITTED' });

        console.log('📊 Mock Quiz Result:', {
            totalScore,
            maxScore,
            percentage: scorePercentage.toFixed(2) + '%',
            passed: isPassed
        });

        res.json({
            message: 'OMR result submitted successfully (MOCK MODE - No database change)',
            quizAttempt,
            score: scorePercentage,
            isPassed,
            mockMode: true
        });
    } catch (error) {
        console.error('Submit OMR to quiz error:', error);
        res.status(500).json({ error: 'Failed to submit OMR result', details: error.message });
    }
};

// Delete OMR sheet
exports.deleteOMRSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = mockOMRStorage.findSheetById(id);

        if (!sheet) {
            return res.status(404).json({ error: 'OMR sheet not found' });
        }

        // Delete image file
        try {
            await fs.unlink(sheet.imageUrl);
        } catch (err) {
            console.error('Failed to delete image file:', err);
        }

        // Delete from mock storage
        mockOMRStorage.deleteSheet(id);

        res.json({ message: 'OMR sheet deleted successfully (MOCK MODE)' });
    } catch (error) {
        console.error('Delete OMR sheet error:', error);
        res.status(500).json({ error: 'Failed to delete OMR sheet' });
    }
};

// Debug endpoint - Get mock storage stats
exports.getMockStats = async (req, res) => {
    try {
        const stats = mockOMRStorage.getStats();
        res.json({
            message: 'MOCK MODE - In-memory storage stats',
            stats,
            allSheets: mockOMRStorage.sheets,
            allResults: mockOMRStorage.results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Debug endpoint - Reset mock storage
exports.resetMockStorage = async (req, res) => {
    try {
        mockOMRStorage.reset();
        res.json({ message: 'Mock storage reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Live Frame Processing - For mobile video scanning
// Using omrProcessingService instead of direct exec

// Multer storage for temp frames
const frameUpload = multer({
    dest: path.join(__dirname, '../../temp/frames'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPG/PNG allowed'));
        }
    }
}).single('frame');

exports.processFrameLive = async (req, res) => {
    try {
        console.log('🎥 Live frame request received (Base64)');
        console.log('  - Has imageBase64:', !!req.body.imageBase64);

        if (!req.body.imageBase64) {
            console.error('❌ No base64 image in request');
            return res.status(400).json({ success: false, error: 'No image provided' });
        }

        // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,")
        let base64Data = req.body.imageBase64;
        if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
            console.log('✅ Stripped data URI prefix');
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        console.log('✅ Image buffer created, size:', imageBuffer.length);

        // Validate JPEG header (first 2 bytes should be 0xFF 0xD8)
        const isValidJpeg = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8;
        console.log('✅ JPEG header valid:', isValidJpeg, '- First bytes:', imageBuffer[0], imageBuffer[1]);

        // Save to omr-algorithm folder where Python can access it
        const fsSync = require('fs');
        const isDocker = process.env.NODE_ENV === 'production' || fsSync.existsSync('/app/omr-algorithm');
        const omrDir = isDocker ? '/app/omr-algorithm' : path.join('C:', 'SE_FINAL', 'SE_FINAL_ODEV_SON', 'omr-algorithm');

        const tempFilePath = path.join(omrDir, `temp_omr_${Date.now()}.jpg`);
        fsSync.writeFileSync(tempFilePath, imageBuffer);
        console.log('✅ Temp file saved to omr-algorithm:', tempFilePath);

        // Verify file
        const fileStats = fsSync.statSync(tempFilePath);
        console.log('✅ File verified, size:', fileStats.size);

        try {
            // Use the OMR processing service with visualization
            console.log('📖 Processing with OMR service + visualization...');

            const processingResult = await omrProcessingService.processWithVisualization(tempFilePath);

            // Cleanup temp file
            await fs.unlink(tempFilePath).catch(() => { });

            // Calculate stats
            const totalQuestions = Object.keys(processingResult.answers).length;
            const answeredCount = Object.values(processingResult.answers).filter(a => a !== null).length;
            const blankCount = totalQuestions - answeredCount;

            const confidenceValues = Object.values(processingResult.confidence);
            const avgConfidence = confidenceValues.length > 0
                ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
                : 0;

            // Format response with pipeline images
            const response = {
                success: true,
                paper_detected: true,
                questions_detected: totalQuestions,
                bubbles_count: totalQuestions * 4,
                answers: processingResult.answers,
                confidence: processingResult.confidence,
                pipelineImages: processingResult.pipelineImages || {},
                summary: {
                    total: totalQuestions,
                    answered: answeredCount,
                    blank: blankCount,
                    average_confidence: parseFloat(avgConfidence.toFixed(2))
                }
            };

            console.log('✅ Processing successful with visualization:', {
                questions: totalQuestions,
                answered: answeredCount,
                avgConfidence: avgConfidence.toFixed(2),
                pipelineImagesCount: Object.keys(processingResult.pipelineImages || {}).length
            });

            res.json(response);

        } catch (error) {
            console.error('❌ Processing error:', error);

            // Cleanup temp file
            await fs.unlink(tempFilePath).catch(() => { });

            res.status(500).json({
                success: false,
                error: 'Processing failed',
                details: error.message,
                paper_detected: false
            });
        }
    } catch (error) {
        console.error('❌ Frame live error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Save image for manual OMR processing
exports.saveForManualProcess = async (req, res) => {
    try {
        console.log('💾 Save for manual OMR processing');
        console.log('  - Has imageBase64:', !!req.body.imageBase64);
        console.log('  - Filename:', req.body.filename);

        if (!req.body.imageBase64) {
            return res.status(400).json({ success: false, error: 'No image provided' });
        }

        // Strip data URI prefix if present
        let base64Data = req.body.imageBase64;
        if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        console.log('✅ Image buffer created, size:', imageBuffer.length);

        // Save to omr-algorithm folder
        const fsSync = require('fs');
        const isDocker = process.env.NODE_ENV === 'production' || fsSync.existsSync('/app/omr-algorithm');
        const omrDir = isDocker ? '/app/omr-algorithm' : path.join('C:', 'SE_FINAL', 'SE_FINAL_ODEV_SON', 'omr-algorithm');

        const filename = req.body.filename || `omr_mobile_${Date.now()}.png`;
        const filePath = path.join(omrDir, filename);

        fsSync.writeFileSync(filePath, imageBuffer);
        console.log('✅ Image saved to:', filePath);

        // Verify file
        const fileStats = fsSync.statSync(filePath);
        console.log('✅ File verified, size:', fileStats.size);

        res.json({
            success: true,
            filename: filename,
            path: filePath,
            size: fileStats.size,
            message: `Dosya kaydedildi: ${filename}`
        });

    } catch (error) {
        console.error('❌ Save error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
