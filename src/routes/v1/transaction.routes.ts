import { Router } from 'express';
import transactionController from '../../controllers/transaction.controller';
import { adminMiddleware, authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/create', authMiddleware, transactionController.createTransaction.bind(transactionController));
router.post('/callback', transactionController.paymentCallback.bind(transactionController));
router.get('/my-transactions', authMiddleware, transactionController.getUserTransactions.bind(transactionController));
router.get('/:id', authMiddleware, transactionController.getTransactionById.bind(transactionController));
router.get('/admin/all', authMiddleware, adminMiddleware, transactionController.getAllTransactions.bind(transactionController));

export default router;