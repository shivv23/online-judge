import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

function renderLogin() {
  const login = vi.fn().mockResolvedValue(undefined);
  const logout = vi.fn();
  const register = vi.fn();
  mockedUseAuth.mockReturnValue({
    user: null,
    loading: false,
    login,
    register,
    logout,
  });

  const result = render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );

  return { login, result };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage', () => {
  it('renders sign in form', () => {
    renderLogin();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error when email is empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
  });

  it('shows error when password is empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
  });

  it('calls login with credentials on valid submit', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Email'), 'test@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
  });

  it('trims email before submitting', async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText('Email'), '  test@test.com  ');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
  });

  it('displays error on failed login', async () => {
    const user = userEvent.setup();
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn().mockRejectedValue(new Error('fail')),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'test@test.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('links to register page', () => {
    renderLogin();
    const link = screen.getByText('Register here');
    expect(link).toHaveAttribute('href', '/register');
  });
});
