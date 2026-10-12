import { loginUser } from '../services/authService.js';
import { recordAuditEvent } from '../services/auditService.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const clientMeta = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    const result = await loginUser(email, password, clientMeta);
    res.json({
      success: true,
      message: 'Authentication successful.',
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      await recordAuditEvent({
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'LOGOUT',
        resourceType: 'User',
        resourceId: req.user._id.toString(),
        outcome: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
}
