import { Router } from 'express';
import {
  searchMovies,
  getMovie,
  lookupBarcode,
  getMoviePhysicalCopies,
  submitPhysicalCopy,
  getStats
} from '../controllers/publicController';

const router = Router();

// Stats
router.get('/stats', getStats);

// Movie search (by title or UPC)
router.get('/movies/search', searchMovies);

// Movie details
router.get('/movies/:id', getMovie);

// Physical copies for a movie
router.get('/movies/:id/physical-copies', getMoviePhysicalCopies);

// Barcode lookup (UPC, EAN, ASIN)
router.get('/barcode/:code', lookupBarcode);

// Submit a physical copy (requires X-API-KEY header)
router.post('/physical-copies', submitPhysicalCopy);

export default router;
