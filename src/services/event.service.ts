import Event from '../models/Event.model';
import Category from '../models/Category.model';
import { AppError } from '../middleware/error.middleware';
import slugify from 'slugify';
import mongoose from 'mongoose';

export class EventService {
  async createEvent(eventData: any, organizerId: string) {
    try {
      console.log('📥 Service received data:', eventData);

      // Slug তৈরি করুন
      const baseSlug = slugify(eventData.title, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
      
      let slug = baseSlug;
      let slugExists = await Event.findOne({ slug });
      let counter = 1;
      
      while (slugExists) {
        slug = `${baseSlug}-${counter}`;
        slugExists = await Event.findOne({ slug });
        counter++;
      }

      // 🔥 FIX: Category খুঁজে বের করুন - সঠিকভাবে
      let categoryId = null;
      if (eventData.category) {
        console.log('🔍 Looking for category:', eventData.category);
        
        // প্রথমে slug দিয়ে খুঁজুন
        let category = await Category.findOne({ slug: eventData.category });
        
        // slug না পেলে name দিয়ে খুঁজুন
        if (!category) {
          category = await Category.findOne({ name: eventData.category });
        }
        
        // name দিয়েও না পেলে _id দিয়ে চেক করুন (যদি valid ObjectId হয়)
        if (!category && mongoose.Types.ObjectId.isValid(eventData.category)) {
          category = await Category.findById(eventData.category);
        }
        
        if (category) {
          categoryId = category._id;
          console.log('📂 Category found:', category.name, 'ID:', categoryId);
        } else {
          console.warn('⚠️ Category not found:', eventData.category);
        }
      }

      // ডেটা ফরম্যাট করুন
      const newEventData = {
        title: eventData.title.trim(),
        slug: slug,
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
      };

      console.log('📦 Creating event with data:', JSON.stringify(newEventData, null, 2));

      const newEvent = new Event(newEventData);
      await newEvent.save();
      
      console.log('✅ Event saved successfully:', newEvent._id);
      return newEvent.populate('category', 'name slug');
    } catch (error) {
      console.error('❌ Create event service error:', error);
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
      const baseSlug = slugify(updateData.title, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
      
      let slug = baseSlug;
      let slugExists = await Event.findOne({ slug, _id: { $ne: eventId } });
      let counter = 1;
      
      while (slugExists) {
        slug = `${baseSlug}-${counter}`;
        slugExists = await Event.findOne({ slug, _id: { $ne: eventId } });
        counter++;
      }
      
      updateData.slug = slug;
    }

    if (updateData.date) {
      const eventDate = new Date(updateData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        throw new AppError(400, 'Event date must be in the future');
      }
      updateData.date = eventDate;
    }

    if (updateData.category) {
      // 🔥 FIX: Category খুঁজে বের করুন - সঠিকভাবে
      let category = await Category.findOne({ slug: updateData.category });
      
      if (!category) {
        category = await Category.findOne({ name: updateData.category });
      }
      
      if (!category && mongoose.Types.ObjectId.isValid(updateData.category)) {
        category = await Category.findById(updateData.category);
      }
      
      if (category) {
        updateData.category = category._id;
      } else {
        updateData.category = null;
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