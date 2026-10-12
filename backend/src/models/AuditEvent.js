import mongoose from 'mongoose';
import { createModelProxy, pureAuditEvents } from './storeProxy.js';

const auditEventSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, default: 'system' },
    actorRole: { type: String, default: 'SYSTEM' },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, default: null, index: true },
    outcome: { type: String, enum: ['SUCCESS', 'FAILURE', 'DENIED'], default: 'SUCCESS', index: true },
    correlationId: { type: String, index: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const MongooseAuditEvent = mongoose.model('AuditEvent', auditEventSchema);
export const AuditEvent = createModelProxy(MongooseAuditEvent, pureAuditEvents);
