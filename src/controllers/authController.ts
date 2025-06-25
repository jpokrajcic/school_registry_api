import { handleValidationError } from '../middleware/errorHandler';
import { type Request, type Response } from 'express';
import { handleDatabaseError } from '../middleware/errorHandler';
import { userService } from '../services/userService';
import { createUserSchema, type SafeUserOutput } from '../schemas/userSchema';
import { loginSchema } from '../schemas/authSchema';
import { AuthService } from '../services/authService';
import { getRedisClient } from '../redis/redisClient';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

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
        const { accessToken, refreshToken } = this.authService.generateTokens(
          newUser.id
        );

        await this.authService.storeRefreshToken(refreshToken, newUser.id);

        // Generate CSRF token
        const csrfToken = this.authService.generateCSRFToken();
        await this.authService.storeCSRFToken(csrfToken, newUser.id);

        // Set secure cookies
        this.authService.setSecureCookies(res, accessToken, refreshToken);

        res.status(200).json({
          success: true,
          data: newUser, // TODO return user profile here
          message: 'User registered successfully',
          csrfToken,
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to register user');
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

        // Generate tokens
        const { accessToken, refreshToken } = this.authService.generateTokens(
          user.id
        );
        await this.authService.storeRefreshToken(refreshToken, user.id);

        // Generate CSRF token
        const csrfToken = this.authService.generateCSRFToken();
        await this.authService.storeCSRFToken(csrfToken, user.id);

        // Set secure cookies
        this.authService.setSecureCookies(res, accessToken, refreshToken);

        const { passwordHash, ...userWithoutPassword } = user;
        res.status(200).json({
          success: true,
          data: userWithoutPassword, // TODO return user profile here
          message: 'User logged in successfully',
          csrfToken,
        });
      } catch (error) {
        handleDatabaseError(res, error, 'Failed to log in');
      }
    }
  };

  // Refresh tokens
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      let refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      // Check if refresh token exists in Redis
      const storedUserId =
        await this.authService.getRefreshTokenUserId(refreshToken);
      if (!storedUserId) {
        this.authService.clearAuthCookies(res);
        res.status(403).json({ error: 'Invalid refresh token' });
        return;
      }

      // Verify refresh token
      const decoded = this.authService.verifyRefreshToken(refreshToken);
      if (!decoded || decoded['userId'] !== storedUserId) {
        await this.authService.deleteRefreshToken(refreshToken);
        this.authService.clearAuthCookies(res);
        res.status(403).json({ error: 'Invalid or expired refresh token' });
        return;
      }

      // Find user
      const user = await userService.getUserById(decoded['userId']);
      if (!user) {
        await this.authService.deleteRefreshToken(refreshToken);
        this.authService.clearAuthCookies(res);
        res.status(403).json({ error: 'User not found' });
        return;
      }

      // Generate new tokens
      const newTokens = this.authService.generateTokens(user.id);

      // Remove old refresh token and store new one
      await this.authService.deleteRefreshToken(refreshToken);
      await this.authService.storeRefreshToken(newTokens.refreshToken, user.id);

      // Generate new CSRF token
      const csrfToken = this.authService.generateCSRFToken();
      await this.authService.storeCSRFToken(csrfToken, user.id);

      // Set new secure cookies
      this.authService.setSecureCookies(
        res,
        newTokens.accessToken,
        newTokens.refreshToken
      );

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        csrfToken,
      });
    } catch (error) {
      handleDatabaseError(res, error, 'Failed to refresh tokens');
    }
  }

  // Logout
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;

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
      handleDatabaseError(res, error, 'Failed to log out');
    }
  };

  // TODO Implement this later
  // Logout from all devices
  //   logoutAll = async (
  //     req: Request,
  //     res: Response
  //   ): Promise<void> => {
  //     try {
  //       if (req.user) {
  //         await this.authService.deleteAllUserRefreshTokens(req.user.id);
  //         await this.authService.deleteCSRFToken(req.user.id);
  //       }

  //       this.authService.clearAuthCookies(res);
  //       res.json({ message: 'Logged out from all devices successfully' });
  //     } catch (error) {
  //       console.error('Logout all error:', error);
  //       res.status(500).json({ error: 'Internal server error' });
  //     }
  //   };
}

export const authController = new AuthController(
  new AuthService(getRedisClient())
);
