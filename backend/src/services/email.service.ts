import { sendEmail } from '../config/email';
import { logger } from '../middlewares/logger.middleware';

export class EmailService {
  async sendOrderConfirmation(
    email: string,
    name: string,
    orderNumber: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    totalAmount: number
  ): Promise<void> {
    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #f0e6d3;">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #f0e6d3;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #f0e6d3;text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
          </tr>`
      )
      .join('');

    await sendEmail({
      to: email,
      subject: `Order Confirmed #${orderNumber} — PP’s Aura 🥻`,
      html: getOrderConfirmationTemplate(name, orderNumber, itemsHtml, totalAmount),
    });
  }

  async sendShippingUpdate(
    email: string,
    name: string,
    orderNumber: string,
    trackingNumber: string,
    courier: string,
    trackingUrl?: string
  ): Promise<void> {
    await sendEmail({
      to: email,
      subject: `Your Order #${orderNumber} Has Been Shipped! 🚚`,
      html: getShippingEmailTemplate(name, orderNumber, trackingNumber, courier, trackingUrl),
    });
  }

  async sendDeliveryConfirmation(
    email: string,
    name: string,
    orderNumber: string
  ): Promise<void> {
    await sendEmail({
      to: email,
      subject: `Order #${orderNumber} Delivered Successfully! ✅`,
      html: getDeliveryEmailTemplate(name, orderNumber),
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: 'Reset Your Password — PP’s Aura',
      html: getPasswordResetEmailTemplate(name, resetUrl),
    });
  }

  async sendNewsletterWelcome(email: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: 'Welcome to PP’s Aura Newsletter! 🥻',
      html: getNewsletterWelcomeTemplate(),
    });
  }

  async sendLowStockAlert(
    adminEmail: string,
    products: Array<{ name: string; sku: string; stock: number }>
  ): Promise<void> {
    try {
      await sendEmail({
        to: adminEmail,
        subject: '⚠️ Low Stock Alert — PP’s Aura',
        html: getLowStockAlertTemplate(products),
      });
    } catch (error) {
      logger.error('Failed to send low stock alert:', error);
    }
  }
}

// =============================================
// EMAIL TEMPLATES
// =============================================

const baseStyles = `
  font-family: 'Georgia', serif;
  background-color: #fdf6ef;
  color: #3d2b1f;
  line-height: 1.6;
`;

const headerHtml = `
  <div style="background: linear-gradient(135deg, #b5451b, #8b2500); padding: 30px; text-align: center;">
    <h1 style="color: #fdf6ef; margin: 0; font-size: 28px; letter-spacing: 2px;">🥻 PP’s Aura</h1>
    <p style="color: #f5c8a0; margin: 5px 0 0 0; font-size: 13px; letter-spacing: 1px;">Where Every Thread Tells a Story</p>
  </div>
`;

const footerHtml = `
  <div style="background: #3d2b1f; padding: 20px; text-align: center; margin-top: 30px;">
    <p style="color: #c8a882; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} PP’s Aura. All rights reserved.</p>
    <p style="color: #c8a882; margin: 5px 0 0 0; font-size: 12px;">
      <a href="#" style="color: #f5c8a0; text-decoration: none;">Privacy Policy</a> &nbsp;|&nbsp;
      <a href="#" style="color: #f5c8a0; text-decoration: none;">Contact Us</a> &nbsp;|&nbsp;
      <a href="#" style="color: #f5c8a0; text-decoration: none;">Unsubscribe</a>
    </p>
  </div>
`;

export const getWelcomeEmailTemplate = (name: string, bonusPoints: number): string => `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="${baseStyles} margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        ${headerHtml}
        <div style="padding: 40px 30px;">
          <h2 style="color: #b5451b;">Welcome, ${name}! 🎉</h2>
          <p>Thank you for joining <strong>PP’s Aura</strong> — India's most curated online saree destination.</p>
          <p>As a welcome gift, we've added <strong style="color: #b5451b;">${bonusPoints} Loyalty Points</strong> to your account!</p>
          <div style="background: #fdf6ef; border-left: 4px solid #b5451b; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top:0; color: #b5451b;">What's waiting for you:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Handpicked silk, cotton, tant, banarasi & more</li>
              <li>Exclusive festival and bridal collections</li>
              <li>Free shipping on orders above ₹999</li>
              <li>Easy 7-day returns</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}" style="background: #b5451b; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold;">Start Shopping</a>
          </div>
        </div>
        ${footerHtml}
      </div>
    </body>
  </html>
`;

