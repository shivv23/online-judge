import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { generateToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';

function sanitizeUser(user: IUser) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatar: user.avatar,
  };
}

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
      user: sanitizeUser(user),
      token,
    },
    201,
  );
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken({ userId: user.id, role: user.role });

  sendSuccess(res, {
    user: sanitizeUser(user),
    token,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw ApiError.unauthorized('Not authenticated');
  }

  sendSuccess(res, {
    user: sanitizeUser(user),
  });
});
