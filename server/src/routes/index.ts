import { Router } from 'express';
import authRoutes from './auth.routes';
import problemRoutes from './problem.routes';
import testcaseRoutes, { testcaseDeleteRoutes } from './testcase.routes';
import compileRoutes from './compile.routes';
import submissionRoutes from './submission.routes';
import leaderboardRoutes from './leaderboard.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/problems', problemRoutes);
router.use('/problems/:problemId/testcases', testcaseRoutes);
router.use('/testcases', testcaseDeleteRoutes);
router.use('/compile', compileRoutes);
router.use('/submissions', submissionRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/users', userRoutes);

export default router;
