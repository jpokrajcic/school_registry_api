import type { SafeUser } from './database';
import { type Request } from 'express';

export interface AppConfig {
  port: number;
  environment: string;
  sslEnabled: boolean;
  sslKeyPath?: string;
  sslCertPath?: string;
  appVersion?: string;
}

export interface HealthResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  uptime: number;
  environment: string;
  version?: string;
  services?: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

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
