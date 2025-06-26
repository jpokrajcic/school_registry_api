import { type AuthenticatedRequest } from './../types/general';
import { handleValidationError } from '../errorHandler';
import { type Request, type Response } from 'express';
import { handleError } from '../errorHandler';
import { userService } from '../services/userService';
import { createUserSchema, type SafeUserOutput } from '../schemas/userSchema';
import { loginSchema } from '../schemas/authSchema';
import { AuthService } from '../services/authService';
import { getRedisClient } from '../redis/redisClient';
import { AuthMiddleware } from '../middleware/authMiddleware';

export class AuthController {
  public authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // CSRF Token endpoint
  getCSRFToken = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const csrfToken = this.authService.generateCSRFToken();
      await this.authService.storeCSRFToken(csrfToken, req.user.id);

      res.status(200).json({
        success: true,
        message: 'CSRF token successfully generated',
        csrfToken,
      });
    } catch (error) {
      handleError('Failed to generate CSRF token', error, res);
    }
  };

  // Register
  register = async (req: Request, res: Response): Promise<void> => {
    const validationResult = await createUserSchema.safeParseAsync(req.body);

    if (handleValidationError('REGISTER USER', validationResult, res)) return;

    if (validationResult.success) {
      try {
        // Check if user already exists
        const existingUser = await userService.getUserByEmail(
          validationResult.data.email
        );

        if (existingUser) {
          res
            .status(409)
            .json({ error: 'User with this email already exists' });
          return;
        }

        const createdUser = await userService.createUser(validationResult.data);

        if (!createdUser) {
          res.status(404).json({
            success: false,
            message: 'User could not be registred',
          });
          return;
        }
        const newUser: SafeUserOutput = createdUser;

        // Generate tokens
        const tokens = this.authService.generateTokens(createdUser.id);
        const csrfToken = this.authService.generateCSRFToken();

        await Promise.all([
          this.authService.storeRefreshToken(
            tokens.refreshToken,
            createdUser.id
          ),
          this.authService.storeCSRFToken(csrfToken, createdUser.id),
        ]);

        this.authService.setSecureCookies(
          res,
          tokens.accessToken,
          tokens.refreshToken
        );

        res.status(200).json({
          success: true,
          data: newUser, // TODO return user profile here
          message: 'User registered successfully',
          csrfToken,
        });
      } catch (error) {
        handleError('Failed to register user', error, res);
      }
    }
  };

  // Login
  login = async (req: Request, res: Response): Promise<void> => {
    const validationResult = loginSchema.safeParse(req.body);

    if (handleValidationError('LOGIN USER', validationResult, res)) return;

    if (validationResult.success) {
      try {
        const user = await userService.getFullUserByEmail(
          validationResult.data.email
        );

        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User could not be found',
          });
          return;
        }

        // Verify password
        const isValidPassword = await this.authService.comparePassword(
          validationResult.data.password,
          user.passwordHash
        );
        if (!isValidPassword) {
          res.status(401).json({ error: 'Invalid credentials' });
          return;
        }

        // Generate tokens and set secure cookies
        const tokens = this.authService.generateTokens(user.id);
        const csrfToken = this.authService.generateCSRFToken();

        await Promise.all([
          this.authService.storeRefreshToken(tokens.refreshToken, user.id),
          this.authService.storeCSRFToken(csrfToken, user.id),
        ]);

        this.authService.setSecureCookies(
          res,
          tokens.accessToken,
          tokens.refreshToken
        );

        res.status(200).json({
          success: true,
          message: 'User logged in successfully',
          csrfToken,
        });
      } catch (error) {
        handleError('Failed to log in', error, res);
      }
    }
  };

  // Refresh tokens
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      let refreshToken = req.cookies['refreshToken'];

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      const result = await this.authService.refreshTokens(refreshToken);

      if (!result.success) {
        this.authService.clearAuthCookies(res);
        res.status(403).json({
          success: false,
          error: result.error,
        });
        return;
      }

      // Set new secure cookies
      this.authService.setSecureCookies(
        res,
        result.tokens!.accessToken,
        result.tokens!.refreshToken
      );

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        csrfToken: result.csrfToken,
      });
    } catch (error) {
      handleError('Failed to refresh tokens', error, res);
    }
  };

  // Logout
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies['refreshToken'];

      if (refreshToken) {
        const storedUserId =
          await this.authService.getRefreshTokenUserId(refreshToken);
        if (storedUserId) {
          await this.authService.deleteRefreshToken(refreshToken);
          await this.authService.deleteCSRFToken(storedUserId);
        }
      }

      this.authService.clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'User logged out successfully',
      });
    } catch (error) {
      handleError('Failed to log out', error, res);
    }
  };

  // Logout from all devices
  logoutAll = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (req.user) {
        await this.authService.deleteAllUserRefreshTokens(
          req.user.id.toString()
        );
        await this.authService.deleteCSRFToken(req.user.id.toString());
      }

      this.authService.clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      handleError('Failed to log out from all devices', error, res);
    }
  };
}

const authService = new AuthService(getRedisClient());
const authMiddleware = new AuthMiddleware(authService);
export const authController = new AuthController(authService);
export { authMiddleware };
