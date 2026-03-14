import { Router } from 'express';
import {
  getAllBoxSets,
  getBoxSet,
  createBoxSet,
  updateBoxSet,
  deleteBoxSet,
  addMovieToBoxSet,
  removeMovieFromBoxSet,
  updateBoxSetMovie,
} from '../controllers/boxSetController';

const router = Router();

// Public box set routes
router.get('/', getAllBoxSets);
router.get('/:id', getBoxSet);
router.post('/', createBoxSet);
router.put('/:id', updateBoxSet);
router.delete('/:id', deleteBoxSet);

// Box set movie management
router.post('/:id/movies', addMovieToBoxSet);
router.delete('/:id/movies/:movieId', removeMovieFromBoxSet);
router.put('/:id/movies/:movieId', updateBoxSetMovie);

export default router;
