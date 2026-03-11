import { Router } from 'express';
import {
  getAllPhysicalCopies,
  getPhysicalCopy,
  getMoviePhysicalCopies,
  createPhysicalCopy,
  updatePhysicalCopy,
  deletePhysicalCopy,
  fetchFromBarcode,
  searchPhysicalMedia
} from '../controllers/physicalCopyController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

// Data fetching routes
router.get('/fetch-barcode/:barcode', optionalAuth, fetchFromBarcode);
router.get('/search', optionalAuth, searchPhysicalMedia);

// Collection-wide routes
router.get('/', optionalAuth, getAllPhysicalCopies);
router.get('/:id', optionalAuth, getPhysicalCopy);
router.put('/:id', requireAuth, updatePhysicalCopy);
router.delete('/:id', requireAuth, deletePhysicalCopy);

// Movie-specific routes
router.get('/movie/:movieId', optionalAuth, getMoviePhysicalCopies);
router.post('/movie/:movieId', requireAuth, createPhysicalCopy);

export default router;
