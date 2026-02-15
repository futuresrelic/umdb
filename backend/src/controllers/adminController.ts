import { Request, Response } from 'express';
import { PrismaClient, EntryStatus } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/pending - list all pending movies and physical copies
export async function getPendingEntries(req: Request, res: Response): Promise<void> {
  try {
    const [movies, physicalCopies] = await Promise.all([
      prisma.movie.findMany({
        where: { status: EntryStatus.PENDING },
        include: {
          submittedBy: { select: { id: true, name: true, email: true, photo: true } },
          movieGenres: { include: { genre: true } },
          physicalCopies: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.physicalCopy.findMany({
        where: { status: EntryStatus.PENDING },
        include: {
          submittedBy: { select: { id: true, name: true, email: true, photo: true } },
          movie: { select: { id: true, title: true, year: true, status: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    res.json({ movies, physicalCopies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending entries' });
  }
}

// GET /api/admin/stats - verification stats
export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const [pendingMovies, verifiedMovies, rejectedMovies, pendingCopies, totalUsers] =
      await Promise.all([
        prisma.movie.count({ where: { status: EntryStatus.PENDING } }),
        prisma.movie.count({ where: { status: EntryStatus.VERIFIED } }),
        prisma.movie.count({ where: { status: EntryStatus.REJECTED } }),
        prisma.physicalCopy.count({ where: { status: EntryStatus.PENDING } }),
        prisma.user.count(),
      ]);
    res.json({ pendingMovies, verifiedMovies, rejectedMovies, pendingCopies, totalUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

// POST /api/admin/movies/:id/verify
export async function verifyMovie(req: Request, res: Response): Promise<void> {
  try {
    const movie = await prisma.movie.update({
      where: { id: req.params.id },
      data: { status: EntryStatus.VERIFIED, verifiedAt: new Date(), rejectedAt: null, rejectionReason: null },
    });
    // Also verify any physical copies attached to this movie that are pending
    await prisma.physicalCopy.updateMany({
      where: { movieId: req.params.id, status: EntryStatus.PENDING },
      data: { status: EntryStatus.VERIFIED, verifiedAt: new Date() },
    });
    res.json({ movie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify movie' });
  }
}

// POST /api/admin/movies/:id/reject
export async function rejectMovie(req: Request, res: Response): Promise<void> {
  const { reason } = req.body;
  try {
    const movie = await prisma.movie.update({
      where: { id: req.params.id },
      data: { status: EntryStatus.REJECTED, rejectedAt: new Date(), rejectionReason: reason || null },
    });
    res.json({ movie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject movie' });
  }
}

// POST /api/admin/movies/:id/merge/:targetId
// Merges pending movie (id) into existing verified movie (targetId)
// - Moves all physical copies to targetId
// - Deletes the pending movie
export async function mergeMovies(req: Request, res: Response): Promise<void> {
  const { id, targetId } = req.params;
  try {
    const [source, target] = await Promise.all([
      prisma.movie.findUnique({ where: { id } }),
      prisma.movie.findUnique({ where: { id: targetId } }),
    ]);

    if (!source || !target) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    // Move physical copies from source to target
    await prisma.physicalCopy.updateMany({
      where: { movieId: id },
      data: { movieId: targetId, status: EntryStatus.VERIFIED, verifiedAt: new Date() },
    });

    // Delete source movie
    await prisma.movie.delete({ where: { id } });

    const updatedTarget = await prisma.movie.findUnique({
      where: { id: targetId },
      include: { physicalCopies: true },
    });

    res.json({ merged: true, movie: updatedTarget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to merge movies' });
  }
}

// POST /api/admin/physical-copies/:id/verify
export async function verifyPhysicalCopy(req: Request, res: Response): Promise<void> {
  try {
    const copy = await prisma.physicalCopy.update({
      where: { id: req.params.id },
      data: { status: EntryStatus.VERIFIED, verifiedAt: new Date(), rejectedAt: null, rejectionReason: null },
    });
    res.json({ physicalCopy: copy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify physical copy' });
  }
}

// POST /api/admin/physical-copies/:id/reject
export async function rejectPhysicalCopy(req: Request, res: Response): Promise<void> {
  const { reason } = req.body;
  try {
    const copy = await prisma.physicalCopy.update({
      where: { id: req.params.id },
      data: { status: EntryStatus.REJECTED, rejectedAt: new Date(), rejectionReason: reason || null },
    });
    res.json({ physicalCopy: copy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject physical copy' });
  }
}

// GET /api/admin/movies - all movies with status info (admin view)
export async function getAllMoviesAdmin(req: Request, res: Response): Promise<void> {
  const { status } = req.query;
  try {
    const movies = await prisma.movie.findMany({
      where: status ? { status: status as EntryStatus } : undefined,
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        physicalCopies: { select: { id: true, format: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ movies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
}

// GET /api/admin/users - list all users
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { submittedMovies: true, submittedPhysicalCopies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// PUT /api/admin/users/:id/role
export async function setUserRole(req: Request, res: Response): Promise<void> {
  const { role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}
