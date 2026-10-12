import { Router } from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentContent,
  downloadDocument,
  reprocessDocument,
} from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/png',
      'image/jpeg',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|txt|png|jpg|jpeg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Only PDF, DOCX, TXT, PNG, and JPG files are permitted.'), false);
    }
  },
});

const router = Router();

router.use(requireAuth);

router.get('/', getDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.get('/:id', getDocumentById);
router.get('/:id/content', getDocumentContent);
router.get('/:id/download', downloadDocument);
router.post('/:id/reprocess', requireRole('KNOWLEDGE_ADMIN', 'SYSTEM_ADMIN'), reprocessDocument);

export default router;
