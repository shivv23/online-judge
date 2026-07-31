import { Router } from 'express';
import { register } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateRequest';
import { registerSchema } from '../validations/auth.validation';

const router = Router();

router.post('/register', validateBody(registerSchema), register);

export default router;
