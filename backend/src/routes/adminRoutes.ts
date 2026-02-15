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
} from '../controllers/adminController';

const router = Router();

router.use(requireAdmin);

router.get('/pending', getPendingEntries);
router.get('/stats', getAdminStats);
router.get('/movies', getAllMoviesAdmin);
router.post('/movies/:id/verify', verifyMovie);
router.post('/movies/:id/reject', rejectMovie);
router.post('/movies/:id/merge/:targetId', mergeMovies);
router.post('/physical-copies/:id/verify', verifyPhysicalCopy);
router.post('/physical-copies/:id/reject', rejectPhysicalCopy);
router.get('/users', getUsers);
router.put('/users/:id/role', setUserRole);

export default router;
