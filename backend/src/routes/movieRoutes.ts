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
import { validateBody, validateQuery, movieCreateSchema, movieUpdateSchema, paginationSchema, filterSchema } from '../validation/schemas';

const router = Router();

router.get('/', optionalAuth, validateQuery(paginationSchema.merge(filterSchema)), getAllMovies);
router.get('/:id', optionalAuth, getMovieById);
router.post('/', requireAuth, validateBody(movieCreateSchema), createMovie);
router.put('/:id', requireAuth, validateBody(movieUpdateSchema), updateMovie);
router.delete('/:id', requireAuth, deleteMovie);
router.post('/:id/external-matches', requireAuth, addExternalMatch);

export default router;
