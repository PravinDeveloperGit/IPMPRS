import { Router } from 'express';
import {
  getProposals,
  createProposal,
  getProposalById,
  updateProposal,
  submitProposal,
  addObservation,
  requestClarification,
  resubmitProposal,
  recordDecision,
  updateImplementation,
  closeProposal,
  getDashboardStats,
} from '../controllers/proposalController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import {
  createProposalSchema,
  updateProposalSchema,
  addObservationSchema,
  clarificationRequestSchema,
  resubmitProposalSchema,
} from '../validators/proposalValidators.js';
import { recordDecisionSchema, updateImplementationSchema } from '../validators/decisionValidators.js';

const router = Router();

router.use(requireAuth);

router.get('/stats/overview', getDashboardStats);
router.get('/', getProposals);
router.post('/', requireRole('OFFICER_CREATOR', 'SYSTEM_ADMIN'), validateBody(createProposalSchema), createProposal);

router.get('/:id', getProposalById);
router.patch('/:id', requireRole('OFFICER_CREATOR', 'SYSTEM_ADMIN'), validateBody(updateProposalSchema), updateProposal);
router.post('/:id/submit', requireRole('OFFICER_CREATOR', 'SYSTEM_ADMIN'), submitProposal);

router.post(
  '/:id/observations',
  requireRole('REVIEWER', 'APPROVING_AUTHORITY', 'SYSTEM_ADMIN'),
  validateBody(addObservationSchema),
  addObservation
);

router.post(
  '/:id/clarification',
  requireRole('REVIEWER', 'APPROVING_AUTHORITY', 'SYSTEM_ADMIN'),
  validateBody(clarificationRequestSchema),
  requestClarification
);

router.post(
  '/:id/resubmit',
  requireRole('OFFICER_CREATOR', 'SYSTEM_ADMIN'),
  validateBody(resubmitProposalSchema),
  resubmitProposal
);

router.post(
  '/:id/decision',
  requireRole('APPROVING_AUTHORITY', 'SYSTEM_ADMIN'),
  validateBody(recordDecisionSchema),
  recordDecision
);

router.post(
  '/:id/implementation',
  requireRole('OFFICER_CREATOR', 'REVIEWER', 'APPROVING_AUTHORITY', 'SYSTEM_ADMIN'),
  validateBody(updateImplementationSchema),
  updateImplementation
);

router.post(
  '/:id/close',
  requireRole('APPROVING_AUTHORITY', 'SYSTEM_ADMIN'),
  closeProposal
);

export default router;
