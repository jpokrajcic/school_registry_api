import express from 'express';
import { userController } from '../controllers/userController';

export const router = express.Router();

// CRUD routes
router.post('/', userController.create);
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

export { router as userRoutes };
