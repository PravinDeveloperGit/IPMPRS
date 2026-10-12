import mongoose from 'mongoose';
import { createModelProxy, pureImplementationRecords } from './storeProxy.js';

export const IMPLEMENTATION_STATUSES = [
  'Initiated',
  'In Progress',
  'Milestone Completed',
  'Commissioned',
  'Audited',
  'Terminated',
];

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetDate: { type: Date },
    completionDate: { type: Date },
    completed: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

const implementationRecordSchema = new mongoose.Schema(
  {
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, unique: true, index: true },
    status: { type: String, enum: IMPLEMENTATION_STATUSES, default: 'Initiated', index: true },
    milestones: [milestoneSchema],
    actualCost: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    outcome: { type: String, trim: true, default: '' },
    evidenceDocumentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    closureNotes: { type: String, trim: true, default: '' },
    closedAt: { type: Date },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const MongooseImplementationRecord = mongoose.model('ImplementationRecord', implementationRecordSchema);
export const ImplementationRecord = createModelProxy(MongooseImplementationRecord, pureImplementationRecords);
