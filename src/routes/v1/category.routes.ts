import { Router } from 'express';
import categoryController from '../../controllers/category.controller';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', (req, res) => categoryController.getAllCategories(req, res));

// Admin routes
router.post('/', authMiddleware, adminMiddleware, (req, res) => 
  categoryController.createCategory(req, res)
);
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => 
  categoryController.updateCategory(req, res)
);
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => 
  categoryController.deleteCategory(req, res)
);

export default router;