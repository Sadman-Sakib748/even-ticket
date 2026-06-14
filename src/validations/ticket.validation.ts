import { z } from 'zod';

export const verifyTicketSchema = z.object({
  ticketNumber: z.string().min(10, 'Invalid ticket number')
});

export const cancelTicketSchema = z.object({
  ticketNumber: z.string().min(10, 'Invalid ticket number')
});