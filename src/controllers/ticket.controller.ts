import { Request, Response } from 'express';
import ticketService from '../services/ticket.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { verifyTicketSchema } from '../validations/ticket.validation';
import { ZodError } from 'zod';

class TicketController {
  async getUserTickets(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await ticketService.getUserTickets(req.user.userId, page, limit);
      res.status(200).json({ success: true, message: 'Tickets fetched successfully', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch tickets' });
    }
  }

  async getTicketByNumber(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.getTicketByNumber(req.params.ticketNumber);
      res.status(200).json({ success: true, message: 'Ticket fetched successfully', data: ticket });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch ticket' });
    }
  }

  async verifyTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = verifyTicketSchema.parse(req.body);
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const result = await ticketService.verifyTicket(validated.ticketNumber, req.user.userId);
      res.status(200).json({ success: true, message: 'Ticket verified successfully', data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to verify ticket' });
    }
  }

  async downloadTicketPDF(req: Request, res: Response): Promise<void> {
    try {
      const pdfBuffer = await ticketService.downloadTicketPDF(req.params.ticketNumber);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=ticket-${req.params.ticketNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to download ticket' });
    }
  }

  async cancelTicket(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const result = await ticketService.cancelTicket(req.params.ticketNumber, req.user.userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to cancel ticket' });
    }
  }

  async getEventTickets(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const result = await ticketService.getEventTickets(req.params.eventId, req.user.userId);
      res.status(200).json({ success: true, message: 'Event tickets fetched successfully', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch event tickets' });
    }
  }
}

export default new TicketController();