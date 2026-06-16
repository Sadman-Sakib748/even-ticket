import { z } from 'zod';

export const createTransactionSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  ticketType: z.enum(['regular', 'vip', 'vvip']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per purchase'),
  couponCode: z.string().optional(),
  paymentGateway: z.enum(['sslcommerz', 'stripe', 'paypal']).default('sslcommerz')
});

export const paymentCallbackSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  gatewayTransactionId: z.string().min(1, 'Gateway transaction ID is required'),
  paymentStatus: z.enum(['success', 'failed']),
  paymentMethod: z.string().optional()
});