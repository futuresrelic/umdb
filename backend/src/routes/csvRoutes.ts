import { Router } from 'express';
import {
  importFromCSV,
  uploadMiddleware,
  downloadTemplate
} from '../controllers/csvController';

const router = Router();

router.post('/import', uploadMiddleware, importFromCSV);
router.get('/template', downloadTemplate);

export default router;
