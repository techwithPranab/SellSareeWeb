import { Router } from 'express';
import { getStoreSettings, updateStoreSettings } from '../controllers/setting.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.get('/', getStoreSettings);
router.put('/', authenticate, requireAdmin, updateStoreSettings);

export default router;
