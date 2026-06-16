import Transaction, { ITransaction } from '../models/Transaction.model';
import Event from '../models/Event.model';
import Ticket from '../models/Ticket.model';
import couponService from './coupon.service';
import emailService from './email.service';
import { generateTicketNumber, generateQRCode } from '../utils/ticket.util';
import mongoose from 'mongoose';

class TransactionService {
  async createTransaction(
    userId: string,
    eventId: string,
    ticketType: string,
    quantity: number,
    paymentGateway: string,
    couponCode?: string
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check existing pending transaction
      const existingPending = await Transaction.findOne({
        userId,
        eventId,
        paymentStatus: 'pending',
        createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
      }).session(session);

      if (existingPending) {
        throw new Error('You already have a pending transaction for this event');
      }

      // Check event
      const event = await Event.findById(eventId).session(session);
      if (!event) throw new Error('Event not found');
      if (event.status !== 'active') throw new Error('Event is not active');

      // Get ticket price and availability
      let pricePerTicket = 0;
      let availableTickets = 0;

      if (ticketType === 'regular') {
        pricePerTicket = event.ticketTypes.regular.price;
        availableTickets = event.ticketTypes.regular.total - event.ticketTypes.regular.sold;
      } else if (ticketType === 'vip') {
        pricePerTicket = event.ticketTypes.vip.price;
        availableTickets = event.ticketTypes.vip.total - event.ticketTypes.vip.sold;
      } else if (ticketType === 'vvip') {
        pricePerTicket = event.ticketTypes.vvip.price;
        availableTickets = event.ticketTypes.vvip.total - event.ticketTypes.vvip.sold;
      } else {
        throw new Error('Invalid ticket type');
      }

      if (availableTickets < quantity) {
        throw new Error(`Only ${availableTickets} tickets available for ${ticketType}`);
      }

      // Calculate total
      const subtotal = pricePerTicket * quantity;
      let discountAmount = 0;

      if (couponCode) {
        try {
          const couponResult = await couponService.verifyCoupon(couponCode, eventId, ticketType, subtotal);
          discountAmount = couponResult.discountAmount;
        } catch (error) {
          console.log('Coupon validation failed:', error);
        }
      }

      const totalAmount = subtotal - discountAmount;
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create transaction
      const transaction = new Transaction({
        transactionId,
        userId: new mongoose.Types.ObjectId(userId),
        eventId: new mongoose.Types.ObjectId(eventId),
        ticketType,
        quantity,
        unitPrice: pricePerTicket,
        subtotal,
        discountAmount,
        couponCode: couponCode || undefined,
        totalAmount,
        paymentGateway,
        paymentStatus: 'pending'
      });

      await transaction.save({ session });
      await session.commitTransaction();

      return {
        _id: transaction._id,
        transactionId: transaction.transactionId,
        ...transaction.toObject()
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ✅ Transaction ID দিয়ে খোঁজার জন্য
  async getTransactionByTransactionId(transactionId: string): Promise<ITransaction> {
    const transaction = await Transaction.findOne({ transactionId })
      .populate('userId', 'name email')
      .populate('eventId', 'title slug date location image');

    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  // ✅ ObjectId দিয়ে খোঁজার জন্য
  async getTransactionById(id: string): Promise<ITransaction> {
    const transaction = await Transaction.findById(id)
      .populate('userId', 'name email')
      .populate('eventId', 'title slug date location image');

    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  // ✅ DELETE Transaction
  async deleteTransaction(transactionId: string, userId: string): Promise<{ message: string }> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // চেক করুন ইউজার নিজের ট্রানজেকশন ডিলিট করছে কিনা
    if (transaction.userId.toString() !== userId) {
      throw new Error('You can only delete your own transactions');
    }

    // শুধুমাত্র pending status এর ট্রানজেকশন ডিলিট করা যাবে
    if (transaction.paymentStatus !== 'pending') {
      throw new Error('Only pending transactions can be deleted');
    }

    await Transaction.findByIdAndDelete(transactionId);
    return { message: 'Transaction deleted successfully' };
  }

  async handlePaymentCallback(transactionId: string, gatewayTransactionId: string, status: string): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findOne({ transactionId }).session(session);
      if (!transaction) throw new Error('Transaction not found');

      if (status === 'success') {
        transaction.paymentStatus = 'success';
        transaction.transactionDetails = {
          gatewayTransactionId,
          paymentTime: new Date()
        };

        await transaction.save({ session });

        const event = await Event.findById(transaction.eventId).session(session);
        if (event) {
          if (transaction.ticketType === 'regular') {
            event.ticketTypes.regular.sold += transaction.quantity;
          } else if (transaction.ticketType === 'vip') {
            event.ticketTypes.vip.sold += transaction.quantity;
          } else if (transaction.ticketType === 'vvip') {
            event.ticketTypes.vvip.sold += transaction.quantity;
          }
          event.ticketsSold += transaction.quantity;
          event.totalRevenue += transaction.totalAmount;
          await event.save({ session });
        }

        const tickets = [];
        for (let i = 0; i < transaction.quantity; i++) {
          const ticketNumber = await generateTicketNumber();
          const qrCode = await generateQRCode(ticketNumber);
          const ticket = new Ticket({
            ticketNumber,
            transactionId: transaction._id,
            userId: transaction.userId,
            eventId: transaction.eventId,
            ticketType: transaction.ticketType,
            qrCode,
            status: 'active'
          });
          await ticket.save({ session });
          tickets.push(ticket);
        }

        await session.commitTransaction();

        // Send emails
        try {
          await emailService.sendPaymentSuccessEmail(transaction.userId.toString(), transactionId);
          await emailService.sendTicketConfirmation(transaction.userId.toString(), transactionId);
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }

        return { success: true, tickets, transaction };
      } else {
        transaction.paymentStatus = 'failed';
        await transaction.save({ session });
        await session.commitTransaction();

        try {
          await emailService.sendPaymentFailedEmail(transaction.userId.toString(), transactionId, 'Payment processing failed');
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }

        return { success: false, message: 'Payment failed' };
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUserTransactions(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find({ userId })
        .populate('eventId', 'title slug date location image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ userId })
    ]);

    return {
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }
  // এই ফাংশনটি যোগ করুন
  async confirmPayment(transactionId: string, paymentData: any) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // পেমেন্ট স্ট্যাটাস আপডেট করুন
    transaction.paymentStatus = 'success';
    transaction.transactionDetails = {
      gatewayTransactionId: paymentData.gatewayTransactionId || `GATEWAY_${Date.now()}`,
      paymentMethod: paymentData.paymentMethod || 'card',
      paymentTime: new Date()
    };

    await transaction.save();

    // ইভেন্টের টিকেট কাউন্ট আপডেট করুন
    const event = await Event.findById(transaction.eventId);
    if (event) {
      if (transaction.ticketType === 'regular') {
        event.ticketTypes.regular.sold += transaction.quantity;
      } else if (transaction.ticketType === 'vip') {
        event.ticketTypes.vip.sold += transaction.quantity;
      } else if (transaction.ticketType === 'vvip') {
        event.ticketTypes.vvip.sold += transaction.quantity;
      }
      event.ticketsSold += transaction.quantity;
      event.totalRevenue += transaction.totalAmount;
      await event.save();
    }

    // টিকেট তৈরি করুন
    const tickets = [];
    for (let i = 0; i < transaction.quantity; i++) {
      const ticketNumber = await generateTicketNumber();
      const qrCode = await generateQRCode(ticketNumber);
      const ticket = new Ticket({
        ticketNumber,
        transactionId: transaction._id,
        userId: transaction.userId,
        eventId: transaction.eventId,
        ticketType: transaction.ticketType,
        qrCode,
        status: 'active'
      });
      await ticket.save();
      tickets.push(ticket);
    }

    return {
      success: true,
      transaction,
      tickets,
      message: 'Payment confirmed successfully'
    };
  }

  async getAllTransactions(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate('userId', 'name email')
        .populate('eventId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments()
    ]);

    return {
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }
}

export default new TransactionService();