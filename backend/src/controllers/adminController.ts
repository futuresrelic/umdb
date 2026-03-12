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
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

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
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
      transform: none;
    }
    .status {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      display: none;
    }
    .status.success {
      background: #c6f6d5;
      color: #22543d;
      border: 1px solid #9ae6b4;
      display: block;
    }
    .status.error {
      background: #fed7d7;
      color: #742a2a;
      border: 1px solid #fc8181;
      display: block;
    }
    .status.loading {
      background: #bee3f8;
      color: #2c5282;
      border: 1px solid #90cdf4;
      display: block;
    }
    pre {
      background: #2d3748;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 6px;
      font-size: 12px;
      overflow-x: auto;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 UMDB Database Migrations</h1>
    <p class="subtitle">Click the button below to run pending migrations</p>

    <div class="migration">
      <h2>Box Set Physical Copy Fields</h2>
      <p>Adds box set linkage to the PhysicalCopy table, enabling movies to show their box set releases.</p>
      <ul>
        <li>Add <code>isBoxSet</code>, <code>boxSetId</code>, <code>boxSetPosition</code> columns</li>
        <li>Create foreign key constraint to BoxSet</li>
        <li>Add index for performance</li>
      </ul>
      <button onclick="runMigration()">Run Migration</button>
      <div id="status" class="status"></div>
    </div>
  </div>

  <script>
    async function runMigration() {
      const btn = document.querySelector('button');
      const status = document.getElementById('status');

      btn.disabled = true;
      status.className = 'status loading';
      status.textContent = '⏳ Running migration...';

      try {
        const response = await fetch('${baseUrl}/api/v1/migrate/box-set-fields', {
          headers: {
            'X-API-Key': '${apiKey}'
          }
        });

        const data = await response.json();

        if (response.ok) {
          status.className = 'status success';
          if (data.already_migrated) {
            status.innerHTML = '✅ Migration already applied<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } else {
            status.innerHTML = '✅ Migration completed successfully!<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          }
        } else {
          status.className = 'status error';
          status.innerHTML = '❌ Migration failed<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        }
      } catch (error) {
        status.className = 'status error';
        status.innerHTML = '❌ Network error: ' + error.message;
      } finally {
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>
  `);
}
