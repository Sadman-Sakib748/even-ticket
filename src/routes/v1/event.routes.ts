import { Router } from 'express';
import eventController from '../../controllers/event.controller';
import { authMiddleware, organizerMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// =======================
// Public routes
// =======================
router.get('/', (req, res) => eventController.getEvents(req, res));

router.get('/featured', (req, res) =>
  eventController.getFeaturedEvents(req, res)
);

router.get('/slug/:slug', (req, res) =>
  eventController.getEventBySlug(req, res)
);

// 🔥 IMPORTANT: put custom routes BEFORE /:id
router.get('/my-events', authMiddleware, organizerMiddleware, (req, res) =>
  eventController.getMyEvents(req, res)
);

// =======================
// Dynamic route (ALWAYS LAST)
// =======================
router.get('/:id', (req, res) =>
  eventController.getEventById(req, res)
);

// =======================
// Organizer routes
// =======================
router.post('/', authMiddleware, organizerMiddleware, (req, res) =>
  eventController.createEvent(req, res)
);

router.put('/:id', authMiddleware, organizerMiddleware, (req, res) =>
  eventController.updateEvent(req, res)
);

router.delete('/:id', authMiddleware, organizerMiddleware, (req, res) =>
  eventController.deleteEvent(req, res)
);

export default router;