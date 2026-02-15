import { Router } from 'express';
import {
  getAllPhysicalCopies,
  getPhysicalCopy,
  getMoviePhysicalCopies,
  createPhysicalCopy,
  updatePhysicalCopy,
  deletePhysicalCopy
} from '../controllers/physicalCopyController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

// Collection-wide routes
router.get('/', optionalAuth, getAllPhysicalCopies);
router.get('/:id', optionalAuth, getPhysicalCopy);
router.put('/:id', requireAuth, updatePhysicalCopy);
router.delete('/:id', requireAuth, deletePhysicalCopy);

// Movie-specific routes
router.get('/movie/:movieId', optionalAuth, getMoviePhysicalCopies);
router.post('/movie/:movieId', requireAuth, createPhysicalCopy);

export default router;
