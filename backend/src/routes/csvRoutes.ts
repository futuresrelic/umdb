import { Router } from 'express';
import {
  importFromCSV,
  uploadMiddleware,
  downloadTemplate
} from '../controllers/csvController';
import { bulkImportLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting to bulk imports
router.post('/import', bulkImportLimiter, uploadMiddleware, importFromCSV);
router.get('/template', downloadTemplate);

export default router;
