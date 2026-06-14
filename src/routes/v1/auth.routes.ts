import { Router } from 'express';
import authController from '../../controllers/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

// Protected routes
router.get('/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res));
router.put('/profile', authMiddleware, (req, res) => authController.updateProfile(req, res));
router.put('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));

export default router;