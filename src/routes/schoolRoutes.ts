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

router.get(
  '/:id/employment-history',
  generalLimiter,
  schoolController.getSchoolEmploymentHistory
);
router.get(
  '/:id/teacher-assignments',
  generalLimiter,
  schoolController.getSchoolTeacherAssignments
);
router.get(
  '/:id/current-teachers',
  generalLimiter,
  schoolController.getSchoolCurrentTeachers
);
router.get(
  '/:id/teacher-summary',
  generalLimiter,
  schoolController.getSchoolTeacherSummary
);

export { router as schoolRoutes };
