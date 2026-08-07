import cron from 'node-cron';
import { logger } from '../middlewares/logger.middleware';
import { orderRepository } from '../repositories/order.repository';
import { productRepository } from '../repositories/product.repository';
import { emailService } from '../services/email.service';

// =============================================
// ABANDONED CART RECOVERY JOB
// Run every hour
// =============================================
export const abandonedCartJob = cron.schedule(
  '0 * * * *',
  async () => {
    try {
      logger.info('[CRON] Running abandoned cart recovery...');
      const abandonedOrders = await orderRepository.findAbandonedOrders(24);
      logger.info(`[CRON] Found ${abandonedOrders.length} abandoned orders`);
      // TODO: Send recovery emails
    } catch (error) {
      logger.error('[CRON] Abandoned cart job failed:', error);
    }
  },
  { scheduled: false }
);

// =============================================
// ORDER REMINDER JOB
// Run daily at 9 AM
// =============================================
export const orderReminderJob = cron.schedule(
  '0 9 * * *',
  async () => {
    try {
      logger.info('[CRON] Running order delivery reminders...');
      // TODO: Send delivery status updates
    } catch (error) {
      logger.error('[CRON] Order reminder job failed:', error);
    }
  },
  { scheduled: false }
);

// =============================================
// INVENTORY ALERT JOB
// Run daily at 8 AM
// =============================================
export const inventoryAlertJob = cron.schedule(
  '0 8 * * *',
  async () => {
    try {
      logger.info('[CRON] Running inventory alert check...');
      const lowStockProducts = await productRepository.findLowStockProducts(5);

      if (lowStockProducts.length > 0) {
        logger.warn(`[CRON] ${lowStockProducts.length} products have low stock`);
        const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
        if (adminEmail) {
          await emailService.sendLowStockAlert(
            adminEmail,
            lowStockProducts.map((p) => ({
              name: p.name,
              sku: p.sku,
              stock: p.stock,
            }))
          );
        }
      }
    } catch (error) {
      logger.error('[CRON] Inventory alert job failed:', error);
    }
  },
  { scheduled: false }
);

// =============================================
// INITIALIZE ALL JOBS
// =============================================
export const initializeJobs = (): void => {
  if (process.env.NODE_ENV === 'production') {
    abandonedCartJob.start();
    orderReminderJob.start();
    inventoryAlertJob.start();
    logger.info('⏰ Background jobs initialized');
  } else {
    logger.info('ℹ️  Background jobs disabled in development mode');
  }
};
