import { type Response, type NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { userService } from '../services/userService';
import type { AuthenticatedRequest } from '../types/general';
import logger from '../logger';

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  // Authentication middleware
  authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Access token required',
        });
        return;
      }

      const decoded = this.authService.verifyAccessToken(token);
      if (!decoded) {
        res.status(403).json({
          success: false,
          error: 'Invalid or expired access token',
        });
        return;
      }

      const user = await userService.getUserById(decoded['userId']);
      if (!user) {
        res.status(403).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  };

  // CSRF protection middleware
  csrfProtection = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Skip CSRF for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required for CSRF validation',
        });
        return;
      }

      const csrfToken = req.headers['x-csrf-token'] as string;
      if (!csrfToken) {
        res.status(403).json({
          success: false,
          error: 'CSRF token required',
        });
        return;
      }

      const isValid = await this.authService.validateCSRFToken(
        csrfToken,
        req.user.id
      );
      if (!isValid) {
        res.status(403).json({
          success: false,
          error: 'Invalid CSRF token',
        });
        return;
      }

      req.csrfToken = csrfToken;
      next();
    } catch (error) {
      logger.error('CSRF validation error:', error);
      res.status(500).json({
        success: false,
        error: 'CSRF validation failed',
      });
    }
  };

  private extractToken(req: AuthenticatedRequest): string | null {
    // Try cookie first, then Authorization header
    const cookieToken = req.cookies['accessToken'];
    if (cookieToken) return cookieToken;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
