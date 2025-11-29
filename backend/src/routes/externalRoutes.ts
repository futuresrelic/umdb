import { Router } from 'express';
import {
  searchExternal,
  importFromTMDB,
  importFromIMDB
} from '../controllers/externalController';

const router = Router();

router.get('/search', searchExternal);
router.post('/import/tmdb', importFromTMDB);
router.post('/import/imdb', importFromIMDB);

export default router;
