import { randomBytes } from 'crypto';

export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

export const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

export const generateCode = (): string => {
  return randomBytes(6).toString('hex').toUpperCase().slice(0, 8);
};

export const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};