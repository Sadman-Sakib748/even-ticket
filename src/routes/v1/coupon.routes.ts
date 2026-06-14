import { Router } from 'express';
import couponController from '../../controllers/coupon.controller';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/verify', couponController.verifyCoupon.bind(couponController));

// Admin only routes
router.post('/', authMiddleware, adminMiddleware, couponController.createCoupon.bind(couponController));
router.get('/', authMiddleware, adminMiddleware, couponController.getAllCoupons.bind(couponController));
router.get('/:id', authMiddleware, adminMiddleware, couponController.getCouponById.bind(couponController));
router.put('/:id', authMiddleware, adminMiddleware, couponController.updateCoupon.bind(couponController));
router.delete('/:id', authMiddleware, adminMiddleware, couponController.deleteCoupon.bind(couponController));

export default router;