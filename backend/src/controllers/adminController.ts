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

// GET /api/v1/admin/migrations - serve HTML page with click-to-migrate buttons
export function adminMigrationsPage(req: Request, res: Response): void {
  const apiKey = process.env.UMDB_API_KEY || '';

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UMDB Migrations</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 600px;
      width: 100%;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
      color: #1a202c;
    }
    .subtitle {
      color: #718096;
      margin-bottom: 32px;
      font-size: 14px;
    }
    .migration {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .migration h2 {
      font-size: 18px;
      margin-bottom: 8px;
      color: #2d3748;
    }
    .migration p {
      color: #4a5568;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .migration ul {
      margin: 12px 0 16px 20px;
      color: #4a5568;
      font-size: 14px;
    }
    .migration li {
      margin-bottom: 4px;
    }
    a.button {
      display: block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      text-align: center;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.2s;
    }
    a.button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }
    a.button:active {
      transform: translateY(0);
    }
    .note {
      margin-top: 16px;
      padding: 12px;
      background: #fff5e6;
      border: 1px solid #ffd699;
      border-radius: 8px;
      font-size: 13px;
      color: #8c5a00;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 UMDB Database Migrations</h1>
    <p class="subtitle">Click the button below to run the migration</p>

    <div class="migration">
      <h2>Box Set Physical Copy Fields</h2>
      <p>Adds box set linkage to the PhysicalCopy table, enabling movies to show their box set releases.</p>
      <ul>
        <li>Add <code>isBoxSet</code>, <code>boxSetId</code>, <code>boxSetPosition</code> columns</li>
        <li>Create foreign key constraint to BoxSet</li>
        <li>Add index for performance</li>
      </ul>
      <a href="/api/v1/migrate/box-set-fields?api_key=${apiKey}" class="button" target="_blank">🚀 Run Migration</a>
      <div class="note">
        ℹ️ The migration will open in a new tab and show JSON output. Safe to run multiple times (idempotent).
      </div>
    </div>
  </div>
</body>
</html>
  `);
}

// ============================================================================
// BOX SET ADMIN ENDPOINTS
// ============================================================================

// GET /api/admin/box-sets - List all box sets with PhysicalCopy link stats
export async function getAllBoxSets(req: Request, res: Response): Promise<void> {
  try {
    const boxSets = await prisma.boxSet.findMany({
      include: {
        items: {
          select: {
            id: true,
            movieId: true,
            physicalCopyId: true,
            movie: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const boxSetsWithStats = boxSets.map(boxSet => ({
      id: boxSet.id,
      name: boxSet.name,
      format: boxSet.format,
      region: boxSet.region,
      movieCount: boxSet.items.length,
      physicalCopiesLinked: boxSet.items.filter(item => item.physicalCopyId !== null).length,
      createdAt: boxSet.createdAt,
      movies: boxSet.items.map(item => item.movie?.title).filter(Boolean),
    }));

    res.json({ boxSets: boxSetsWithStats });
  } catch (err) {
    console.error('Failed to get box sets:', err);
    res.status(500).json({ error: 'Failed to get box sets' });
  }
}

// DELETE /api/admin/box-sets/:id - Delete a single box set
export async function deleteBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    console.log(`🗑️  Admin deleting box set: ${id}`);

    // Prisma will cascade delete BoxSetItems and set PhysicalCopy.boxSetId to null
    await prisma.boxSet.delete({ where: { id } });

    console.log(`✅ Deleted box set: ${id}`);
    res.json({ success: true, message: 'Box set deleted' });
  } catch (err) {
    console.error('Failed to delete box set:', err);
    res.status(500).json({ error: 'Failed to delete box set' });
  }
}

// POST /api/admin/box-sets/:id/backfill - Backfill PhysicalCopy for one box set
export async function backfillBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    console.log(`🔧 Backfilling box set: ${id}`);

    const boxSet = await prisma.boxSet.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            movie: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!boxSet) {
      res.status(404).json({ error: 'Box set not found' });
      return;
    }

    // Find items that need PhysicalCopy records (physicalCopyId is null)
    const itemsNeedingBackfill = boxSet.items.filter(
      item => item.movieId && !item.physicalCopyId
    );

    if (itemsNeedingBackfill.length === 0) {
      res.json({
        success: true,
        message: 'No backfill needed - all items already have PhysicalCopy records',
        backfilled: 0,
      });
      return;
    }

    // Create PhysicalCopy records
    const releasesData = itemsNeedingBackfill.map(item => ({
      movieId: item.movieId!,
      format: 'OTHER' as any,
      editionName: boxSet.name,
      edition: boxSet.edition || null,
      packageType: boxSet.packageType || null,
      region: boxSet.region || null,
      notes: boxSet.notes || null,
      coverImageUrl: boxSet.coverImageUrl || null,
      isBoxSet: true,
      boxSetId: boxSet.id,
      boxSetPosition: item.position,
      hasSlipcover: boxSet.hasSlipcover ?? false,
      hasBooklet: boxSet.hasBooklet ?? false,
      hasBonusDisc: boxSet.hasBonusDisc ?? false,
      bonusDiscCount: boxSet.bonusDiscCount || null,
      hasDigitalCopy: boxSet.hasDigitalCopy ?? false,
      has3d: boxSet.has3d ?? false,
      discNumber: item.discNumber || null,
      discLabel: item.discLabel || null,
      status: EntryStatus.VERIFIED,
    }));

    await prisma.physicalCopy.createMany({ data: releasesData });

    // Get created PhysicalCopy IDs
    const createdCopies = await prisma.physicalCopy.findMany({
      where: { boxSetId: boxSet.id },
      select: { id: true, movieId: true },
    });

    // Link them back to BoxSetItems
    for (const copy of createdCopies) {
      await prisma.boxSetItem.updateMany({
        where: {
          boxSetId: boxSet.id,
          movieId: copy.movieId,
          physicalCopyId: null,
        },
        data: { physicalCopyId: copy.id },
      });
    }

    console.log(`✅ Backfilled ${itemsNeedingBackfill.length} PhysicalCopy records for box set: ${id}`);
    res.json({
      success: true,
      message: `Backfilled ${itemsNeedingBackfill.length} PhysicalCopy records`,
      backfilled: itemsNeedingBackfill.length,
    });
  } catch (err) {
    console.error('Failed to backfill box set:', err);
    res.status(500).json({ error: 'Failed to backfill box set' });
  }
}

// POST /api/admin/box-sets/backfill-all - Backfill all box sets
export async function backfillAllBoxSets(req: Request, res: Response): Promise<void> {
  try {
    console.log('🔧 Backfilling ALL box sets...');

    const boxSets = await prisma.boxSet.findMany({
      include: {
        items: {
          include: {
            movie: { select: { id: true } },
          },
        },
      },
    });

    let totalBackfilled = 0;

    for (const boxSet of boxSets) {
      const itemsNeedingBackfill = boxSet.items.filter(
        item => item.movieId && !item.physicalCopyId
      );

      if (itemsNeedingBackfill.length === 0) continue;

      // Create PhysicalCopy records
      const releasesData = itemsNeedingBackfill.map(item => ({
        movieId: item.movieId!,
        format: 'OTHER' as any,
        editionName: boxSet.name,
        edition: boxSet.edition || null,
        packageType: boxSet.packageType || null,
        region: boxSet.region || null,
        notes: boxSet.notes || null,
        coverImageUrl: boxSet.coverImageUrl || null,
        isBoxSet: true,
        boxSetId: boxSet.id,
        boxSetPosition: item.position,
        hasSlipcover: boxSet.hasSlipcover ?? false,
        hasBooklet: boxSet.hasBooklet ?? false,
        hasBonusDisc: boxSet.hasBonusDisc ?? false,
        bonusDiscCount: boxSet.bonusDiscCount || null,
        hasDigitalCopy: boxSet.hasDigitalCopy ?? false,
        has3d: boxSet.has3d ?? false,
        discNumber: item.discNumber || null,
        discLabel: item.discLabel || null,
        status: EntryStatus.VERIFIED,
      }));

      await prisma.physicalCopy.createMany({ data: releasesData });

      // Get created PhysicalCopy IDs
      const createdCopies = await prisma.physicalCopy.findMany({
        where: { boxSetId: boxSet.id },
        select: { id: true, movieId: true },
      });

      // Link them back to BoxSetItems
      for (const copy of createdCopies) {
        await prisma.boxSetItem.updateMany({
          where: {
            boxSetId: boxSet.id,
            movieId: copy.movieId,
            physicalCopyId: null,
          },
          data: { physicalCopyId: copy.id },
        });
      }

      totalBackfilled += itemsNeedingBackfill.length;
      console.log(`  ✅ Backfilled ${itemsNeedingBackfill.length} for "${boxSet.name}"`);
    }

    console.log(`✅ Total backfilled: ${totalBackfilled} PhysicalCopy records`);
    res.json({
      success: true,
      message: `Backfilled ${totalBackfilled} PhysicalCopy records across ${boxSets.length} box sets`,
      totalBackfilled,
      boxSetsProcessed: boxSets.length,
    });
  } catch (err) {
    console.error('Failed to backfill all box sets:', err);
    res.status(500).json({ error: 'Failed to backfill all box sets' });
  }
}

// DELETE /api/admin/box-sets - Delete ALL box sets (nuclear option)
export async function deleteAllBoxSets(req: Request, res: Response): Promise<void> {
  try {
    console.log('🗑️  Admin deleting ALL box sets (nuclear option)');

    const count = await prisma.boxSet.count();
    await prisma.boxSet.deleteMany({});

    console.log(`✅ Deleted ${count} box sets`);
    res.json({ success: true, message: `Deleted ${count} box sets` });
  } catch (err) {
    console.error('Failed to delete all box sets:', err);
    res.status(500).json({ error: 'Failed to delete all box sets' });
  }
}

// DELETE /api/admin/cineshelf-data - Clear all CineShelf synced data (NUCLEAR)
export async function clearCineShelfData(req: Request, res: Response): Promise<void> {
  try {
    console.log('🗑️  Admin clearing ALL CineShelf data (NUCLEAR RESET)');

    // 1. Delete all box sets
    const boxSetCount = await prisma.boxSet.count();
    await prisma.boxSet.deleteMany({});
    console.log(`  ✅ Deleted ${boxSetCount} box sets`);

    // 2. Delete all PhysicalCopy records with sourceType = HYBRID (CineShelf-created)
    // Note: Also delete those linked to box sets (isBoxSet = true)
    const physicalCopyCount = await prisma.physicalCopy.deleteMany({
      where: {
        OR: [
          { isBoxSet: true },
          // Add more conditions if needed for CineShelf-specific copies
        ],
      },
    });
    console.log(`  ✅ Deleted ${physicalCopyCount.count} PhysicalCopy records`);

    // 3. Delete all movies with sourceType = HYBRID (CineShelf-created)
    const movieCount = await prisma.movie.deleteMany({
      where: { sourceType: 'HYBRID' },
    });
    console.log(`  ✅ Deleted ${movieCount.count} HYBRID movies`);

    console.log('✅ CineShelf data cleared successfully');
    res.json({
      success: true,
      message: 'CineShelf data cleared',
      deleted: {
        boxSets: boxSetCount,
        physicalCopies: physicalCopyCount.count,
        movies: movieCount.count,
      },
    });
  } catch (err) {
    console.error('Failed to clear CineShelf data:', err);
    res.status(500).json({ error: 'Failed to clear CineShelf data' });
  }
}
