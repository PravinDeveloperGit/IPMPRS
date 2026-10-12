import { Router } from 'express';
import {
  getDepartments,
  getUsers,
  createUser,
  updateUser,
  getAuditEvents,
  getSystemHealth,
  getDatasetManifest,
} from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { createUserSchema } from '../validators/authValidators.js';

const router = Router();

// Public routes for system and dataset audit inspection
router.get('/health', getSystemHealth);
router.get('/dataset-manifest', getDatasetManifest);

// Authenticated routes
router.use(requireAuth);


router.get('/departments', getDepartments);

router.get('/users', requireRole('SYSTEM_ADMIN'), getUsers);
router.post('/users', requireRole('SYSTEM_ADMIN'), validateBody(createUserSchema), createUser);
router.patch('/users/:id', requireRole('SYSTEM_ADMIN'), updateUser);

router.get('/audit-events', requireRole('AUDITOR', 'SYSTEM_ADMIN', 'APPROVING_AUTHORITY'), getAuditEvents);

export default router;
