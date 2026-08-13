export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  avatar?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
}
