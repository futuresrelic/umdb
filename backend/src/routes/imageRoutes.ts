import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import {
  uploadImage,
  serveImage,
  getMovieImages,
  getCopyImages,
  updateImage,
  deleteImage,
} from '../controllers/imageController';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// Serve raw image — public, no auth (cache-friendly)
router.get('/:id', serveImage);

// List images
router.get('/movie/:movieId', getMovieImages);
router.get('/copy/:copyId', getCopyImages);

// Write operations require auth + rate limiting
router.post('/', uploadLimiter, requireAuth, uploadImage);
router.put('/:id', uploadLimiter, requireAuth, updateImage);
router.delete('/:id', requireAuth, deleteImage);

export default router;
