import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { DocumentService } from '../services/documentService.js';
import { recordAuditEvent } from '../services/auditService.js';

export async function uploadDocument(req, res, next) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please attach a document file.' });
    }

    const { proposalId, title, sourceType, accessLevel } = req.body;
    const reqMeta = { ip: req.ip, userAgent: req.get('user-agent') };

    const result = await DocumentService.uploadDocument({
      file,
      proposalId: proposalId || null,
      title,
      sourceType,
      accessLevel,
      uploadedBy: req.user,
      reqMeta,
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      message: result.message,
      data: {
        document: result.document,
        isDuplicate: result.isDuplicate,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req, res, next) {
  try {
    const { proposalId, processingStatus, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (proposalId) query.proposalId = proposalId;
    if (processingStatus) query.processingStatus = processingStatus;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { documentId: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('uploadedBy', 'displayName email role')
      .populate('proposalId', 'proposalId title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentById(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('uploadedBy', 'displayName email role')
      .populate('proposalId', 'proposalId title status');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.json({
      success: true,
      data: { document: doc },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentContent(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const chunks = await DocumentChunk.find({ documentId: doc._id }).sort({ pageNumber: 1 });

    res.json({
      success: true,
      data: {
        document: doc,
        chunks,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Role verification for restricted confidential documents
    if (doc.accessLevel === 'Restricted Confidential' && !['APPROVING_AUTHORITY', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      await recordAuditEvent({
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'DOWNLOAD_DENIED_CONFIDENTIAL',
        resourceType: 'Document',
        resourceId: doc._id.toString(),
        outcome: 'DENIED',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Access level prohibits downloading this restricted document.',
      });
    }

    const filePath = DocumentService.getDocumentFilePath(doc);

    await recordAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'DOWNLOAD_DOCUMENT',
      resourceType: 'Document',
      resourceId: doc._id.toString(),
      outcome: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { documentId: doc.documentId, filename: doc.originalFilename },
    });

    res.download(filePath, doc.originalFilename);
  } catch (error) {
    next(error);
  }
}

export async function reprocessDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    doc.processingStatus = 'Processing';
    await doc.save();

    DocumentService.triggerExtraction(doc).catch(console.error);

    res.json({
      success: true,
      message: 'Document re-extraction job initiated.',
      data: { document: doc },
    });
  } catch (error) {
    next(error);
  }
}
