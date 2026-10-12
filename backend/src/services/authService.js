import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { recordAuditEvent } from './auditService.js';

export async function loginUser(email, password, clientMeta = {}) {
  const user = await User.findOne({ email: email.toLowerCase() }).populate('departmentId');
  if (!user) {
    await recordAuditEvent({
      action: 'LOGIN_FAILURE',
      resourceType: 'User',
      resourceId: email,
      outcome: 'FAILURE',
      ipAddress: clientMeta.ip,
      userAgent: clientMeta.userAgent,
      details: { reason: 'User email not found' },
    });
    throw new Error('Invalid departmental credentials.');
  }

  if (!user.active) {
    await recordAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN_DENIED_DEACTIVATED',
      resourceType: 'User',
      resourceId: user._id.toString(),
      outcome: 'DENIED',
      ipAddress: clientMeta.ip,
      userAgent: clientMeta.userAgent,
    });
    throw new Error('User account is deactivated. Contact system administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await recordAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN_FAILURE',
      resourceType: 'User',
      resourceId: user._id.toString(),
      outcome: 'FAILURE',
      ipAddress: clientMeta.ip,
      userAgent: clientMeta.userAgent,
      details: { reason: 'Incorrect password' },
    });
    throw new Error('Invalid departmental credentials.');
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      departmentId: user.departmentId?._id || user.departmentId,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  await recordAuditEvent({
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'LOGIN_SUCCESS',
    resourceType: 'User',
    resourceId: user._id.toString(),
    outcome: 'SUCCESS',
    ipAddress: clientMeta.ip,
    userAgent: clientMeta.userAgent,
  });

  return {
    token,
    user: user.toSafeObject(),
  };
}
