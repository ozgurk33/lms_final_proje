import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middlewares
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { sanitizeRequest } from './src/middleware/sanitize.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/users.routes.js';
import courseRoutes from './src/routes/courses.routes.js';
import quizRoutes from './src/routes/quizzes.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import adminCourseRoutes from './src/routes/adminCourse.routes.js';
import instructorRoutes from './src/routes/instructor.routes.js';
import gradeRoutes from './src/routes/grade.routes.js';
import questionRoutes from './src/routes/question.routes.js';
import plagiarismRoutes from './src/routes/plagiarism.routes.js';
import assignmentRoutes from './src/routes/assignment.routes.js';
import progressRoutes from './src/routes/progress.routes.js';
import notesRoutes from './src/routes/notes.routes.js';
import omrRoutes from './src/routes/omr.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration - Allow multiple origins for SEB compatibility
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.5:5173',
    'https://web-next-zeta-one.vercel.app',
    'https://web-next-ez2lrbbjr-ozgk33s-projects.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Electron, or SEB)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://192.168.')) {
            callback(null, true);
        } else {
            callback(null, true); // For development, allow all - change in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-SafeExamBrowser-RequestHash', 'X-SafeExamBrowser-ConfigKeyHash', 'ngrok-skip-browser-warning']
}));

// Body parsing middleware - Increased limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Input sanitization (XSS protection)
app.use(sanitizeRequest);

// Rate limiting
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Notifications endpoint (basic mock)
app.get('/api/notifications', (req, res) => {
    res.json({ notifications: [] });
});

// DEBUG: Log all requests
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/courses', gradeRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/omr', omrRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server - Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LMS Backend Server running on port ${PORT}`);
    console.log(`📡 Accessible at: http://192.168.1.5:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

export default app;
