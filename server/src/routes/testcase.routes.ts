import { Router } from 'express';
import {
  listTestCases,
  createTestCase,
  deleteTestCase,
} from '../controllers/testcase.controller';
import { authMiddleware, optionalAuthMiddleware, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validateRequest';
import { createTestCaseSchema } from '../validations/testcase.validation';

const router = Router({ mergeParams: true });

router.get('/', optionalAuthMiddleware, listTestCases);
router.post('/', authMiddleware, requireAdmin, validateBody(createTestCaseSchema), createTestCase);

const deleteRouter = Router();
deleteRouter.delete('/:id', authMiddleware, requireAdmin, deleteTestCase);

export default router;
export { deleteRouter as testcaseDeleteRoutes };
