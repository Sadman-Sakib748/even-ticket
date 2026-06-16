import { Request, Response } from 'express';
import transactionService from '../services/transaction.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { createTransactionSchema, paymentCallbackSchema } from '../validations/transaction.validation';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

class TransactionController {
  async createTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 Create transaction request:', req.body);

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
      console.error('❌ Create transaction error:', error);

      if (error instanceof ZodError) {
        res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
        return;
      }
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create transaction'
      });
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
      console.error('❌ Get user transactions error:', error);
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch transactions' });
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log('📥 Get transaction by ID/TransactionId:', id);

      let transaction;

      // Check if id is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(id)) {
        // Search by _id (ObjectId)
        transaction = await transactionService.getTransactionById(id);
      } else {
        // Search by transactionId (string)
        transaction = await transactionService.getTransactionByTransactionId(id);
      }

      if (!transaction) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      res.status(200).json({ success: true, message: 'Transaction fetched successfully', data: transaction });
    } catch (error) {
      console.error('❌ Get transaction error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch transaction'
      });
    }
  }

  // ✅ DELETE Transaction
  async deleteTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await transactionService.deleteTransaction(id, userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error('❌ Delete transaction error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete transaction'
      });
    }
  }
  // এই মেথডটি যোগ করুন
  // এই মেথডটি যোগ করুন
  async confirmPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const paymentData = req.body;

      const result = await transactionService.confirmPayment(id, paymentData);
      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: result
      });
    } catch (error: any) {
      console.error('❌ Confirm payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to confirm payment'
      });
    }
  }

  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await transactionService.getAllTransactions(page, limit);
      res.status(200).json({ success: true, message: 'Transactions fetched successfully', data: result });
    } catch (error) {
      console.error('❌ Get all transactions error:', error);
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch transactions' });
    }
  }
}

export default new TransactionController();