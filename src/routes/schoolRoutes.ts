// schoolRoutes.ts
import express from 'express';
import { schoolController } from '../controllers/schoolController';
import { authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

export const router = express.Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

router.get('/', generalLimiter, schoolController.getAll);
router.get('/:id', generalLimiter, schoolController.getById);

router.use(authMiddleware.csrfProtection);

router.post('/', generalLimiter, schoolController.create);
router.put('/:id', generalLimiter, schoolController.update);
router.delete('/:id', generalLimiter, schoolController.delete);

export { router as schoolRoutes };
