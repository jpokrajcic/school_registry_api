import express from 'express';
import { authController } from '../controllers/authController';

export const router = express.Router();

router.post('/register', authController.register);
router.get('/', authController.login);
router.get('/:id', authController.logout);
// router.put('/:id', authController.update);

export { router as authRoutes };
