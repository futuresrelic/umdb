import { Router } from 'express';
import {
  getAllPartnerApps,
  getPartnerApp,
  createPartnerApp,
  updatePartnerApp,
  deletePartnerApp,
  addScreenshot,
  deleteScreenshot,
} from '../controllers/partnerAppController';
import { optionalAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', optionalAuth, getAllPartnerApps);
router.get('/:id', optionalAuth, getPartnerApp);

// Admin routes
router.post('/', requireAdmin, createPartnerApp);
router.put('/:id', requireAdmin, updatePartnerApp);
router.delete('/:id', requireAdmin, deletePartnerApp);
router.post('/:id/screenshots', requireAdmin, addScreenshot);
router.delete('/:id/screenshots/:screenshotId', requireAdmin, deleteScreenshot);

export default router;
