import { Router } from 'express';
import { getNewsletterSubscribers, subscribeToNewsletter } from '../controllers/newsletter.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.post('/subscribe', subscribeToNewsletter);
router.get('/admin/subscribers', authenticate, requireAdmin, getNewsletterSubscribers);

export default router;
