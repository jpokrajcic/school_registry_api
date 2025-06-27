import { Router } from 'express';
import { studentController } from '../controllers/studentController';
import { authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

const router = Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

// Read-only routes
router.get(
  '/statistics',
  generalLimiter,
  studentController.getStudentStatistics
);
router.get('/', generalLimiter, studentController.getStudents);
router.get('/:id', generalLimiter, studentController.getStudentById);

// CSRF protection for write operations
router.use(authMiddleware.csrfProtection);

// Regular operations
router.post('/', generalLimiter, studentController.createStudent);
router.put('/:id', generalLimiter, studentController.updateStudent);
router.patch(
  '/:id/deactivate',
  generalLimiter,
  studentController.softDeleteStudent
);
router.patch(
  '/:id/reactivate',
  generalLimiter,
  studentController.reactivateStudent
);
router.patch(
  '/:id/transfer',
  generalLimiter,
  studentController.transferStudent
);
router.delete('/:id', generalLimiter, studentController.deleteStudent);
router.post('/bulk', generalLimiter, studentController.createStudents);

export { router as studentRoutes };
