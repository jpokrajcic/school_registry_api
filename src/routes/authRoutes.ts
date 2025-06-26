import express from 'express';
import { authController, authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

export const router = express.Router();

const authLimiter = SecurityConfig.getAuthLimiter();

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.use(authMiddleware.authenticate); // Apply authentication to all routes below

router.get('/csrf-token', authController.getCSRFToken);
router.get('/logout', authController.logout);

router.use(authMiddleware.csrfProtection); // Apply authentication to all routes below
router.post('/logout-all', authController.logoutAll);

export { router as authRoutes };
