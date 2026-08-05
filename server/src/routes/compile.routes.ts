import { Router } from 'express';
import { compileAndRun } from '../controllers/compile.controller';
import { validateBody } from '../middleware/validateRequest';
import { compileRunSchema } from '../validations/compile.validation';

const router = Router();

router.post('/run', validateBody(compileRunSchema), compileAndRun);

export default router;
