import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { generateToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, fullName } = req.body;

  const [emailTaken, usernameTaken] = await Promise.all([
    User.isEmailTaken(email),
    User.isUsernameTaken(username),
  ]);

  if (emailTaken) {
    throw ApiError.badRequest('Email is already registered');
  }

  if (usernameTaken) {
    throw ApiError.badRequest('Username is already taken');
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
  });

  const token = generateToken({ userId: user.id, role: user.role });

  sendSuccess(
    res,
    {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    },
    201,
  );
});
