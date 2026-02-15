import { Router } from 'express';
import { googleCallback, getGoogleAuthUrl, getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/google', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.get('/me', requireAuth, getMe);

export default router;
