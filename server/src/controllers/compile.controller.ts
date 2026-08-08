import { Request, Response } from 'express';
import { runCode } from '../services/compiler.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const compileAndRun = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { language, code, input } = req.body;
  const result = await runCode({ language, code, input });
  sendSuccess(res, result);
});
