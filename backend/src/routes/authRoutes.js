import { Router } from 'express';
import { login, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidators.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

export default router;
