import express from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

export const router = express.Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

router.get('/', generalLimiter, userController.getAll);
router.get('/:id', generalLimiter, userController.getById);

router.use(authMiddleware.csrfProtection);

router.post('/', generalLimiter, userController.create);
router.put('/:id', generalLimiter, userController.update);
router.delete('/:id', generalLimiter, userController.delete);

export { router as userRoutes };
