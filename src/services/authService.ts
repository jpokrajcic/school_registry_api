import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import Redis from 'ioredis';
import { type Response } from 'express';
import type { AuthTokens } from '../types/general';
import { userService } from './userService';

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

  async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // CSRF Token utilities
  generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyCSRFToken(token: string, storedToken: string): boolean {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
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

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: this.JWT_EXPIRES_IN * 1000, // Convert to milliseconds
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: this.JWT_REFRESH_EXPIRES_IN * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  // Improved CSRF validation
  async validateCSRFToken(token: string, userId: number): Promise<boolean> {
    try {
      const storedToken = await this.getCSRFToken(userId.toString());
      if (!storedToken) return false;

      // Verify csrf token
      return this.verifyCSRFToken(token, storedToken);
    } catch (error) {
      console.error('CSRF validation error:', error);
      return false;
    }
  }

  // Token refresh with rotation
  async refreshTokens(refreshToken: string): Promise<{
    success: boolean;
    tokens?: AuthTokens;
    csrfToken?: string;
    error?: string;
  }> {
    try {
      // Check if refresh token exists in Redis
      const storedUserId = await this.getRefreshTokenUserId(refreshToken);
      if (!storedUserId) {
        return { success: false, error: 'Invalid refresh token' };
      }

      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      if (!decoded || decoded['userId'] !== parseInt(storedUserId)) {
        await this.deleteRefreshToken(refreshToken);
        return { success: false, error: 'Token mismatch' };
      }

      // Find user
      const user = await userService.getUserById(decoded['userId']);
      if (!user) {
        await this.deleteRefreshToken(refreshToken);
        return { success: false, error: 'User not found' };
      }

      // Generate new tokens
      const newTokens = this.generateTokens(user.id);
      const csrfToken = this.generateCSRFToken();

      // Rotate refresh tokens
      await this.deleteRefreshToken(refreshToken);
      await this.storeRefreshToken(newTokens.refreshToken, user.id);
      await this.storeCSRFToken(csrfToken, user.id);

      return {
        success: true,
        tokens: newTokens,
        csrfToken,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }
}
