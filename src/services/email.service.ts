import { emailTransporter, emailConfig } from '../config/email.config';
import User from '../models/User.model';
import Transaction from '../models/Transaction.model';
import Ticket from '../models/Ticket.model';
import Event from '../models/Event.model';
import logger from '../utils/logger.util';

class EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await emailTransporter.sendMail({
        from: emailConfig.from,
        to,
        subject,
        html
      });
      logger.info(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendTicketConfirmation(userId: string, transactionId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      const transaction = await Transaction.findOne({ transactionId }).populate('eventId');
      const tickets = await Ticket.find({ transactionId: transaction?._id });

      if (!user || !transaction || !tickets.length) {
        throw new Error('User, transaction or tickets not found');
      }

      const event = transaction.eventId as any;
      const ticketListHtml = tickets.map((ticket, index) => `
        <div style="border: 2px solid #4CAF50; border-radius: 10px; padding: 15px; margin-bottom: 20px; background: #f9f9f9;">
          <h3 style="color: #4CAF50;">Ticket #${index + 1}</h3>
          <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Ticket Type:</strong> ${ticket.ticketType.toUpperCase()}</p>
          <div style="text-align: center; margin-top: 10px;">
            <img src="${ticket.qrCode}" alt="QR Code" style="width: 150px;"/>
          </div>
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .amount { font-size: 24px; font-weight: bold; color: #4CAF50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ticket Confirmation!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.name}!</h2>
              <p>Your booking has been confirmed successfully.</p>
              <h3>Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <h3>Payment Details:</h3>
              <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
              <p><strong>Total Amount:</strong> <span class="amount">${transaction.totalAmount} BDT</span></p>
              <h3>Your Tickets:</h3>
              ${ticketListHtml}
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail(user.email, `Ticket Confirmation - ${event.title}`, html);
    } catch (error) {
      logger.error('Ticket confirmation email failed:', error);
      return false;
    }
  }

  async sendPaymentSuccessEmail(userId: string, transactionId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      const transaction = await Transaction.findOne({ transactionId }).populate('eventId');

      if (!user || !transaction) return false;

      const event = transaction.eventId as any;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Successful!</h1>
            </div>
            <div class="content">
              <h2>Dear ${user.name},</h2>
              <p>Your payment has been successfully processed.</p>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Amount:</strong> ${transaction.totalAmount} BDT</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail(user.email, 'Payment Successful - EventWave', html);
    } catch (error) {
      logger.error('Payment success email failed:', error);
      return false;
    }
  }

  async sendPaymentFailedEmail(userId: string, transactionId: string, reason?: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      const transaction = await Transaction.findOne({ transactionId });

      if (!user || !transaction) return false;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <h2>Dear ${user.name},</h2>
              <p>Your payment could not be processed.</p>
              <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
              <p><strong>Amount:</strong> ${transaction.totalAmount} BDT</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail(user.email, 'Payment Failed - EventWave', html);
    } catch (error) {
      logger.error('Payment failed email failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EventWave!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.name}!</h2>
              <p>Thank you for joining EventWave. We're excited to have you on board!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail(user.email, 'Welcome to EventWave!', html);
    } catch (error) {
      logger.error('Welcome email failed:', error);
      return false;
    }
  }
}

export default new EmailService();