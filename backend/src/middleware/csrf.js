import csurf from 'csurf';

/**
 * CSRF Protection Middleware
 * Uses cookies for token storage
 */
export const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
});

/**
 * CSRF Error Handler
 */
export const csrfErrorHandler = (err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            error: 'Invalid CSRF token',
            message: 'Form session expired. Please refresh and try again.'
        });
    }
    next(err);
};

/**
 * Get CSRF Token endpoint handler
 */
export const getCsrfToken = (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
};
