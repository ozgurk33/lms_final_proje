import prisma from '../config/database.js';

/**
 * Audit Logger Middleware
 * Logs critical user actions to database
 */
export const auditLog = (action, resource = null) => {
    return async (req, res, next) => {
        // Store audit info in request for later use
        req.auditInfo = {
            action,
            resource,
            userId: req.user?.id || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        };

        // Continue to next middleware
        next();
    };
};

/**
 * Create audit log entry
 */
export const createAuditLog = async (auditInfo, resourceId = null, details = null) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: auditInfo.userId,
                action: auditInfo.action,
                resource: auditInfo.resource,
                resourceId,
                details,
                ipAddress: auditInfo.ipAddress,
                userAgent: auditInfo.userAgent
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};
