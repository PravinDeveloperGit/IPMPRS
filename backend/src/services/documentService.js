import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { calculateBufferChecksum } from '../utils/checksum.js';
import { recordAuditEvent } from './auditService.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

// Ensure storage directory exists
if (!fs.existsSync(env.STORAGE_DIR)) {
  fs.mkdirSync(env.STORAGE_DIR, { recursive: true });
}

export class DocumentService {
  /**
   * Save uploaded document, compute checksum, store metadata
   */
  static async uploadDocument({
    file,
    proposalId = null,
    title,
    sourceType,
    accessLevel = 'Internal Department',
    metadata = {},
    uploadedBy,
    reqMeta = {},
  }) {
    if (!file) {
      throw new Error('No document file was uploaded.');
    }

    // Compute SHA-256
    const checksum = calculateBufferChecksum(file.buffer);

    // Duplicate detection
    const existing = await Document.findOne({ checksum });
    if (existing) {
      logger.warn(`Duplicate document detected with checksum: ${checksum}`);
      return {
        isDuplicate: true,
        document: existing,
        message: 'A document with this identical file content already exists in the repository.',
      };
    }

    const documentId = `DOC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const safeExt = path.extname(file.originalname).toLowerCase();
    const storageFilename = `${documentId}${safeExt}`;
    const storagePath = path.join(env.STORAGE_DIR, storageFilename);

    // Save to protected storage
    fs.writeFileSync(storagePath, file.buffer);

    const doc = await Document.create({
      documentId,
      proposalId,
      title: title || file.originalname,
      sourceType: sourceType || 'Proposal Supporting Document',
      storageKey: storageFilename,
      originalFilename: file.originalname,
      fileSize: file.size,
      checksum,
      mimeType: file.mimetype,
      accessLevel,
      metadata,
      processingStatus: 'Pending',
      uploadedBy: uploadedBy._id,
    });

    await recordAuditEvent({
      actorId: uploadedBy._id,
      actorEmail: uploadedBy.email,
      actorRole: uploadedBy.role,
      action: 'UPLOAD_DOCUMENT',
      resourceType: 'Document',
      resourceId: doc._id.toString(),
      outcome: 'SUCCESS',
      ipAddress: reqMeta.ip,
      userAgent: reqMeta.userAgent,
      details: {
        documentId,
        originalFilename: file.originalname,
        fileSize: file.size,
        checksum,
      },
    });

    // Asynchronously trigger AI extraction pipeline
    this.triggerExtraction(doc).catch(err => {
      logger.error(`Document extraction trigger failed for ${doc.documentId}: ${err.message}`);
    });

    return {
      isDuplicate: false,
      document: doc,
      message: 'Document uploaded successfully and queued for extraction.',
    };
  }

  /**
   * Trigger AI service extraction and chunking
   */
  static async triggerExtraction(document) {
    try {
      document.processingStatus = 'Processing';
      await document.save();

      const filePath = path.join(env.STORAGE_DIR, document.storageKey);

      // Call AI service extraction endpoint
      const response = await axios.post(
        `${env.AI_SERVICE_URL}/extract`,
        {
          documentId: document.documentId,
          filePath,
          mimeType: document.mimeType,
          originalFilename: document.originalFilename,
        },
        { timeout: env.AI_SERVICE_TIMEOUT_MS }
      );

      const { pageCount, chunks = [] } = response.data;

      // Clean existing chunks for idempotency
      await DocumentChunk.deleteMany({ documentId: document._id });

      // Save chunks into MongoDB
      if (chunks.length > 0) {
        const chunkDocs = chunks.map((c, idx) => ({
          documentId: document._id,
          chunkId: `${document.documentId}-CHK-${String(idx + 1).padStart(3, '0')}`,
          text: c.text,
          pageNumber: c.pageNumber || 1,
          sectionTitle: c.sectionTitle || 'Extracted Section',
          vectorReference: c.vectorReference || null,
          tokenCount: c.tokenCount || 0,
        }));
        await DocumentChunk.insertMany(chunkDocs);
      }

      document.processingStatus = 'Indexed';
      document.pageCount = pageCount || 1;
      document.chunkCount = chunks.length;
      document.errorMessage = null;
      await document.save();

      logger.info(`Extraction & indexing completed for ${document.documentId}: ${chunks.length} chunks`);
    } catch (err) {
      document.processingStatus = 'Failed';
      document.errorMessage = `Extraction error: ${err.message}`;
      await document.save();
      logger.error(`AI Extraction failed for ${document.documentId}: ${err.message}`);
    }
  }

  /**
   * Get secure file path for download
   */
  static getDocumentFilePath(document) {
    const filePath = path.join(env.STORAGE_DIR, document.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in storage volume.');
    }
    return filePath;
  }
}
