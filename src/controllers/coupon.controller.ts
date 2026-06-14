import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import couponService from '../services/coupon.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { 
  createCouponSchema, 
  updateCouponSchema, 
  verifyCouponSchema 
} from '../validations/coupon.validation';
import { ZodError } from 'zod';

class CouponController {
  async createCoupon(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = createCouponSchema.parse(req.body);
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }
      
      const couponData = {
        ...validated,
        validFrom: validated.validFrom instanceof Date ? validated.validFrom : new Date(validated.validFrom as any),
        validTo: validated.validTo instanceof Date ? validated.validTo : new Date(validated.validTo as any),
      };
      
      const coupon = await couponService.createCoupon(couponData, req.user.userId);
      sendSuccess(res, 201, 'Coupon created successfully', coupon);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      sendError(res, 400, error instanceof Error ? error.message : 'Failed to create coupon');
    }
  }

  async getAllCoupons(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await couponService.getAllCoupons(page, limit);
      sendSuccess(res, 200, 'Coupons fetched successfully', result);
    } catch (error) {
      sendError(res, 400, error instanceof Error ? error.message : 'Failed to fetch coupons');
    }
  }

  async getCouponById(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await couponService.getCouponById(req.params.id);
      sendSuccess(res, 200, 'Coupon fetched successfully', coupon);
    } catch (error) {
      sendError(res, 400, error instanceof Error ? error.message : 'Failed to fetch coupon');
    }
  }

  async updateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const validated = updateCouponSchema.parse(req.body);
      
      const updateData: any = { ...validated };
      if (validated.validFrom) {
        updateData.validFrom = validated.validFrom instanceof Date ? validated.validFrom : new Date(validated.validFrom as any);
      }
      if (validated.validTo) {
        updateData.validTo = validated.validTo instanceof Date ? validated.validTo : new Date(validated.validTo as any);
      }
      
      const coupon = await couponService.updateCoupon(req.params.id, updateData);
      sendSuccess(res, 200, 'Coupon updated successfully', coupon);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      sendError(res, 400, error instanceof Error ? error.message : 'Failed to update coupon');
    }
  }

  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const result = await couponService.deleteCoupon(req.params.id);
      sendSuccess(res, 200, result.message);
    } catch (error) {
      sendError(res, 400, error instanceof Error ? error.message : 'Failed to delete coupon');
    }
  }

  async verifyCoupon(req: Request, res: Response): Promise<void> {
    try {
      const validated = verifyCouponSchema.parse(req.body);
      const result = await couponService.verifyCoupon(
        validated.code,
        validated.eventId,
        validated.ticketType,
        validated.subtotal
      );
      sendSuccess(res, 200, 'Coupon verified successfully', result);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      sendError(res, 400, error instanceof Error ? error.message : 'Failed to verify coupon');
    }
  }
}

export default new CouponController();