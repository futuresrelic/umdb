import { Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware = upload.single('file');

export const importFromCSV = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const results: any[] = [];
  const errors: any[] = [];
  let imported = 0;
  let skipped = 0;

  // Parse CSV from buffer
  const stream = Readable.from(req.file.buffer.toString());

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  // Process each row
  for (const row of results) {
    try {
      // Map CSV columns to our schema (flexible mapping)
      const title = row.title || row.Title || row.name || row.Name;

      if (!title) {
        errors.push({ row, error: 'Missing title' });
        skipped++;
        continue;
      }

      // Check if movie already exists
      const existing = await prisma.movie.findFirst({
        where: {
          title: {
            equals: title,
            mode: 'insensitive'
          },
          year: row.year ? parseInt(row.year) : undefined
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Parse year
      let year = null;
      if (row.year || row.Year || row.release_date || row.releaseDate) {
        const yearStr = row.year || row.Year || row.release_date || row.releaseDate;
        const yearMatch = yearStr.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }

      // Parse runtime
      let runtime = null;
      if (row.runtime || row.Runtime || row.duration || row.Duration) {
        const runtimeStr = String(row.runtime || row.Runtime || row.duration || row.Duration);
        const runtimeMatch = runtimeStr.match(/\d+/);
        if (runtimeMatch) {
          runtime = parseInt(runtimeMatch[0]);
        }
      }

      // Parse rating
      let rating = null;
      if (row.rating || row.Rating || row.vote_average || row.imdbRating) {
        const ratingStr = row.rating || row.Rating || row.vote_average || row.imdbRating;
        const ratingNum = parseFloat(ratingStr);
        if (!isNaN(ratingNum)) {
          rating = ratingNum;
        }
      }

      // Create movie
      const movieData: any = {
        title,
        originalTitle: row.originalTitle || row.original_title || row.originalName || null,
        year,
        runtime,
        plot: row.plot || row.Plot || row.overview || row.description || null,
        tagline: row.tagline || row.Tagline || null,
        language: row.language || row.Language || row.original_language || null,
        country: row.country || row.Country || null,
        posterUrl: row.posterUrl || row.poster_url || row.Poster || null,
        backdropUrl: row.backdropUrl || row.backdrop_url || null,
        sourceType: 'MANUAL', // CSV imports are considered manual
        physicalFormat: row.physicalFormat || row.format || row.Format || null,
        distributor: row.distributor || row.Distributor || null,
        upc: row.upc || row.UPC || row.barcode || null,
        notes: row.notes || row.Notes || null,
        rating
      };

      await prisma.movie.create({
        data: movieData
      });

      imported++;
    } catch (error: any) {
      errors.push({ row, error: error.message });
      skipped++;
    }
  }

  res.json({
    success: true,
    imported,
    skipped,
    total: results.length,
    errors: errors.length > 0 ? errors.slice(0, 10) : [] // Only return first 10 errors
  });
});

export const downloadTemplate = asyncHandler(async (req: Request, res: Response) => {
  const csv = `title,originalTitle,year,runtime,plot,tagline,language,country,posterUrl,physicalFormat,distributor,upc,notes,rating
The Matrix,The Matrix,1999,136,"A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",Welcome to the Real World,English,USA,,,Warner Bros,,,8.7
Inception,Inception,2010,148,"A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",Your mind is the scene of the crime,English,USA,,,Warner Bros,,,8.8`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=umdb-template.csv');
  res.send(csv);
});
