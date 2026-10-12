import { Router } from 'express';
import authRoutes from './authRoutes.js';
import proposalRoutes from './proposalRoutes.js';
import documentRoutes from './documentRoutes.js';
import precedentRoutes from './precedentRoutes.js';
import aiRoutes from './aiRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/proposals', proposalRoutes);
router.use('/documents', documentRoutes);
router.use('/precedents', precedentRoutes);
router.use('/ai', aiRoutes);
router.use('/', adminRoutes);

export default router;
