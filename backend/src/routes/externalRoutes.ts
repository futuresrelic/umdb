import { Router } from 'express';
import {
  searchExternal,
  importFromTMDB,
  importFromIMDB,
  findMatchesForMovie,
  saveMatchToMovie,
  getMovieMatches,
  getSourceDetails,
  removeMatchFromMovie
} from '../controllers/externalController';

const router = Router();

router.get('/search', searchExternal);
router.post('/import/tmdb', importFromTMDB);
router.post('/import/imdb', importFromIMDB);

// Multi-source matching endpoints
router.get('/movies/:movieId/find-matches', findMatchesForMovie);
router.post('/movies/:movieId/matches', saveMatchToMovie);
router.get('/movies/:movieId/matches', getMovieMatches);
router.delete('/movies/:movieId/matches/:source', removeMatchFromMovie);
router.get('/sources/:source/:externalId', getSourceDetails);

export default router;
