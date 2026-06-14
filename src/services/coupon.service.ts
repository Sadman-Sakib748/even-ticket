import Coupon, { ICoupon, ICouponReservation } from '../models/Coupon.model';
import mongoose, { Types } from 'mongoose';

class CouponService {
  async createCoupon(data: any, userId: string): Promise<ICoupon> {
    const existingCoupon = await Coupon.findOne({
      code: data.code.toUpperCase(),
    });

    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    const coupon = await Coupon.create({
      ...data,
      code: data.code.toUpperCase(),
      validFrom: new Date(data.validFrom),
      validTo: new Date(data.validTo),
      createdBy: new Types.ObjectId(userId),
      reservedBy: []
    });

    return coupon;
  }

  async getAllCoupons(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find()
        .populate('createdBy', 'name email')
        .populate('applicableEvents', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments(),
    ]);

    return {
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCouponById(id: string): Promise<ICoupon> {
    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableEvents', 'title slug');

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    return coupon;
  }

  async updateCoupon(id: string, data: any): Promise<ICoupon> {
    const updateData: any = { ...data };

    if (data.validFrom) {
      updateData.validFrom = new Date(data.validFrom);
    }

    if (data.validTo) {
      updateData.validTo = new Date(data.validTo);
    }

    if (data.code) {
      updateData.code = data.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    return coupon;
  }

  async deleteCoupon(id: string) {
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    return {
      message: 'Coupon deleted successfully',
    };
  }

  async verifyCoupon(couponCode: string, eventId: string, ticketType: string, subtotal: number) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    const now = new Date();

    if (now < coupon.validFrom || now > coupon.validTo) {
      throw new Error('Coupon has expired');
    }

    const reservedCount = coupon.reservedBy?.length || 0;

    if (coupon.usageLimit && (coupon.usedCount + reservedCount) >= coupon.usageLimit) {
      throw new Error('Coupon usage limit exceeded');
    }

    if (subtotal < coupon.minPurchase) {
      throw new Error(`Minimum purchase amount is ${coupon.minPurchase}`);
    }

    if (coupon.applicableEvents && coupon.applicableEvents.length > 0) {
      const applicable = coupon.applicableEvents.some(
        (id: Types.ObjectId) => id.toString() === eventId
      );

      if (!applicable) {
        throw new Error('Coupon is not applicable for this event');
      }
    }

    if (coupon.applicableTicketTypes && coupon.applicableTicketTypes.length > 0) {
      const isValidTicketType = coupon.applicableTicketTypes.includes(
        ticketType as 'regular' | 'vip' | 'vvip'
      );
      
      if (!isValidTicketType) {
        throw new Error(`Coupon is not applicable for ${ticketType} tickets`);
      }
    }

    let discountAmount = 0;

    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;

      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      valid: true,
      discountAmount,
      finalAmount: subtotal - discountAmount,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    };
  }
}

export default new CouponService();