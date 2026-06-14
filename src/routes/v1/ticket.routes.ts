import { Router } from 'express';
import { authMiddleware, organizerMiddleware } from '../../middleware/auth.middleware';
import ticketController from '../../controllers/ticket.controller';

const router = Router();

router.get('/my-tickets', authMiddleware, ticketController.getUserTickets.bind(ticketController));
router.get('/:ticketNumber', authMiddleware, ticketController.getTicketByNumber.bind(ticketController));
router.post('/cancel/:ticketNumber', authMiddleware, ticketController.cancelTicket.bind(ticketController));
router.get('/download/:ticketNumber', authMiddleware, ticketController.downloadTicketPDF.bind(ticketController));
router.post('/verify', authMiddleware, organizerMiddleware, ticketController.verifyTicket.bind(ticketController));
router.get('/event/:eventId', authMiddleware, organizerMiddleware, ticketController.getEventTickets.bind(ticketController));

export default router;