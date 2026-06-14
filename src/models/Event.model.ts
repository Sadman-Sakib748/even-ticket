import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  fullDescription?: string;
  date: Date;
  time: string;
  endTime?: string;
  location: string;
  venue?: string;
  image?: string;
  gallery?: string[];
  tags?: string[];
  category?: mongoose.Schema.Types.ObjectId;
  organizerId: mongoose.Schema.Types.ObjectId;
  ticketTypes: {
    regular: { price: number; total: number; sold: number; available: boolean; maxPerUser: number };
    vip: { price: number; total: number; sold: number; available: boolean; maxPerUser: number };
    vvip: { price: number; total: number; sold: number; available: boolean; maxPerUser: number };
  };
  ticketsSold: number;
  totalRevenue: number;
  views: number;
  isFeatured: boolean;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    fullDescription: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    endTime: { type: String },
    location: { type: String, required: true },
    venue: { type: String },
    image: { type: String },
    gallery: [{ type: String }],
    tags: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTypes: {
      regular: {
        price: { type: Number, required: true, default: 0 },
        total: { type: Number, required: true, default: 0 },
        sold: { type: Number, default: 0 },
        available: { type: Boolean, default: true },
        maxPerUser: { type: Number, default: 10 }
      },
      vip: {
        price: { type: Number, required: true, default: 0 },
        total: { type: Number, required: true, default: 0 },
        sold: { type: Number, default: 0 },
        available: { type: Boolean, default: true },
        maxPerUser: { type: Number, default: 10 }
      },
      vvip: {
        price: { type: Number, required: true, default: 0 },
        total: { type: Number, required: true, default: 0 },
        sold: { type: Number, default: 0 },
        available: { type: Boolean, default: true },
        maxPerUser: { type: Number, default: 10 }
      }
    },
    ticketsSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' }
  },
  { timestamps: true }
);

EventSchema.index({ slug: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ category: 1 });

export default mongoose.model<IEvent>('Event', EventSchema);