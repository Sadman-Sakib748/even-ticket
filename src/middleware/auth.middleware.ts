import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';
import { verifyToken } from '../utils/jwt.util';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      sendError(res, 401, 'No token provided');
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      sendError(res, 401, 'Invalid or expired token');
      return;
    }

    req.user = decoded;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    sendError(res, 401, errorMessage, error instanceof Error ? error : undefined);
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    sendError(res, 403, 'Admin access required');
    return;
  }
  next();
};

export const organizerMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'organizer' && req.user?.role !== 'admin') {
    sendError(res, 403, 'Organizer access required');
    return;
  }
  next();
};