import { Router } from 'express';
import authRoutes from './auth.routes';
import problemRoutes from './problem.routes';
import testcaseRoutes, { testcaseDeleteRoutes } from './testcase.routes';
import compileRoutes from './compile.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/problems', problemRoutes);
router.use('/problems/:problemId/testcases', testcaseRoutes);
router.use('/testcases', testcaseDeleteRoutes);
router.use('/compile', compileRoutes);

export default router;
