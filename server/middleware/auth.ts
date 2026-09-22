import type { NextFunction, Request, Response } from 'express';
import { type AccessTokenClaims, type AuthRole, verifyAccessToken } from '../auth.js';
import * as MESSAGES from '../../shared/messages.js';

export interface AuthenticatedRequest extends Request {
  auth?: AccessTokenClaims;
}

function sendUnauthorized(res: Response) {
  return res.status(401).json({
    error: { code: 'UNAUTHENTICATED', message: MESSAGES.UNAUTHENTICATED },
  });
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return sendUnauthorized(res);
  }

  try {
    req.auth = verifyAccessToken(authorization.slice('Bearer '.length));
    return next();
  } catch {
    return sendUnauthorized(res);
  }
}

export function requireRole(...roles: AuthRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: MESSAGES.FORBIDDEN },
      });
    }

    return next();
  };
}
