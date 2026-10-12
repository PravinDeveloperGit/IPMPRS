import mongoose from 'mongoose';
import { createModelProxy, pureObservations } from './storeProxy.js';

export const OBSERVATION_TYPES = [
  'Review Observation',
  'Clarification Request',
  'Technical Query',
  'Financial Observation',
  'Compliance Check',
];

const observationSchema = new mongoose.Schema(
  {
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: OBSERVATION_TYPES, default: 'Review Observation' },
    linkedDocumentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    proposalVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const MongooseObservation = mongoose.model('Observation', observationSchema);
export const Observation = createModelProxy(MongooseObservation, pureObservations);