export const getPasswordResetEmailTemplate = (name: string, resetUrl: string): string => `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"></head>
    <body style="${baseStyles} margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        ${headerHtml}
        <div style="padding: 40px 30px;">
          <h2 style="color: #b5451b;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #b5451b; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #888; font-size: 13px;">This link expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
        </div>
        ${footerHtml}
      </div>
    </body>
  </html>
`;

export const getOrderConfirmationTemplate = (
  name: string,
  orderNumber: string,
  itemsHtml: string,
  totalAmount: number
): string => `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"></head>
    <body style="${baseStyles} margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        ${headerHtml}
        <div style="padding: 40px 30px;">
          <h2 style="color: #b5451b;">Order Confirmed! 🎊</h2>
          <p>Dear ${name}, your order <strong>#${orderNumber}</strong> has been placed successfully.</p>
          <table style="width:100%; border-collapse:collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #fdf6ef;">
                <th style="padding:10px 8px; text-align:left; border-bottom:2px solid #b5451b;">Item</th>
                <th style="padding:10px 8px; text-align:center; border-bottom:2px solid #b5451b;">Qty</th>
                <th style="padding:10px 8px; text-align:right; border-bottom:2px solid #b5451b;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px 8px; font-weight:bold; text-align:right;">Total:</td>
                <td style="padding:12px 8px; font-weight:bold; text-align:right; color: #b5451b;">₹${totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
          <p>We'll send you a shipping update once your order is dispatched.</p>
        </div>
        ${footerHtml}
      </div>
    </body>
  </html>
`;

export const getShippingEmailTemplate = (
  name: string,
  orderNumber: string,
  trackingNumber: string,
  courier: string,
  trackingUrl?: string
): string => `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"></head>
    <body style="${baseStyles} margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        ${headerHtml}
        <div style="padding: 40px 30px;">
          <h2 style="color: #b5451b;">Your Order Has Been Shipped! 🚚</h2>
          <p>Dear ${name}, your order <strong>#${orderNumber}</strong> is on its way!</p>
          <div style="background: #fdf6ef; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Courier:</strong> ${courier}</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            ${trackingUrl ? `<a href="${trackingUrl}" style="color: #b5451b;">Track Your Shipment →</a>` : ''}
          </div>
        </div>
        ${footerHtml}
      </div>
    </body>
  </html>
`;

export const getDeliveryEmailTemplate = (name: string, orderNumber: string): string => `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"></head>
    <body style="${baseStyles} margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        ${headerHtml}
        <div style="padding: 40px 30px;">
          <h2 style="color: #b5451b;">Order Delivered! ✅</h2>
          <p>Dear ${name}, your order <strong>#${orderNumber}</strong> has been delivered successfully!</p>
          <p>We hope you love your saree. Please share your experience by writing a review.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard/orders" style="background: #b5451b; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 4px;">Write a Review</a>
          </div>
        </div>
        ${footerHtml}
      </div>
    </body>
  </html>
`;

export const getNewsletterWelcomeTemplate = (): string => `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"></head>
    <body style="${baseStyles} margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        ${headerHtml}
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: #b5451b;">You're In! 🥻</h2>
          <p>Thank you for subscribing to the PP’s Aura newsletter. Stay tuned for exclusive offers, new arrivals & festival collections!</p>
        </div>
        ${footerHtml}
      </div>
    </body>
  </html>
`;

export const getLowStockAlertTemplate = (
  products: Array<{ name: string; sku: string; stock: number }>
): string => `
  <!DOCTYPE html>
  <html>
    <head><meta charset="UTF-8"></head>
    <body style="${baseStyles} margin:0; padding:0;">
      <div style="max-width:600px; margin:0 auto; background:#fff;">
        ${headerHtml}
        <div style="padding: 40px 30px;">
          <h2 style="color: #e74c3c;">⚠️ Low Stock Alert</h2>
          <p>The following products are running low on stock:</p>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background: #fdf6ef;">
                <th style="padding:10px; text-align:left; border-bottom:2px solid #b5451b;">Product</th>
                <th style="padding:10px; text-align:left; border-bottom:2px solid #b5451b;">SKU</th>
                <th style="padding:10px; text-align:right; border-bottom:2px solid #b5451b;">Stock</th>
              </tr>
            </thead>
            <tbody>
              ${products
                .map(
                  (p) =>
                    `<tr>
                      <td style="padding:8px; border-bottom:1px solid #f0e6d3;">${p.name}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0e6d3;">${p.sku}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0e6d3; text-align:right; color: ${p.stock === 0 ? '#e74c3c' : '#e67e22'}; font-weight:bold;">${p.stock === 0 ? 'OUT OF STOCK' : p.stock}</td>
                    </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
        ${footerHtml}
      </div>
    </body>
  </html>
`;

export const emailService = new EmailService();
