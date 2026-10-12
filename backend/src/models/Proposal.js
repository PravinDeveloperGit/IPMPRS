import mongoose from 'mongoose';
import { createModelProxy, pureProposals } from './storeProxy.js';

export const PROPOSAL_STATUSES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Clarification Requested',
  'Resubmitted',
  'Approved',
  'Rejected',
  'Implementation In Progress',
  'Implemented',
  'Closed',
];

export const PROPOSAL_CATEGORIES = [
  'Infrastructure & Surveillance',
  'Traffic & Automated Enforcement',
  'Crime Investigation & Forensics',
  'Telecommunications & Cyber',
  'Operational Equipment & Vehicles',
  'Training & Capacity Building',
  'Community Policing',
  'Administrative & General',
];

const proposalSchema = new mongoose.Schema(
  {
    proposalId: { type: String, required: true, unique: true, uppercase: true, index: true },
    title: { type: String, required: true, trim: true, index: 'text' },
    summary: { type: String, required: true, trim: true },
    problemStatement: { type: String, required: true, trim: true },
    purposeAndJustification: { type: String, trim: true },
    proposedSolution: { type: String, trim: true },
    category: { type: String, enum: PROPOSAL_CATEGORIES, required: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedReviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: PROPOSAL_STATUSES, default: 'Draft', index: true },
    proposedBudget: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    expectedBenefits: { type: String, trim: true },
    implementationTimeline: { type: String, required: true, trim: true },
    currentVersion: { type: Number, default: 1 },
    submittedAt: { type: Date },
    isSynthetic: { type: Boolean, default: false, index: true },
    isIndexedForPrecedents: { type: Boolean, default: false },
  },
  { timestamps: true }
);

proposalSchema.index({ title: 'text', summary: 'text', problemStatement: 'text' });

const MongooseProposal = mongoose.model('Proposal', proposalSchema);
export const Proposal = createModelProxy(MongooseProposal, pureProposals);
