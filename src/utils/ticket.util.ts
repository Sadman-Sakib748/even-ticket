import QRCode from 'qrcode';
import Ticket from '../models/Ticket.model';

export const generateTicketNumber = async (): Promise<string> => {
  let ticketNumber: string;
  let exists = true;

  while (exists) {
    const prefix = 'EVT';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    ticketNumber = `${prefix}${timestamp}${random}`;
    const existing = await Ticket.findOne({ ticketNumber });
    exists = !!existing;
  }

  return ticketNumber!;
};

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};