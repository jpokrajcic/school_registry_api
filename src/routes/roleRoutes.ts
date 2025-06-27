import express from 'express';
import { roleController } from '../controllers/roleController';
import { SecurityConfig } from '../config/securityConfig';
import { authMiddleware } from '../controllers/authController';

export const router = express.Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

router.get('/', generalLimiter, roleController.getAll);
router.get('/:id', generalLimiter, roleController.getById);

router.use(authMiddleware.csrfProtection);

router.post('/', generalLimiter, roleController.create);
router.put('/:id', generalLimiter, roleController.update);
router.delete('/:id', generalLimiter, roleController.delete);

export { router as roleRoutes };
