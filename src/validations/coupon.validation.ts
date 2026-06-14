import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).transform(val => val.toUpperCase()),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minPurchase: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional(),
  validFrom: z.string().datetime().transform(val => new Date(val)),
  validTo: z.string().datetime().transform(val => new Date(val)),
  usageLimit: z.number().positive().optional(),
  applicableEvents: z.array(z.string()).optional(),
  applicableTicketTypes: z.array(z.enum(['regular', 'vip', 'vvip'])).default(['regular', 'vip', 'vvip']),
  isActive: z.boolean().default(true)
});

export const updateCouponSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().positive().optional(),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().positive().optional(),
  validFrom: z.string().datetime().transform(val => new Date(val)).optional(),
  validTo: z.string().datetime().transform(val => new Date(val)).optional(),
  usageLimit: z.number().positive().optional(),
  applicableEvents: z.array(z.string()).optional(),
  applicableTicketTypes: z.array(z.enum(['regular', 'vip', 'vvip'])).optional(),
  isActive: z.boolean().optional()
});

export const verifyCouponSchema = z.object({
  code: z.string().min(3).transform(val => val.toUpperCase()),
  eventId: z.string(),
  ticketType: z.enum(['regular', 'vip', 'vvip']),
  subtotal: z.number().positive()
});