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
  createMovieCineShelf,
  createBoxSet,
  getBoxSet,
  listBoxSets,
  createBoxSetReleases,
} from '../controllers/cineShelfController';
import { migrateBoxSetFields } from '../controllers/migrationController';
import { adminMigrationsPage } from '../controllers/adminController';

const router = Router();

// Admin pages (public - no auth required, auth happens in JavaScript)
router.get('/admin/migrations', adminMigrationsPage);

// Optional API key auth on all v1 routes
// (open if UMDB_API_KEY env var is not set)
router.use(apiKeyAuth);

// Movies — create or find (idempotent by tmdb_id/imdb_id)
router.post('/movies', requireApiKey, createMovieCineShelf);

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

// Physical releases — GET (legacy path) + POST/PUT alias for /editions
router.get('/releases/:releaseId', getRelease);
router.post('/releases', requireApiKey, createEdition);   // alias: CineShelf posts here
router.put('/releases/:id', requireApiKey, updateEdition); // alias: CineShelf updates here

// Editions — canonical write API
// GET is open; POST/PUT require a valid API key
router.get('/movie/:id/editions', getMovieEditions);
router.get('/editions/:id', getEdition);
router.post('/editions', requireApiKey, createEdition);
router.put('/editions/:id', requireApiKey, updateEdition);

// Box Sets
router.get('/box-sets', listBoxSets);
router.get('/box-sets/:boxsetId', getBoxSet);
router.post('/box-sets', requireApiKey, createBoxSet);
router.post('/box-sets/:boxsetId/create-releases', requireApiKey, createBoxSetReleases);

// Migrations (admin only - requires API key)
router.get('/migrate/box-set-fields', requireApiKey, migrateBoxSetFields);

export default router;
