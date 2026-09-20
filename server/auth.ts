import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

export type AuthRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface AccessTokenClaims {
  userId: string;
  email: string;
  role: AuthRole;
}

type Environment = Record<string, string | undefined>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Mật khẩu phải có ít nhất 12 ký tự.';
  }

  return null;
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getJwtSecret(env: Environment): string {
  const secret = env.JWT_ACCESS_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET must be configured.');
  }

  return secret;
}

export function signAccessToken(claims: AccessTokenClaims, env: Environment = process.env): string {
  return jwt.sign(
    { email: claims.email, role: claims.role },
    getJwtSecret(env),
    { subject: claims.userId, expiresIn: '15m' }
  );
}

export function verifyAccessToken(token: string, env: Environment = process.env): AccessTokenClaims {
  const payload = jwt.verify(token, getJwtSecret(env));
  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    !['ADMIN', 'MANAGER', 'STAFF'].includes(String(payload.role))
  ) {
    throw new Error('Invalid access token.');
  }

  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role as AuthRole,
  };
}
