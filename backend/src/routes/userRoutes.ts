import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/me/submissions - user's own movies and physical copies
router.get('/me/submissions', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const [movies, physicalCopies] = await Promise.all([
      prisma.movie.findMany({
        where: { submittedById: userId },
        include: {
          movieGenres: { include: { genre: true } },
          physicalCopies: { select: { id: true, format: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.physicalCopy.findMany({
        where: { submittedById: userId },
        include: {
          movie: { select: { id: true, title: true, year: true, posterUrl: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ movies, physicalCopies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

export default router;
