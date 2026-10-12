import { Router } from 'express';
import { generateProposalReport, getAiHealth } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/proposals/:id/report', generateProposalReport);
router.get('/health', getAiHealth);

export default router;
