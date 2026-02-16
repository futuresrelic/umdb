import { Router } from 'express';
import {
  searchMulti,
  searchReleases,
  getMovieCineShelf,
  getTVShow,
  getMovieImages,
  getMovieCredits,
  getMovieReleases,
  findByExternalId,
  getRelease,
  apiKeyAuth,
  requireApiKey,
  createEdition,
  getMovieEditions,
  getEdition,
  updateEdition,
} from '../controllers/cineShelfController';

const router = Router();

// Optional API key auth on all v1 routes
// (open if UMDB_API_KEY env var is not set)
router.use(apiKeyAuth);

// Search
router.get('/search/multi', searchMulti);
router.get('/search/releases', searchReleases);

// Movie detail sub-routes (must come before /movie/:id)
router.get('/movie/:id/images', getMovieImages);
router.get('/movie/:id/credits', getMovieCredits);
router.get('/movie/:id/releases', getMovieReleases);

// Movie + TV
router.get('/movie/:id', getMovieCineShelf);
router.get('/tv/:id', getTVShow);

// External ID lookup
router.get('/find/:externalId', findByExternalId);

// Physical releases — GET (legacy path) + POST alias for /editions
router.get('/releases/:releaseId', getRelease);
router.post('/releases', requireApiKey, createEdition);   // alias: CineShelf posts here

// Editions — canonical write API
// GET is open; POST/PUT require a valid API key
router.get('/movie/:id/editions', getMovieEditions);
router.get('/editions/:id', getEdition);
router.post('/editions', requireApiKey, createEdition);
router.put('/editions/:id', requireApiKey, updateEdition);

export default router;
