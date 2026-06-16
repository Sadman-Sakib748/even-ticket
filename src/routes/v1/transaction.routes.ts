import { Router } from 'express';
import transactionController from '../../controllers/transaction.controller';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/callback', transactionController.paymentCallback.bind(transactionController));

// Protected routes
router.post('/create', authMiddleware, transactionController.createTransaction.bind(transactionController));
router.get('/my-transactions', authMiddleware, transactionController.getUserTransactions.bind(transactionController));
router.get('/:id', authMiddleware, transactionController.getTransactionById.bind(transactionController));
router.delete('/:id', authMiddleware, transactionController.deleteTransaction.bind(transactionController));
router.get('/admin/all', authMiddleware, adminMiddleware, transactionController.getAllTransactions.bind(transactionController));
router.post('/:id/confirm', authMiddleware, transactionController.confirmPayment.bind(transactionController)); // ✅ নতুন রাউট

export default router;