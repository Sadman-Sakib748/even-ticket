import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketNumber: string;
  transactionId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  eventId: mongoose.Schema.Types.ObjectId;
  ticketType: 'regular' | 'vip' | 'vvip';
  qrCode: string;
  status: 'active' | 'used' | 'cancelled' | 'refunded';
  usedAt?: Date;
  scannedBy?: mongoose.Schema.Types.ObjectId;
  pdfUrl?: string;
  emailSent: boolean;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketType: { type: String, enum: ['regular', 'vip', 'vvip'], required: true },
    qrCode: { type: String, required: true },
    status: { type: String, enum: ['active', 'used', 'cancelled', 'refunded'], default: 'active' },
    usedAt: Date,
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pdfUrl: String,
    emailSent: { type: Boolean, default: false },
    refundedAt: Date
  },
  { timestamps: true }
);

TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ eventId: 1 });
TicketSchema.index({ status: 1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema);