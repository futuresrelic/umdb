import { Router } from 'express';
import { search, suggestions, similar } from '../controllers/searchController';
import { optionalAuth } from '../middleware/auth';
import { readLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public search endpoints with read rate limiting
router.get('/', readLimiter, optionalAuth, search);
router.get('/suggestions', readLimiter, suggestions);
router.get('/similar', readLimiter, similar);

export default router;
