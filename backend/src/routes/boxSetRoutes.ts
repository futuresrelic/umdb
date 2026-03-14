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
  getBoxSetComponents,
  addBoxSetComponent,
  updateBoxSetComponent,
  deleteBoxSetComponent,
  syncBoxSetComponents,
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

// Box set component management
router.get('/:id/components', getBoxSetComponents);
router.post('/:id/components', addBoxSetComponent);
router.put('/:id/components/:componentId', updateBoxSetComponent);
router.delete('/:id/components/:componentId', deleteBoxSetComponent);
router.post('/:id/components/sync', syncBoxSetComponents);

export default router;
