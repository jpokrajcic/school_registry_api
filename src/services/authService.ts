import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import Redis from 'ioredis';
import { type Response, type NextFunction } from 'express';
import type { User } from '../types/database';
import type { AuthTokens, AuthenticatedRequest } from '../types/general';

export class AuthService {
  private redis: Redis;
  private JWT_SECRET: string;
  private JWT_EXPIRES_IN: number;
  private JWT_REFRESH_SECRET: string;
  private JWT_REFRESH_EXPIRES_IN: number;
  private REFRESH_TOKEN_REDIS_TTL: number;
  private CSRF_TOKEN_TTL: number;
  private NODE_ENV: string;

  constructor(redis: Redis) {
    this.redis = redis;

    // Load environment variables
    this.JWT_SECRET = process.env['JWT_SECRET'] || '';
    this.JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN']
      ? parseInt(process.env['JWT_EXPIRES_IN'], 10)
      : 900; // 15 minutes in seconds
    this.JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || '';
    this.JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN']
      ? parseInt(process.env['JWT_REFRESH_EXPIRES_IN'], 10)
      : 604800; // 7 days in seconds
    this.REFRESH_TOKEN_REDIS_TTL = process.env['REFRESH_TOKEN_REDIS_TTL']
      ? parseInt(process.env['REFRESH_TOKEN_REDIS_TTL'], 10)
      : 604800; // 7 days in seconds
    this.CSRF_TOKEN_TTL = process.env['CSRF_TOKEN_TTL']
      ? parseInt(process.env['CSRF_TOKEN_TTL'], 10)
      : 86400; // 24 hours in seconds
    this.NODE_ENV = process.env['NODE_ENV'] || 'development';
  }

  // JWT utility functions
  generateTokens(userId: number): AuthTokens {
    const accessToken = jwt.sign({ userId }, this.JWT_SECRET as jwt.Secret, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(
      { userId },
      this.JWT_REFRESH_SECRET as jwt.Secret,
      {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
      }
    );
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  // Password utilities
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Validation utilities
  validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters long',
      };
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return {
        isValid: false,
        error:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      };
    }

    return { isValid: true };
  }

  validateEmail(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    return { isValid: true };
  }

  // CSRF Token utilities
  generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyCSRFToken(token: string, sessionToken: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  }

  // CSRF Token storage in Redis
  async storeCSRFToken(token: string, userId: number): Promise<void> {
    const key = `csrf_token:${userId}`;
    await this.redis.setex(key, this.CSRF_TOKEN_TTL, token);
  }

  async getCSRFToken(userId: string): Promise<string | null> {
    const key = `csrf_token:${userId}`;
    return await this.redis.get(key);
  }

  async deleteCSRFToken(userId: string): Promise<void> {
    const key = `csrf_token:${userId}`;
    await this.redis.del(key);
  }

  // Redis utility functions for refresh tokens
  async storeRefreshToken(refreshToken: string, userId: number): Promise<void> {
    const key = `refresh_token:${refreshToken}`;
    await this.redis.setex(key, this.REFRESH_TOKEN_REDIS_TTL, userId);
  }

  async getRefreshTokenUserId(refreshToken: string): Promise<string | null> {
    const key = `refresh_token:${refreshToken}`;
    return await this.redis.get(key);
  }

  async deleteRefreshToken(refreshToken: string): Promise<void> {
    const key = `refresh_token:${refreshToken}`;
    await this.redis.del(key);
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    const pattern = 'refresh_token:*';
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const storedUserId = await this.redis.get(key);
      if (storedUserId === userId) {
        await this.redis.del(key);
      }
    }
  }

  // Cookie utility functions
  setSecureCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const isProduction = this.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: this.JWT_EXPIRES_IN,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: this.JWT_REFRESH_EXPIRES_IN,
      path: '/',
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  // Helper function to exclude password from user object
  excludePassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Middleware factory methods
  createAuthenticateMiddleware(users: User[]) {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        // Try cookie first, then Authorization header
        let token = req.cookies?.accessToken;

        if (!token) {
          const authHeader = req.headers['authorization'];
          token = authHeader && authHeader.split(' ')[1];
        }

        if (!token) {
          res.status(401).json({ error: 'Access token required' });
          return;
        }

        const decoded = this.verifyAccessToken(token);
        if (!decoded) {
          res.status(403).json({ error: 'Invalid or expired access token' });
          return;
        }

        const user = users.find(u => u.id === decoded['userId']);
        if (!user) {
          res.status(403).json({ error: 'User not found' });
          return;
        }

        req.user = user;
        next();
      } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  createCSRFProtectionMiddleware() {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        // Skip CSRF for GET, HEAD, OPTIONS
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return next();
        }

        const csrfToken = req.headers['x-csrf-token'] as string;

        if (!csrfToken) {
          res.status(403).json({ error: 'CSRF token required' });
          return;
        }

        // Get user from token first
        let token = req.cookies?.accessToken;
        if (!token) {
          const authHeader = req.headers['authorization'];
          token = authHeader && authHeader.split(' ')[1];
        }

        if (!token) {
          res
            .status(401)
            .json({ error: 'Access token required for CSRF validation' });
          return;
        }

        const decoded = this.verifyAccessToken(token);
        if (!decoded) {
          res.status(403).json({ error: 'Invalid access token' });
          return;
        }

        const storedCSRFToken = await this.getCSRFToken(decoded['userId']);
        if (
          !storedCSRFToken ||
          !this.verifyCSRFToken(csrfToken, storedCSRFToken)
        ) {
          res.status(403).json({ error: 'Invalid CSRF token' });
          return;
        }

        req.csrfToken = csrfToken;
        next();
      } catch (error) {
        console.error('CSRF protection error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }
}
