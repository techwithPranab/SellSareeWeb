import { Router } from 'express';
import { registerForLaunch } from '../controllers/launch.controller';

const router = Router();

router.post('/register', registerForLaunch);

export default router;
