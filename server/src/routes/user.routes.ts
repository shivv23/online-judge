import { Router } from 'express';
import { getMyStats } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/me/stats', authMiddleware, getMyStats);

export default router;
