import mongoose from 'mongoose';
import { createModelProxy, pureWorkflowEvents } from './storeProxy.js';

const workflowEventSchema = new mongoose.Schema(
  {
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    reason: { type: String, default: '', trim: true },
    proposalVersion: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const MongooseWorkflowEvent = mongoose.model('WorkflowEvent', workflowEventSchema);
export const WorkflowEvent = createModelProxy(MongooseWorkflowEvent, pureWorkflowEvents);
