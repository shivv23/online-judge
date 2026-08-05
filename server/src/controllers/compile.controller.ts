import { Request, Response } from 'express';
import { runCode } from '../services/compiler.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const compileAndRun = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { language, code } = req.body;
  const result = await runCode({ language, code });
  sendSuccess(res, result);
});
