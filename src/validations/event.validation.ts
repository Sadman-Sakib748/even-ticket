import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  fullDescription: z.string().optional(),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  venue: z.string().optional(),
  category: z.string().optional(),
  image: z.string().url('Invalid image URL').optional(),
  gallery: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  ticketTypes: z.object({
    regular: z.object({
      price: z.number().min(0, 'Price cannot be negative'),
      total: z.number().min(0, 'Total cannot be negative'),
      available: z.boolean().default(true),
      maxPerUser: z.number().int().min(1).default(10),
    }),
    vip: z.object({
      price: z.number().min(0, 'Price cannot be negative'),
      total: z.number().min(0, 'Total cannot be negative'),
      available: z.boolean().default(true),
      maxPerUser: z.number().int().min(1).default(10),
    }),
    vvip: z.object({
      price: z.number().min(0, 'Price cannot be negative'),
      total: z.number().min(0, 'Total cannot be negative'),
      available: z.boolean().default(true),
      maxPerUser: z.number().int().min(1).default(10),
    }),
  }),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;