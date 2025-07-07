import { Router } from 'express';
import { subjectController } from '../controllers/subjectController';
import { authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

const router = Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

router.get('/', generalLimiter, subjectController.getAll);
router.get('/:id', generalLimiter, subjectController.getById);
router.get('/code/:code', generalLimiter, subjectController.getByCode);

router.use(authMiddleware.csrfProtection);

router.post('/', generalLimiter, subjectController.create);
router.put('/:id', generalLimiter, subjectController.update);
router.delete('/:id', generalLimiter, subjectController.delete);

export { router as subjectRoutes };
