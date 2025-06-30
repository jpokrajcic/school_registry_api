import { Router } from 'express';
import { teacherController } from '../controllers/teacherController';
import { authMiddleware } from '../controllers/authController';
import { SecurityConfig } from '../config/securityConfig';

const router = Router();

const generalLimiter = SecurityConfig.getGeneralLimiter();

// Protected routes
router.use(authMiddleware.authenticate);

// Main read operations
router.get('/', generalLimiter, teacherController.getTeachers);
router.get('/:id', generalLimiter, teacherController.getTeacherById);

router.use(authMiddleware.csrfProtection);

router.post('/', generalLimiter, teacherController.createTeacher);
router.post('/bulk', generalLimiter, teacherController.createTeachers);
router.put('/:id', generalLimiter, teacherController.updateTeacher);
router.delete('/:id', generalLimiter, teacherController.deleteTeacher);

export { router as teacherRoutes };
