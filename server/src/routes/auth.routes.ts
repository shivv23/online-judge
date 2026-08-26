import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateRequest';
import { authMiddleware } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/me', authMiddleware, getMe);

export default router;
