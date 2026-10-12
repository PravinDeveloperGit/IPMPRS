import { AuditEvent } from '../models/AuditEvent.js';
import { logger } from '../utils/logger.js';

export async function recordAuditEvent({
  actorId = null,
  actorEmail = 'system',
  actorRole = 'SYSTEM',
  action,
  resourceType,
  resourceId = null,
  outcome = 'SUCCESS',
  correlationId = null,
  ipAddress = '',
  userAgent = '',
  details = {},
}) {
  try {
    const event = await AuditEvent.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      resourceType,
      resourceId,
      outcome,
      correlationId: correlationId || `CORR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ipAddress,
      userAgent,
      details,
    });
    logger.audit(action, actorEmail, `${resourceType}:${resourceId || 'N/A'}`, outcome);
    return event;
  } catch (err) {
    logger.error(`Failed to record audit event: ${err.message}`);
    return null;
  }
}
