import nodemailer from 'nodemailer';

export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const emailConfig = {
  from: `"${process.env.SMTP_FROM_NAME || 'EventWave'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@eventwave.com'}>`,
  companyName: 'EventWave',
  supportEmail: 'support@eventwave.com'
};