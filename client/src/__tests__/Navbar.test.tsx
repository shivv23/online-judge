import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

function renderNavbar(user?: { id: string; username: string; email: string; fullName: string; role: 'user' | 'admin' }) {
  mockedUseAuth.mockReturnValue({
    user: user ?? null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Navbar', () => {
  it('renders brand and public links when logged out', () => {
    renderNavbar();
    expect(screen.getByText('Online Judge')).toBeInTheDocument();
    expect(screen.getByText('Problems')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('renders user links when logged in', () => {
    renderNavbar({ id: '1', username: 'alice', email: 'alice@test.com', fullName: 'Alice', role: 'user' });
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Submissions')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });

  it('sets email as title attribute on username', () => {
    renderNavbar({ id: '1', username: 'alice', email: 'alice@test.com', fullName: 'Alice', role: 'user' });
    const link = screen.getByText('alice');
    expect(link).toHaveAttribute('title', 'alice@test.com');
  });

  it('calls logout on logout button click', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    mockedUseAuth.mockReturnValue({
      user: { id: '1', username: 'alice', email: 'alice@test.com', fullName: 'Alice', role: 'user' },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    await user.click(screen.getByText('Logout'));
    expect(logout).toHaveBeenCalledOnce();
  });
});
