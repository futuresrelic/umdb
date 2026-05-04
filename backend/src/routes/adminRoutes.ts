import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import {
  getPendingEntries,
  getAdminStats,
  verifyMovie,
  rejectMovie,
  mergeMovies,
  verifyPhysicalCopy,
  rejectPhysicalCopy,
  getAllMoviesAdmin,
  getUsers,
  setUserRole,
  getAllBoxSets,
  deleteBoxSet,
  backfillBoxSet,
  backfillAllBoxSets,
  deleteAllBoxSets,
  clearCineShelfData,
  clearAllData,
  getActivityHistory,
  seedCineShelf,
} from '../controllers/adminController';

const router = Router();

router.use(requireAdmin);

router.get('/pending', getPendingEntries);
router.get('/stats', getAdminStats);
router.get('/movies', getAllMoviesAdmin);
router.get('/activity', getActivityHistory);
router.post('/movies/:id/verify', verifyMovie);
router.post('/movies/:id/reject', rejectMovie);
router.post('/movies/:id/merge/:targetId', mergeMovies);
router.post('/physical-copies/:id/verify', verifyPhysicalCopy);
router.post('/physical-copies/:id/reject', rejectPhysicalCopy);
router.get('/users', getUsers);
router.put('/users/:id/role', setUserRole);

// Box Set Admin Endpoints
router.get('/box-sets', getAllBoxSets);
router.delete('/box-sets/:id', deleteBoxSet);
router.post('/box-sets/:id/backfill', backfillBoxSet);
router.post('/box-sets/backfill-all', backfillAllBoxSets);
router.delete('/box-sets', deleteAllBoxSets);

// CineShelf Data Management
router.delete('/cineshelf-data', clearCineShelfData);

// Nuclear Reset
router.delete('/all-data', clearAllData);

// Partner Apps
router.post('/seed-cineshelf', seedCineShelf);

export default router;
