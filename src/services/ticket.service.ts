import Ticket, { ITicket } from '../models/Ticket.model';
import Event from '../models/Event.model';
import Transaction from '../models/Transaction.model';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

class TicketService {
  async getUserTickets(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      Ticket.find({ userId })
        .populate('eventId', 'title slug date location venue image')
        .populate('transactionId', 'transactionId totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments({ userId })
    ]);

    return {
      data: tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getTicketByNumber(ticketNumber: string): Promise<ITicket> {
    const ticket = await Ticket.findOne({ ticketNumber })
      .populate('userId', 'name email phone')
      .populate('eventId', 'title slug date location venue')
      .populate('transactionId', 'transactionId totalAmount');
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  async verifyTicket(ticketNumber: string, scannerId: string): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const ticket = await Ticket.findOne({ ticketNumber }).session(session);
      if (!ticket) throw new Error('Ticket not found');
      if (ticket.status === 'used') throw new Error('Ticket already used');
      if (ticket.status === 'cancelled') throw new Error('Ticket is cancelled');
      if (ticket.status === 'refunded') throw new Error('Ticket is refunded');

      const event = await Event.findById(ticket.eventId).session(session);
      if (!event) throw new Error('Event not found');
      if (new Date(event.date) < new Date()) throw new Error('Event has already passed');

      ticket.status = 'used';
      ticket.usedAt = new Date();
      ticket.scannedBy = scannerId as unknown as mongoose.Schema.Types.ObjectId;
      await ticket.save({ session });

      await session.commitTransaction();

      return { valid: true, ticket, event: { title: event.title, date: event.date, location: event.location } };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async downloadTicketPDF(ticketNumber: string): Promise<Buffer> {
    const ticket = await this.getTicketByNumber(ticketNumber);
    const event = ticket.eventId as any;
    const user = ticket.userId as any;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(24).text('EVENT TICKET', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Event: ${event.title}`);
      doc.fontSize(12).text(`Date: ${new Date(event.date).toLocaleString()}`);
      doc.text(`Venue: ${event.location}`);
      doc.moveDown();
      doc.fontSize(14).text(`Ticket Number: ${ticket.ticketNumber}`);
      doc.text(`Ticket Type: ${ticket.ticketType.toUpperCase()}`);
      doc.moveDown();
      doc.fontSize(14).text(`Attendee: ${user.name}`);
      doc.text(`Email: ${user.email}`);

      try {
        const qrImage = Buffer.from(ticket.qrCode.split(',')[1], 'base64');
        doc.image(qrImage, { fit: [150, 150], align: 'center' });
      } catch (error) {
        console.error('QR Code error:', error);
      }

      doc.end();
    });
  }

  async cancelTicket(ticketNumber: string, userId: string): Promise<{ message: string }> {
    const ticket = await Ticket.findOne({ ticketNumber });
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.userId.toString() !== userId) throw new Error('You can only cancel your own tickets');
    if (ticket.status !== 'active') throw new Error('Ticket cannot be cancelled');

    ticket.status = 'cancelled';
    await ticket.save();
    return { message: 'Ticket cancelled successfully' };
  }

  async getEventTickets(eventId: string, organizerId: string): Promise<any> {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) throw new Error('Event not found or you are not the organizer');

    const tickets = await Ticket.find({ eventId })
      .populate('userId', 'name email phone')
      .populate('transactionId', 'transactionId totalAmount')
      .sort({ createdAt: -1 });

    const stats = {
      total: tickets.length,
      active: tickets.filter(t => t.status === 'active').length,
      used: tickets.filter(t => t.status === 'used').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length,
      refunded: tickets.filter(t => t.status === 'refunded').length
    };

    return { tickets, stats };
  }
}

export default new TicketService();