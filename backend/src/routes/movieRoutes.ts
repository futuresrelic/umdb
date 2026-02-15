import { Router } from 'express';
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  addExternalMatch
} from '../controllers/movieController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getAllMovies);
router.get('/:id', optionalAuth, getMovieById);
router.post('/', requireAuth, createMovie);
router.put('/:id', requireAuth, updateMovie);
router.delete('/:id', requireAuth, deleteMovie);
router.post('/:id/external-matches', requireAuth, addExternalMatch);

export default router;
