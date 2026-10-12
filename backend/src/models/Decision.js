import mongoose from 'mongoose';
import { createModelProxy, pureDecisions } from './storeProxy.js';

export const DECISION_OUTCOMES = [
  'Approved',
  'Rejected',
  'Modified',
];

const decisionSchema = new mongoose.Schema(
  {
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, unique: true, index: true },
    outcome: { type: String, enum: DECISION_OUTCOMES, required: true },
    reason: { type: String, required: true, trim: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    decidedAt: { type: Date, default: Date.now },
    approvedAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    sourceReferences: [
      {
        documentTitle: { type: String, trim: true },
        pageNumber: { type: Number, default: 1 },
        sectionTitle: { type: String, trim: true },
      },
    ],
    conditions: { type: String, trim: true },
  },
  { timestamps: true }
);

const MongooseDecision = mongoose.model('Decision', decisionSchema);
export const Decision = createModelProxy(MongooseDecision, pureDecisions);
