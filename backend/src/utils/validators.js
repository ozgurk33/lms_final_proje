import validator from 'validator';

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    // Escape HTML characters
    return validator.escape(input);
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};

    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            sanitized[key] = sanitizeInput(obj[key]);
        } else if (Array.isArray(obj[key])) {
            sanitized[key] = obj[key].map(item =>
                typeof item === 'object' ? sanitizeObject(item) : sanitizeInput(item)
            );
        } else if (typeof obj[key] === 'object') {
            sanitized[key] = sanitizeObject(obj[key]);
        } else {
            sanitized[key] = obj[key];
        }
    }

    return sanitized;
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
    return validator.isEmail(email);
};

/**
 * Validate UUID
 */
export const isValidUUID = (id) => {
    return validator.isUUID(id);
};
