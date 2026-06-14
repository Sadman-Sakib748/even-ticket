import { Request, Response } from 'express';
import transactionService from '../services/transaction.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { createTransactionSchema, paymentCallbackSchema } from '../validations/transaction.validation';
import { ZodError } from 'zod';

class TransactionController {
  async createTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = createTransactionSchema.parse(req.body);
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await transactionService.createTransaction(
        req.user.userId,
        validated.eventId,
        validated.ticketType,
        validated.quantity,
        validated.paymentGateway,
        validated.couponCode
      );

      res.status(201).json({ success: true, message: 'Transaction created successfully', data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create transaction' });
    }
  }

  async paymentCallback(req: Request, res: Response): Promise<void> {
    try {
      const validated = paymentCallbackSchema.parse(req.body);
      const result = await transactionService.handlePaymentCallback(
        validated.transactionId,
        validated.gatewayTransactionId,
        validated.paymentStatus
      );
      res.status(200).json({ success: true, message: 'Payment callback processed', data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to process callback' });
    }
  }

  async getUserTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await transactionService.getUserTransactions(req.user.userId, page, limit);
      res.status(200).json({ success: true, message: 'Transactions fetched successfully', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch transactions' });
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id);
      res.status(200).json({ success: true, message: 'Transaction fetched successfully', data: transaction });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch transaction' });
    }
  }

  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await transactionService.getAllTransactions(page, limit);
      res.status(200).json({ success: true, message: 'Transactions fetched successfully', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch transactions' });
    }
  }
}

export default new TransactionController();