import { z } from 'zod';

export const createTransactionSchema = z.object({
  eventId: z.string(),
  ticketType: z.enum(['regular', 'vip', 'vvip']),
  quantity: z.number().int().min(1).max(10),
  couponCode: z.string().optional(),
  paymentGateway: z.enum(['sslcommerz', 'stripe', 'paypal']).default('sslcommerz')
});

export const paymentCallbackSchema = z.object({
  transactionId: z.string(),
  gatewayTransactionId: z.string(),
  paymentStatus: z.enum(['success', 'failed']),
  paymentMethod: z.string().optional()
});