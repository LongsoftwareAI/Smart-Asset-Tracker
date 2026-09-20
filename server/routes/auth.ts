import bcrypt from 'bcryptjs';
import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool, PoolClient } from 'pg';
import {
  createOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
  signAccessToken,
  validatePassword,
} from '../auth.js';
import { getPool, withTransaction } from '../db.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const REFRESH_COOKIE = 'assetmate_refresh';
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
const authAttempts = new Map<string, { count: number; windowStartedAt: number }>();

interface UserRow {
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  department: string;
  avatar_url: string | null;
  is_active: boolean;
}

function publicUser(user: UserRow) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    avatar: user.avatar_url || undefined,
  };
}

function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}

function readCookie(req: Request, name: string): string | undefined {
  const prefix = `${name}=`;
  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) return undefined;

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return undefined;
  }
}

function authRateLimit(req: Request, res: Response, next: () => void) {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const current = authAttempts.get(key);
  const attempt = !current || now - current.windowStartedAt >= AUTH_RATE_WINDOW_MS
    ? { count: 1, windowStartedAt: now }
    : { ...current, count: current.count + 1 };

  authAttempts.set(key, attempt);
  if (attempt.count > AUTH_RATE_LIMIT) {
    return sendError(res, 429, 'RATE_LIMITED', 'Vui lòng thử lại sau.');
  }

  return next();
}

async function findUserByEmail(email: string, client: Pool | PoolClient = getPool()) {
  const result = await client.query<UserRow>(
    `SELECT user_id, name, email, password_hash, role, department, avatar_url, is_active
     FROM users WHERE lower(email) = $1`,
    [email]
  );
  return result.rows[0];
}

async function audit(client: PoolClient, actorUserId: string | null, eventType: string) {
  await client.query(
    'INSERT INTO audit_logs (actor_user_id, event_type) VALUES ($1, $2)',
    [actorUserId, eventType]
  );
}

async function createRefreshSession(client: PoolClient, userId: string) {
  const refreshToken = createOpaqueToken();
  await client.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
    [userId, hashOpaqueToken(refreshToken)]
  );
  return refreshToken;
}

function getResetUrl(token: string) {
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export const authRouter = Router();

const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => (req: Request, res: Response, next: NextFunction) => {
  void handler(req, res, next).catch(next);
};

authRouter.post('/login', authRateLimit, asyncRoute(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Email và mật khẩu là bắt buộc.');
  }

  const user = await findUserByEmail(normalizeEmail(email));
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
  }

  const refreshToken = await withTransaction(async (client) => {
    const token = await createRefreshSession(client, user.user_id);
    await audit(client, user.user_id, 'LOGIN_SUCCEEDED');
    return token;
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return res.json({
    accessToken: signAccessToken({ userId: user.user_id, email: user.email, role: user.role }),
    user: publicUser(user),
  });
}));

authRouter.post('/refresh', authRateLimit, asyncRoute(async (req, res) => {
  const refreshToken = readCookie(req, REFRESH_COOKIE);
  if (!refreshToken) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn.');
  }

  const result = await withTransaction(async (client) => {
    const session = await client.query<UserRow & { session_id: string }>(
      `SELECT rt.session_id, u.user_id, u.name, u.email, u.password_hash, u.role,
              u.department, u.avatar_url, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.user_id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > now()
       FOR UPDATE`,
      [hashOpaqueToken(refreshToken)]
    );
    const user = session.rows[0];
    if (!user || !user.is_active) return undefined;

    await client.query('UPDATE refresh_tokens SET revoked_at = now(), last_used_at = now() WHERE session_id = $1', [user.session_id]);
    const nextRefreshToken = await createRefreshSession(client, user.user_id);
    return { user, nextRefreshToken };
  });

  if (!result) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return sendError(res, 401, 'UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn.');
  }

  res.cookie(REFRESH_COOKIE, result.nextRefreshToken, refreshCookieOptions());
  return res.json({
    accessToken: signAccessToken({ userId: result.user.user_id, email: result.user.email, role: result.user.role }),
    user: publicUser(result.user),
  });
}));

authRouter.post('/logout', asyncRoute(async (req, res) => {
  const refreshToken = readCookie(req, REFRESH_COOKIE);
  if (refreshToken) {
    await getPool().query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
      [hashOpaqueToken(refreshToken)]
    );
  }

  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  return res.status(204).end();
}));

authRouter.get('/me', authenticate, asyncRoute(async (req, res) => {
  const auth = (req as AuthenticatedRequest).auth!;
  const result = await getPool().query<UserRow>(
    `SELECT user_id, name, email, password_hash, role, department, avatar_url, is_active
     FROM users WHERE user_id = $1 AND is_active = true`,
    [auth.userId]
  );
  const user = result.rows[0];
  if (!user) return sendError(res, 401, 'UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn.');

  return res.json({ user: publicUser(user) });
}));

authRouter.post('/forgot-password', authRateLimit, asyncRoute(async (req, res) => {
  const { email } = req.body ?? {};
  const message = 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.';
  if (typeof email !== 'string') return res.json({ message });

  const user = await findUserByEmail(normalizeEmail(email));
  if (!user || !user.is_active) return res.json({ message });

  const rawToken = await withTransaction(async (client) => {
    await client.query(
      'UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL',
      [user.user_id]
    );
    const token = createOpaqueToken();
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '15 minutes')`,
      [user.user_id, hashOpaqueToken(token)]
    );
    await audit(client, user.user_id, 'PASSWORD_RESET_REQUESTED');
    return token;
  });

  try {
    await sendPasswordResetEmail(user.email, getResetUrl(rawToken));
  } catch {
    console.error('Password reset email delivery failed.');
  }

  return res.json({ message });
}));

authRouter.post('/reset-password', authRateLimit, asyncRoute(async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (typeof token !== 'string' || typeof newPassword !== 'string') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Token và mật khẩu mới là bắt buộc.');
  }
  const passwordError = validatePassword(newPassword);
  if (passwordError) return sendError(res, 422, 'VALIDATION_ERROR', passwordError);

  const completed = await withTransaction(async (client) => {
    const result = await client.query<UserRow & { reset_id: string }>(
      `SELECT prt.reset_id, u.user_id, u.name, u.email, u.password_hash, u.role,
              u.department, u.avatar_url, u.is_active
       FROM password_reset_tokens prt
       JOIN users u ON u.user_id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > now()
       FOR UPDATE`,
      [hashOpaqueToken(token)]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) return false;

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await client.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [passwordHash, user.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE reset_id = $1', [user.reset_id]);
    await client.query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [user.user_id]);
    await audit(client, user.user_id, 'PASSWORD_RESET_COMPLETED');
    return true;
  });

  if (!completed) {
    return sendError(res, 400, 'INVALID_RESET_TOKEN', 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  }

  return res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
}));
