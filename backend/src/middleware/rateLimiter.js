import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased from 100
    message: {
        error: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict Rate Limiter for Auth endpoints
 * 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Increased from 5
    message: {
        error: 'Too many login attempts, please try again later'
    },
    skipSuccessfulRequests: true,
});

/**
 * Medium Rate Limiter for write operations
 * 20 requests per 15 minutes
 */
export const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // Increased from 20
    message: {
        error: 'Too many write operations, please slow down'
    },
});
