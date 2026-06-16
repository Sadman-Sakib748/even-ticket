import Event from '../models/Event.model';
import Category from '../models/Category.model';
import { AppError } from '../middleware/error.middleware';
import slugify from 'slugify';
import mongoose from 'mongoose';

export class EventService {
  async createEvent(eventData: any, organizerId: string) {
    try {
      // Slug তৈরি করুন
      const slug = slugify(eventData.title, { lower: true, strict: true });

      // চেক করুন slug ইতিমধ্যে আছে কিনা
      const existingEvent = await Event.findOne({ slug });
      if (existingEvent) {
        throw new AppError(409, 'Event with this title already exists');
      }

      // Category টি ObjectId তে কনভার্ট করুন (যদি থাকে)
      let categoryId = null;
      if (eventData.category) {
        // category নাম বা id হতে পারে
        const category = await Category.findOne({ 
          $or: [
            { slug: eventData.category },
            { _id: eventData.category }
          ]
        });
        if (category) {
          categoryId = category._id;
        }
      }

      // ডেটা ফরম্যাট করুন
      const newEvent = new Event({
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        fullDescription: eventData.fullDescription || '',
        date: new Date(eventData.date),
        time: eventData.time || '18:00',
        endTime: eventData.endTime || '',
        location: eventData.location.trim(),
        venue: eventData.venue || '',
        image: eventData.image || '',
        gallery: eventData.gallery || [],
        tags: eventData.tags || [],
        category: categoryId,
        organizerId: new mongoose.Types.ObjectId(organizerId),
        isFeatured: eventData.isFeatured || false,
        ticketTypes: {
          regular: {
            price: Number(eventData.ticketTypes.regular.price) || 0,
            total: Number(eventData.ticketTypes.regular.total) || 100,
            sold: 0,
            available: true,
            maxPerUser: 10
          },
          vip: {
            price: Number(eventData.ticketTypes.vip.price) || 0,
            total: Number(eventData.ticketTypes.vip.total) || 50,
            sold: 0,
            available: true,
            maxPerUser: 5
          },
          vvip: {
            price: Number(eventData.ticketTypes.vvip.price) || 0,
            total: Number(eventData.ticketTypes.vvip.total) || 20,
            sold: 0,
            available: true,
            maxPerUser: 3
          }
        }
      });

      await newEvent.save();
      return newEvent.populate('category', 'name slug');
    } catch (error) {
      throw error;
    }
  }

  async getEvents(filters: any = {}, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query: any = { status: 'active' };

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.category) {
      const cat = await Category.findOne({ slug: filters.category });
      if (cat) query.category = cat._id;
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    if (filters.minPrice) {
      query['ticketTypes.regular.price'] = { $gte: filters.minPrice };
    }

    if (filters.maxPrice) {
      query['ticketTypes.regular.price'] = {
        ...query['ticketTypes.regular.price'],
        $lte: filters.maxPrice,
      };
    }

    const events = await Event.find(query)
      .populate('category', 'name slug')
      .populate('organizerId', 'name email')
      .sort({ [filters.sortBy || 'date']: filters.sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getEventById(eventId: string) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new AppError(400, 'Invalid event ID');
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('category', 'name slug')
      .populate('organizerId', 'name email avatar');

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    return event;
  }

  async getEventBySlug(slug: string) {
    const event = await Event.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('category', 'name slug')
      .populate('organizerId', 'name email avatar');

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    return event;
  }

  async updateEvent(eventId: string, organizerId: string, updateData: any) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId.toString() !== organizerId) {
      throw new AppError(403, 'Not authorized to update this event');
    }

    if (updateData.title) {
      updateData.slug = slugify(updateData.title, { lower: true, strict: true });
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    if (updateData.category) {
      const category = await Category.findOne({ slug: updateData.category });
      if (category) {
        updateData.category = category._id;
      }
    }

    const updated = await Event.findByIdAndUpdate(eventId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('organizerId', 'name email');

    return updated;
  }

  async deleteEvent(eventId: string, organizerId: string) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId.toString() !== organizerId) {
      throw new AppError(403, 'Not authorized to delete this event');
    }

    await Event.findByIdAndDelete(eventId);
    return { message: 'Event deleted successfully' };
  }

  async getOrganizerEvents(organizerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const events = await Event.find({ organizerId })
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments({ organizerId });

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getFeaturedEvents() {
    return await Event.find({ isFeatured: true, status: 'active' })
      .populate('category', 'name slug')
      .populate('organizerId', 'name email')
      .limit(6)
      .sort({ createdAt: -1 });
  }
}

export default new EventService();