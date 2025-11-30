import { Router } from 'express';
import {
  getAllPhysicalCopies,
  getPhysicalCopy,
  getMoviePhysicalCopies,
  createPhysicalCopy,
  updatePhysicalCopy,
  deletePhysicalCopy
} from '../controllers/physicalCopyController';

const router = Router();

// Collection-wide routes
router.get('/', getAllPhysicalCopies);
router.get('/:id', getPhysicalCopy);
router.put('/:id', updatePhysicalCopy);
router.delete('/:id', deletePhysicalCopy);

// Movie-specific routes
router.get('/movie/:movieId', getMoviePhysicalCopies);
router.post('/movie/:movieId', createPhysicalCopy);

export default router;
