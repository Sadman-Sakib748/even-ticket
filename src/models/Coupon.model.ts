import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICouponReservation {
  userId: Types.ObjectId;
  reservedAt: Date;
}

export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minPurchase: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  applicableEvents?: Types.ObjectId[];
  applicableTicketTypes?: ('regular' | 'vip' | 'vvip')[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  reservedBy: ICouponReservation[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponReservationSchema = new Schema<ICouponReservation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reservedAt: { type: Date, default: Date.now }
});

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number, default: null },
    minPurchase: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    applicableEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    applicableTicketTypes: [{ type: String, enum: ['regular', 'vip', 'vvip'] }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reservedBy: [CouponReservationSchema]
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

export default mongoose.model<ICoupon>('Coupon', CouponSchema);