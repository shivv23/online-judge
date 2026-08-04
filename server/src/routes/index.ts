import { Router } from 'express';
import authRoutes from './auth.routes';
import problemRoutes from './problem.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/problems', problemRoutes);

export default router;
