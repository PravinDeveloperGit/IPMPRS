import mongoose from 'mongoose';
import { createModelProxy, pureDocuments } from './storeProxy.js';

export const DOCUMENT_SOURCE_TYPES = [
  'Proposal Supporting Document',
  'Historical Government Sanction Order',
  'Technical Specification',
  'Committee Appraisal Report',
  'Audit & Compliance Report',
  'Standard Operating Procedure',
  'BPR&D Official National Publication',
  'Public Government Manual',
];


export const ACCESS_LEVELS = [
  'Internal Department',
  'Inter-Departmental',
  'Restricted Confidential',
  'Public Reference',
];

export const PROCESSING_STATUSES = [
  'Pending',
  'Processing',
  'Extracted',
  'Indexed',
  'Failed',
];

const documentSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true, unique: true, uppercase: true, index: true },
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', default: null, index: true },
    title: { type: String, required: true, trim: true },
    sourceType: { type: String, enum: DOCUMENT_SOURCE_TYPES, default: 'Proposal Supporting Document' },
    sourceUrl: { type: String, trim: true },
    storageKey: { type: String, required: true },
    originalFilename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    checksum: { type: String, required: true, index: true },
    mimeType: { type: String, required: true },
    accessLevel: { type: String, enum: ACCESS_LEVELS, default: 'Internal Department' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    processingStatus: { type: String, enum: PROCESSING_STATUSES, default: 'Pending', index: true },
    errorMessage: { type: String, default: null },
    pageCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    extractionVersion: { type: Number, default: 1 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isSynthetic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MongooseDocument = mongoose.model('Document', documentSchema);
export const Document = createModelProxy(MongooseDocument, pureDocuments);
