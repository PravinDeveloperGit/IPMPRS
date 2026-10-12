import { Router } from 'express';
import { searchPrecedents } from '../controllers/precedentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/search', searchPrecedents);

export default router;
