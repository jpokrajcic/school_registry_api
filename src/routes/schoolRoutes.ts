// schoolRoutes.ts
import express from 'express';
import { schoolController } from '../controllers/schoolController';
import { authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

export const router = express.Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

router.get('/', schoolController.getAll);
router.get('/:id', schoolController.getById);

router.use(authMiddleware.csrfProtection);

router.post('/', schoolController.create);
router.put('/:id', schoolController.update);
router.delete('/:id', schoolController.delete);

export { router as schoolRoutes };
