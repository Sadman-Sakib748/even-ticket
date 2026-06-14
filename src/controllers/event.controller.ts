import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import eventService from '../services/event.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { createEventSchema, updateEventSchema } from '../validations/event.validation';
import { ZodError } from 'zod';

export class EventController {
  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        location: req.query.location as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        sortBy: (req.query.sortBy as string) || 'date',
        sortOrder: (req.query.sortOrder as string) || 'asc',
      };

      const result = await eventService.getEvents(filters, page, limit);
      sendSuccess(res, 200, 'Events fetched successfully', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const event = await eventService.getEventById(req.params.id);
      sendSuccess(res, 200, 'Event fetched successfully', event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async getEventBySlug(req: Request, res: Response): Promise<void> {
    try {
      const event = await eventService.getEventBySlug(req.params.slug);
      sendSuccess(res, 200, 'Event fetched successfully', event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch event';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async createEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const validated = createEventSchema.parse(req.body);
      const event = await eventService.createEvent(validated, req.user.userId);
      sendSuccess(res, 201, 'Event created successfully', event);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async updateEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const validated = updateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(req.params.id, req.user.userId, validated);
      sendSuccess(res, 200, 'Event updated successfully', event);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async deleteEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const result = await eventService.deleteEvent(req.params.id, req.user.userId);
      sendSuccess(res, 200, result.message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async getMyEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await eventService.getOrganizerEvents(req.user.userId, page, limit);
      sendSuccess(res, 200, 'Events fetched successfully', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async getFeaturedEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await eventService.getFeaturedEvents();
      sendSuccess(res, 200, 'Featured events fetched successfully', events);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }
}

export default new EventController();