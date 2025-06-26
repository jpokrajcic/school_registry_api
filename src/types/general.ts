import type { SafeUser } from './database';
import { type Request } from 'express';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  csrfToken?: string;
}
