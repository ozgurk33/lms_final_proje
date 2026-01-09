/**
 * Role-Based Access Control Middleware
 */

const ROLE_HIERARCHY = {
    SUPER_ADMIN: 6,
    ADMIN: 5,
    INSTRUCTOR: 4,
    ASSISTANT: 3,
    STUDENT: 2,
    GUEST: 1
};

/**
 * Check if user has required role
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Check if user has minimum role level
 */
export const requireMinRole = (minRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
        const minRoleLevel = ROLE_HIERARCHY[minRole] || 0;

        if (userRoleLevel < minRoleLevel) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires ${minRole} or higher role`
            });
        }

        next();
    };
};

/**
 * Check if user is resource owner or has admin role
 */
export const requireOwnerOrAdmin = (resourceUserIdGetter) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Admins can access everything
        if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
            return next();
        }

        // Check if user is the owner
        const resourceUserId = resourceUserIdGetter(req);

        if (req.user.id !== resourceUserId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only access your own resources'
            });
        }

        next();
    };
};
