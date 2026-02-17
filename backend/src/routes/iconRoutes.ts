import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { serveIcon, getIconSettings, updateIconSettings } from '../controllers/siteSettingsController';

const router = Router();

// Public — serve each icon by filename
router.get('/:filename', serveIcon);

// Admin — read/write current icon settings
router.get('/settings/all', requireAuth, requireAdmin, getIconSettings);
router.put('/settings/all', requireAuth, requireAdmin, updateIconSettings);

export default router;
