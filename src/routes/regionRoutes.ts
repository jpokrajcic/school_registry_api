import { Router } from 'express';
import { regionController } from '../controllers/regionController';

const router = Router();

// CRUD routes
router.post('/', regionController.create);
router.get('/', regionController.getAll);
router.get('/:id', regionController.getById);
router.put('/:id', regionController.update);
router.delete('/:id', regionController.delete);

export { router as regionRoutes };
