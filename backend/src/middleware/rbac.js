import { recordAuditEvent } from '../services/auditService.js';

/**
 * Middleware to restrict endpoints to specific roles
 * @param  {...string} allowedRoles 
 */
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to permission verification.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await recordAuditEvent({
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'ACCESS_DENIED_ROLE_CHECK',
        resourceType: 'API_ENDPOINT',
        resourceId: req.originalUrl,
        outcome: 'DENIED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: {
          requiredRoles: allowedRoles,
          currentRole: req.user.role,
          method: req.method,
        },
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Your role (${req.user.role}) lacks authorization for this operation. Required: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
}

/**
 * Helper to check department-level resource access
 */
export function canAccessDepartment(user, departmentId) {
  if (['SYSTEM_ADMIN', 'APPROVING_AUTHORITY', 'KNOWLEDGE_ADMIN', 'AUDITOR'].includes(user.role)) {
    return true;
  }
  if (!user.departmentId) return false;
  const userDept = user.departmentId._id ? user.departmentId._id.toString() : user.departmentId.toString();
  const targetDept = departmentId._id ? departmentId._id.toString() : departmentId.toString();
  return userDept === targetDept;
}
