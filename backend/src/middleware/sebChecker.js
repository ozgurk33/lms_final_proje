import crypto from 'crypto';

/**
 * Safe Exam Browser Middleware
 * Validates SEB requests and enforces SEB-only quiz access
 */

/**
 * Check if request is from Safe Exam Browser
 * @param {Object} req - Express request object
 * @returns {boolean} - True if valid SEB request
 */
export const isSEBRequest = (req) => {
    // Check for SEB headers
    const sebHash = req.headers['x-safeexambrowser-requesthash'];
    const sebKey = req.headers['x-safeexambrowser-configkeyhash'];

    return !!(sebHash || sebKey);
};

/**
 * Middleware to enforce SEB for quiz operations
 * Bypasses in development mode
 */
export const requireSEB = (req, res, next) => {
    // Development mode bypass
    if (process.env.REQUIRE_SEB !== 'true') {
        console.log('🔓 SEB Check: Development mode - bypassed');
        return next();
    }

    // Check if request is from SEB
    if (isSEBRequest(req)) {
        console.log('✅ SEB Check: Valid SEB browser detected');
        return next();
    }

    // SEB required but not detected
    console.log('❌ SEB Check: SEB browser required but not detected');
    return res.status(403).json({
        error: 'Safe Exam Browser required',
        message: 'This quiz must be taken using Safe Exam Browser. Please download the SEB config file and open it to start the quiz.',
        sebRequired: true,
    });
};

/**
 * Optional SEB check - warns but doesn't block
 */
export const checkSEB = (req, res, next) => {
    req.isSEBBrowser = isSEBRequest(req);
    next();
};

/**
 * Validate SEB browser exam key
 * @param {string} receivedHash - Hash from SEB header
 * @param {string} expectedKey - Expected browser exam key
 * @returns {boolean} - True if valid
 */
export const validateBrowserExamKey = (receivedHash, expectedKey) => {
    if (!receivedHash || !expectedKey) return false;

    // Simple validation - in production, use proper hash comparison
    // SEB sends SHA256 hash of URL + browser exam key
    return receivedHash.length > 30; // Basic check
};

export default {
    requireSEB,
    checkSEB,
    isSEBRequest,
    validateBrowserExamKey,
};
