import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../types';
import * as MESSAGES from '../../shared/messages';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegistrationInput) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
  logout: () => Promise<void>;
}

interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  department: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || MESSAGES.AUTHENTICATION_FAILED);
  return body as { accessToken: string; user: User };
}

async function readMessageResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || MESSAGES.REQUEST_FAILED);
  return String(body.message || MESSAGES.ACTION_SUCCESS);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(readResponse)
      .then(({ accessToken: token, user: authenticatedUser }) => {
        setAccessToken(token);
        setUser(authenticatedUser);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isLoading,
    async login(email, password) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await readResponse(response);
      setAccessToken(result.accessToken);
      setUser(result.user);
    },
    async register(input) {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return readMessageResponse(response);
    },
    async requestPasswordReset(email) {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return readMessageResponse(response);
    },
    async resetPassword(token, newPassword) {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      return readMessageResponse(response);
    },
    async logout() {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setAccessToken(null);
      setUser(null);
    },
  }), [accessToken, isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
