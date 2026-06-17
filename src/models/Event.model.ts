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
    title: { 
      type: String, 
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters']
    },
    slug: { 
      type: String, 
      required: [true, 'Slug is required'], 
      unique: true,
      trim: true
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters']
    },
    fullDescription: { type: String },
    date: { 
      type: Date, 
      required: [true, 'Date is required'],
      validate: {
        validator: function(value: Date) {
          return value >= new Date();
        },
        message: 'Event date must be in the future'
      }
    },
    time: { 
      type: String, 
      required: [true, 'Time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    endTime: { 
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'],
      trim: true,
      minlength: [5, 'Location must be at least 5 characters']
    },
    venue: { type: String, trim: true },
    image: { type: String },
    gallery: [{ type: String }],
    tags: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    organizerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Organizer is required'] 
    },
    ticketTypes: {
      regular: {
        price: { type: Number, required: true, default: 0, min: 0 },
        total: { type: Number, required: true, default: 0, min: 0 },
        sold: { type: Number, default: 0, min: 0 },
        available: { type: Boolean, default: true },
        maxPerUser: { type: Number, default: 10, min: 1 }
      },
      vip: {
        price: { type: Number, required: true, default: 0, min: 0 },
        total: { type: Number, required: true, default: 0, min: 0 },
        sold: { type: Number, default: 0, min: 0 },
        available: { type: Boolean, default: true },
        maxPerUser: { type: Number, default: 5, min: 1 }
      },
      vvip: {
        price: { type: Number, required: true, default: 0, min: 0 },
        total: { type: Number, required: true, default: 0, min: 0 },
        sold: { type: Number, default: 0, min: 0 },
        available: { type: Boolean, default: true },
        maxPerUser: { type: Number, default: 3, min: 1 }
      }
    },
    ticketsSold: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['active', 'cancelled', 'completed'], 
      default: 'active' 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
EventSchema.index({ slug: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ organizerId: 1 });
EventSchema.index({ createdAt: -1 });

// Virtual fields
EventSchema.virtual('totalTickets').get(function() {
  const regular = this.ticketTypes.regular.total || 0;
  const vip = this.ticketTypes.vip.total || 0;
  const vvip = this.ticketTypes.vvip.total || 0;
  return regular + vip + vvip;
});

EventSchema.virtual('availableTickets').get(function() {
  const regular = this.ticketTypes.regular.total - this.ticketTypes.regular.sold || 0;
  const vip = this.ticketTypes.vip.total - this.ticketTypes.vip.sold || 0;
  const vvip = this.ticketTypes.vvip.total - this.ticketTypes.vvip.sold || 0;
  return regular + vip + vvip;
});

export default mongoose.model<IEvent>('Event', EventSchema);