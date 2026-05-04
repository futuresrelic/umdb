import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import movieRoutes from './routes/movieRoutes';
import externalRoutes from './routes/externalRoutes';
import personRoutes from './routes/personRoutes';
import genreRoutes from './routes/genreRoutes';
import csvRoutes from './routes/csvRoutes';
import physicalCopyRoutes from './routes/physicalCopyRoutes';
import publicRoutes from './routes/publicRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import cineShelfRoutes from './routes/cineShelfRoutes';
import imageRoutes from './routes/imageRoutes';
import iconRoutes from './routes/iconRoutes';
import diagnosticsRoutes from './routes/diagnostics';
import boxSetRoutes from './routes/boxSetRoutes';
import searchRoutes from './routes/searchRoutes';
import partnerAppRoutes from './routes/partnerAppRoutes';
import { initializeFullTextSearch } from './services/searchService';

// Force redeploy with latest schema and routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration - support multiple origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// CORS configuration - restricted to configured origins
// Note: /api/public routes are accessible from any server-side caller (no Origin header)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
// Icons are large (base64 PNG); images are up to 3 MB each — raise the JSON body limit
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file serving for uploaded images
const uploadsDir = path.join(__dirname, '../data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}
app.use('/data/uploads', express.static(uploadsDir));

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// Routes
app.get('/api/health', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Check migrations
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 5;
    `;

    // Check if PhysicalCopy has box set columns
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'PhysicalCopy'
        AND column_name IN ('isBoxSet', 'boxSetId', 'discNumber', 'discLabel');
    `;

    // Count records
    const counts = {
      physicalCopy: await prisma.physicalCopy.count(),
      boxSet: await prisma.boxSet.count(),
      boxSetItem: await prisma.boxSetItem.count(),
    };

    await prisma.$disconnect();

    res.json({
      status: 'ok',
      message: 'UMDB API is running',
      database: {
        connected: true,
        migrations: migrations.map(m => ({
          name: m.migration_name,
          finished: m.finished_at,
          rolledBack: m.rolled_back_at,
        })),
        boxSetColumnsExist: columns.length === 4,
        columnCount: columns.length,
        columns: columns.map(c => c.column_name),
      },
      counts,
    });
  } catch (error) {
    res.json({
      status: 'ok',
      message: 'UMDB API is running',
      database: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/people', personRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/physical-copies', physicalCopyRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/v1', cineShelfRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/icons', iconRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/box-sets', boxSetRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/partner-apps', partnerAppRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎬 UMDB Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // Attempt to enable pg_trgm for fuzzy search — non-fatal if unavailable
  initializeFullTextSearch().catch(() => {});
});

export default app;
