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
import { validateBody, movieCreateSchema, movieUpdateSchema } from '../validation/schemas';

const router = Router();

// No query validation on GET / — the controller handles all params safely with coercion,
// and Zod's parseAsync strips unknown fields which would break search, filters, and pagination.
router.get('/', optionalAuth, getAllMovies);
router.get('/:id', optionalAuth, getMovieById);
router.post('/', requireAuth, validateBody(movieCreateSchema), createMovie);
router.put('/:id', requireAuth, validateBody(movieUpdateSchema), updateMovie);
router.delete('/:id', requireAuth, deleteMovie);
router.post('/:id/external-matches', requireAuth, addExternalMatch);

export default router;
