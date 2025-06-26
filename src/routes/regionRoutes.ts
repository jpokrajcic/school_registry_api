import { Router } from 'express';
import { regionController } from '../controllers/regionController';
import { authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

const router = Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

router.get('/', generalLimiter, regionController.getAll);
router.get('/:id', generalLimiter, regionController.getById);

router.use(authMiddleware.csrfProtection);

router.post('/', generalLimiter, regionController.create);
router.put('/:id', generalLimiter, regionController.update);
router.delete('/:id', generalLimiter, regionController.delete);

export { router as regionRoutes };
