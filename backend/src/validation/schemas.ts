import { z } from 'zod';

// Common validation schemas
export const movieCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  originalTitle: z.string().max(500).optional(),
  year: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  runtime: z.number().int().positive().optional(),
  plot: z.string().max(5000).optional(),
  tagline: z.string().max(500).optional(),
  language: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  backdropUrl: z.string().url().optional().or(z.literal('')),
  physicalFormat: z.string().max(100).optional(),
  distributor: z.string().max(200).optional(),
  upc: z.string().max(50).optional(),
  isbn: z.string().max(50).optional(),
  asin: z.string().max(50).optional(),
  notes: z.string().max(10000).optional(),
  mediaType: z.enum(['MOVIE', 'TV_SHOW', 'MUSIC_ALBUM', 'VINYL', 'CD', 'BOOK', 'GAME', 'OTHER']).optional(),
  rating: z.number().min(0).max(10).optional(),
});

export const movieUpdateSchema = movieCreateSchema.partial();

export const physicalCopyCreateSchema = z.object({
  movieId: z.string().cuid(),
  format: z.enum([
    'DVD', 'BLU_RAY', 'BLU_RAY_4K', 'VHS', 'LASERDISC', 'BETAMAX',
    'HD_DVD', 'DIGITAL', 'STREAMING', 'CD', 'VINYL', 'CASSETTE',
    'EIGHT_TRACK', 'MINI_DISC', 'FILM_8MM', 'FILM_16MM', 'FILM_35MM',
    'FILM_70MM', 'OTHER'
  ]),
  isSuper: z.boolean().optional(),
  editionName: z.string().max(500).optional(),
  packageType: z.string().max(200).optional(),
  language: z.string().max(100).optional(),
  region: z.string().max(50).optional(),
  videoStandard: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  edition: z.string().max(200).optional(),
  discCount: z.number().int().positive().optional(),
  audioFormats: z.array(z.string()).optional(),
  subtitles: z.array(z.string()).optional(),
  copyProtected: z.boolean().optional(),
  bonusContent: z.string().max(5000).optional(),
  studio: z.string().max(200).optional(),
  editionPublisher: z.string().max(200).optional(),
  distributor: z.string().max(200).optional(),
  releaseDate: z.string().datetime().or(z.string().date()).optional(),
  upc: z.string().max(50).optional(),
  ean: z.string().max(50).optional(),
  asin: z.string().max(50).optional(),
  condition: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  purchaseDate: z.string().datetime().or(z.string().date()).optional(),
  purchasePrice: z.number().min(0).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(10000).optional(),
  hasSlipcover: z.boolean().optional(),
  hasBooklet: z.boolean().optional(),
  hasBonusDisc: z.boolean().optional(),
  bonusDiscCount: z.number().int().positive().optional(),
  hasDigitalCopy: z.boolean().optional(),
  has3d: z.boolean().optional(),
});

export const physicalCopyUpdateSchema = physicalCopyCreateSchema.partial();

export const boxSetCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  format: z.string().max(100).optional(),
  edition: z.string().max(200).optional(),
  region: z.string().max(50).optional(),
  packageType: z.string().max(200).optional(),
  notes: z.string().max(10000).optional(),
  hasSlipcover: z.boolean().optional(),
  hasBooklet: z.boolean().optional(),
  hasBonusDisc: z.boolean().optional(),
  bonusDiscCount: z.number().int().positive().optional(),
  hasDigitalCopy: z.boolean().optional(),
  has3d: z.boolean().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  spineImageUrl: z.string().url().optional().or(z.literal('')),
});

export const boxSetUpdateSchema = boxSetCreateSchema.partial();

export const imageUploadSchema = z.object({
  movieId: z.string().cuid().optional(),
  physicalCopyId: z.string().cuid().optional(),
  imageType: z.enum(['POSTER', 'BACKDROP', 'COVER_PHOTO', 'SNAPSHOT']),
  altText: z.string().max(500).optional(),
  dataUrl: z.string().regex(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/, 'Invalid image data URL'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/).optional(),
  isPrimary: z.boolean().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 20),
  type: z.enum(['movie', 'person', 'all']).optional(),
});

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : 20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const filterSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  format: z.string().max(50).optional(),
  year: z.string().regex(/^\d{4}$/).optional().transform(val => val ? parseInt(val, 10) : undefined),
  mediaType: z.enum(['MOVIE', 'TV_SHOW', 'MUSIC_ALBUM', 'VINYL', 'CD', 'BOOK', 'GAME', 'OTHER']).optional(),
  distributor: z.string().max(200).optional(),
  region: z.string().max(50).optional(),
});

// Validation middleware factory
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateParams<T extends z.ZodType>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}
