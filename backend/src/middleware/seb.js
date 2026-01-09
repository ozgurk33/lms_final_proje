import { sebUtils } from '../utils/seb.js';

/**
 * Middleware to check if SEB is required and validate SEB browser
 */
export const requireSEB = (req, res, next) => {
    // Check if SEB is required from environment variable
    const requireSEB = process.env.REQUIRE_SEB === 'true';

    if (!requireSEB) {
        // SEB not required, allow all requests
        return next();
    }

    // Check if request is from SEB
    if (!sebUtils.isSEBRequest(req)) {
        return res.status(403).json({
            error: 'Safe Exam Browser required',
            message: 'This exam must be taken using Safe Exam Browser'
        });
    }

    // Validate SEB headers
    const validation = sebUtils.validateSEBHeaders(req);
    if (!validation.valid) {
        return res.status(403).json({
            error: 'Invalid SEB configuration',
            message: validation.reason
        });
    }

    next();
};

/**
 * Middleware to detect SEB and add info to request
 */
export const detectSEB = (req, res, next) => {
    req.isSEB = sebUtils.isSEBRequest(req);
    req.sebValidation = req.isSEB ? sebUtils.validateSEBHeaders(req) : null;
    next();
};
