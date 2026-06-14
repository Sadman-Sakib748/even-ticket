import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import authRoutes from './routes/v1/auth.routes';
import eventRoutes from './routes/v1/event.routes';
import categoryRoutes from './routes/v1/category.routes';
import couponRoutes from './routes/v1/coupon.routes';
import transactionRoutes from './routes/v1/transaction.routes';
import ticketRoutes from './routes/v1/ticket.routes';
import { errorHandler } from './middleware/error.middleware';
import emailReminderJob from './jobs/emailReminder.job';

const app: Application = express();

// Security Middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api', limiter);

// Request Logger
app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Version
const API_VERSION = process.env.API_VERSION || 'v1';

// Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/events`, eventRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/coupons`, couponRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/tickets`, ticketRoutes);

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Event Management API Running Successfully',
    version: API_VERSION,
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      events: `/api/${API_VERSION}/events`,
      categories: `/api/${API_VERSION}/categories`,
      coupons: `/api/${API_VERSION}/coupons`,
      transactions: `/api/${API_VERSION}/transactions`,
      tickets: `/api/${API_VERSION}/tickets`,
    },
  });
});

// 404 Route
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start email reminder job
emailReminderJob.start();

// Database Connection Function
export const connectToDatabase = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
    throw error;
  }
};

export default app;