import { api } from './client';
import type { AuthUser, LoginInput, RegisterInput } from '../types/auth';

interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface SuccessData<T> {
  success: true;
  data: T;
}

export const authApi = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await api.post<SuccessData<AuthResponse>>('/auth/login', input);
    return res.data.data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await api.post<SuccessData<AuthResponse>>('/auth/register', input);
    return res.data.data;
  },

  async getMe(): Promise<AuthUser> {
    const res = await api.get<SuccessData<{ user: AuthUser }>>('/auth/me');
    return res.data.data.user;
  },
};
