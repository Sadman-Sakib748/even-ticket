import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  userId: mongoose.Schema.Types.ObjectId;
  eventId: mongoose.Schema.Types.ObjectId;
  ticketType: 'regular' | 'vip' | 'vvip';
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentGateway: 'sslcommerz' | 'stripe' | 'paypal';
  paymentStatus: 'pending' | 'success' | 'failed' | 'refunded';
  transactionDetails?: {
    gatewayTransactionId?: string;
    paymentMethod?: string;
    bankTransactionId?: string;
    paymentTime?: Date;
    failureReason?: string;
  };
  refundDetails?: {
    isRefunded: boolean;
    refundAmount: number;
    refundReason?: string;
    refundTime?: Date;
    approvedBy?: mongoose.Schema.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketType: { type: String, enum: ['regular', 'vip', 'vvip'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: String,
    totalAmount: { type: Number, required: true },
    paymentGateway: { type: String, enum: ['sslcommerz', 'stripe', 'paypal'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
    transactionDetails: {
      gatewayTransactionId: String,
      paymentMethod: String,
      bankTransactionId: String,
      paymentTime: Date,
      failureReason: String
    },
    refundDetails: {
      isRefunded: { type: Boolean, default: false },
      refundAmount: { type: Number, default: 0 },
      refundReason: String,
      refundTime: Date,
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ eventId: 1 });
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ paymentStatus: 1, createdAt: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);