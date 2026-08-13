import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api/auth';
import { TOKEN_KEY } from '../api/client';
import type { AuthUser, LoginInput, RegisterInput } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.getMe();
        if (mounted) {
          setUser(me);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { user: authedUser, token } = await authApi.login(input);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(authedUser);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: registeredUser, token } = await authApi.register(input);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(registeredUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
