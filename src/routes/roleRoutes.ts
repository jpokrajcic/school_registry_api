import express from 'express';
import { roleController } from '../controllers/roleController';

export const router = express.Router();

// CRUD routes
router.post('/', roleController.create);
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);

export { router as roleRoutes };
