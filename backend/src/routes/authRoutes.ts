import { Router } from 'express';
import { googleCallback, getGoogleAuthUrl, getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting to auth endpoints
router.get('/google', authLimiter, getGoogleAuthUrl);
router.get('/google/callback', authLimiter, googleCallback);
router.get('/me', requireAuth, getMe);

export default router;
