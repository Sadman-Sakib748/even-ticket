import cron from 'node-cron';
import Event from '../models/Event.model';
import Ticket from '../models/Ticket.model';
import User from '../models/User.model';
import emailService from '../services/email.service';

class EmailReminderJob {
  start(): void {
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running event reminder job...');
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      const events = await Event.find({
        date: { 
          $gte: now, 
          $lte: twentyFourHoursFromNow 
        },
        status: 'active'
      });

      for (const event of events) {
        const hoursUntil = Math.ceil((event.date.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        if (hoursUntil === 24 || hoursUntil === 2) {
          const tickets = await Ticket.find({ 
            eventId: event._id, 
            status: 'active' 
          }).populate('userId');
          
          for (const ticket of tickets) {
            const user = ticket.userId as any;
            const html = `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Event Reminder: ${event.title}</h2>
                <p>Dear ${user.name},</p>
                <p>This is a reminder that the event "${event.title}" will start in ${hoursUntil} hours.</p>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                <p>Please bring your ticket (digital or printed) to the event.</p>
                <br/>
                <p>Best regards,<br/>EventWave Team</p>
              </div>
            `;
            await emailService.sendEmail(user.email, `Event Reminder: ${event.title}`, html);
          }
          console.log(`Sent reminders for event: ${event.title} (${hoursUntil} hours remaining)`);
        }
      }
    });
    
    console.log('Email reminder job scheduled to run every 6 hours');
  }
}

export default new EmailReminderJob();