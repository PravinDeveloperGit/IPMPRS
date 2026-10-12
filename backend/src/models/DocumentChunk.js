import mongoose from 'mongoose';
import { createModelProxy, pureDocumentChunks } from './storeProxy.js';

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    chunkId: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    sectionTitle: { type: String, default: 'General Content', trim: true },
    vectorReference: { type: String, default: null },
    tokenCount: { type: Number, default: 0 },
    isSynthetic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentChunkSchema.index({ text: 'text' });

const MongooseDocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
export const DocumentChunk = createModelProxy(MongooseDocumentChunk, pureDocumentChunks);
