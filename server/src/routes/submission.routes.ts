import { Router } from 'express';
import {
  createSubmission,
  getSubmission,
  listUserSubmissions,
} from '../controllers/submission.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validateRequest';
import { createSubmissionSchema } from '../validations/submission.validation';

const router = Router();

router.post('/', authMiddleware, validateBody(createSubmissionSchema), createSubmission);
router.get('/:id', authMiddleware, getSubmission);
router.get('/user/:userId', authMiddleware, listUserSubmissions);

export default router;
