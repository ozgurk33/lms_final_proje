import { sanitizeObject } from '../utils/validators.js';

/**
 * Sanitize Request Body Middleware
 * Prevents XSS attacks by escaping HTML characters
 */
export const sanitizeRequest = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }

    next();
};
