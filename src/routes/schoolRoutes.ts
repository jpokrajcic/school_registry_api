// schoolRoutes.ts
import express from 'express';
import { schoolController } from '../controllers/schoolController';

export const router = express.Router();

// CRUD routes
router.post('/', schoolController.create);
router.get('/', schoolController.getAll);
router.get('/:id', schoolController.getById);
router.put('/:id', schoolController.update);
router.delete('/:id', schoolController.delete);

export { router as schoolRoutes };
