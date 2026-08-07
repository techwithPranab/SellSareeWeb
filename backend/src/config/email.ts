import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../middlewares/logger.middleware';

let transporter: Transporter;

export const getEmailTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    transporter.verify((error) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('📧 Email server is ready to send messages');
      }
    });
  }

  return transporter;
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: nodemailer.SendMailOptions['attachments'];
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const emailTransporter = getEmailTransporter();

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.EMAIL_FROM,
    to: Array.isArray(options.to) ? options.to.join(',') : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments,
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`📧 Email sent: ${info.messageId} to ${mailOptions.to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};
