import { Router } from 'express';
import {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problem.controller';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validateRequest';
import {
  createProblemSchema,
  updateProblemSchema,
} from '../validations/problem.validation';

const router = Router();

router.get('/', listProblems);
router.get('/:slug', getProblem);

router.post('/', authMiddleware, requireAdmin, validateBody(createProblemSchema), createProblem);
router.put('/:id', authMiddleware, requireAdmin, validateBody(updateProblemSchema), updateProblem);
router.delete('/:id', authMiddleware, requireAdmin, deleteProblem);

export default router;
