import { Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { PhysicalFormat, EntryStatus } from '@prisma/client';
import { scrapeMultipleSources } from '../services/webScraper';

// Get all physical copies for a movie
export const getMoviePhysicalCopies = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;

  const copies = await prisma.physicalCopy.findMany({
    where: { movieId },
    orderBy: { createdAt: 'desc' }
  });

  res.json(copies);
});

// Get a specific physical copy
export const getPhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const copy = await prisma.physicalCopy.findUnique({
    where: { id },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
          posterUrl: true
        }
      }
    }
  });

  if (!copy) {
    throw new AppError('Physical copy not found', 404);
  }

  res.json(copy);
});

// Create a physical copy
export const createPhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const {
    format,
    isSuper,
    editionName,
    packageType,
    language,
    region,
    videoStandard,
    country,
    edition,
    discCount,
    components,
    audioFormats,
    subtitles,
    copyProtected,
    bonusContent,
    studio,
    editionPublisher,
    distributor,
    releaseDate,
    upc,
    ean,
    asin,
    condition,
    location,
    purchaseDate,
    purchasePrice,
    coverImageUrl,
    notes
  } = req.body;

  // Validate format
  if (!format || !Object.values(PhysicalFormat).includes(format)) {
    throw new AppError('Valid format is required', 400);
  }

  // Check if movie exists
  const movie = await prisma.movie.findUnique({
    where: { id: movieId }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  const submittedById = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  const copy = await prisma.physicalCopy.create({
    data: {
      movieId,
      format,
      isSuper: isSuper || null,
      editionName: editionName || null,
      packageType: packageType || null,
      language: language || null,
      region: region || null,
      videoStandard: videoStandard || null,
      country: country || null,
      edition: edition || null,
      discCount: discCount ? parseInt(discCount) : null,
      components: components || null,
      audioFormats: audioFormats || [],
      subtitles: subtitles || [],
      copyProtected: copyProtected || null,
      bonusContent: bonusContent || null,
      studio: studio || null,
      editionPublisher: editionPublisher || null,
      distributor: distributor || null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      upc: upc || null,
      ean: ean || null,
      asin: asin || null,
      condition: condition || null,
      location: location || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      coverImageUrl: coverImageUrl || null,
      notes: notes || null,
      status: isAdmin ? EntryStatus.VERIFIED : EntryStatus.PENDING,
      submittedById: submittedById || null,
      verifiedAt: isAdmin ? new Date() : null,
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
          posterUrl: true
        }
      }
    }
  });

  res.status(201).json(copy);
});

// Update a physical copy
export const updatePhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    format,
    isSuper,
    editionName,
    packageType,
    language,
    region,
    videoStandard,
    country,
    edition,
    discCount,
    components,
    audioFormats,
    subtitles,
    copyProtected,
    bonusContent,
    studio,
    editionPublisher,
    distributor,
    releaseDate,
    upc,
    ean,
    asin,
    condition,
    location,
    purchaseDate,
    purchasePrice,
    coverImageUrl,
    notes
  } = req.body;

  // Check if copy exists
  const existing = await prisma.physicalCopy.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Physical copy not found', 404);
  }

  // Validate format if provided
  if (format && !Object.values(PhysicalFormat).includes(format)) {
    throw new AppError('Invalid format', 400);
  }

  const copy = await prisma.physicalCopy.update({
    where: { id },
    data: {
      ...(format && { format }),
      ...(isSuper !== undefined && { isSuper: isSuper || null }),
      ...(editionName !== undefined && { editionName: editionName || null }),
      ...(packageType !== undefined && { packageType: packageType || null }),
      ...(language !== undefined && { language: language || null }),
      ...(region !== undefined && { region: region || null }),
      ...(videoStandard !== undefined && { videoStandard: videoStandard || null }),
      ...(country !== undefined && { country: country || null }),
      ...(edition !== undefined && { edition: edition || null }),
      ...(discCount !== undefined && { discCount: discCount ? parseInt(discCount) : null }),
      ...(components !== undefined && { components: components || null }),
      ...(audioFormats !== undefined && { audioFormats: audioFormats || [] }),
      ...(subtitles !== undefined && { subtitles: subtitles || [] }),
      ...(copyProtected !== undefined && { copyProtected: copyProtected || null }),
      ...(bonusContent !== undefined && { bonusContent: bonusContent || null }),
      ...(studio !== undefined && { studio: studio || null }),
      ...(editionPublisher !== undefined && { editionPublisher: editionPublisher || null }),
      ...(distributor !== undefined && { distributor: distributor || null }),
      ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
      ...(upc !== undefined && { upc: upc || null }),
      ...(ean !== undefined && { ean: ean || null }),
      ...(asin !== undefined && { asin: asin || null }),
      ...(condition !== undefined && { condition: condition || null }),
      ...(location !== undefined && { location: location || null }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null }),
      ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl || null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
          posterUrl: true
        }
      }
    }
  });

  res.json(copy);
});

// Delete a physical copy
export const deletePhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.physicalCopy.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Physical copy not found', 404);
  }

  await prisma.physicalCopy.delete({
    where: { id }
  });

  res.json({ message: 'Physical copy deleted successfully' });
});

// Get all physical copies (for inventory/collection view)
export const getAllPhysicalCopies = asyncHandler(async (req: Request, res: Response) => {
  const { format, location, condition, limit, offset } = req.query;

  const where: any = {};

  if (format) {
    where.format = format;
  }
  if (location) {
    where.location = location;
  }
  if (condition) {
    where.condition = condition;
  }

  const [copies, total] = await Promise.all([
    prisma.physicalCopy.findMany({
      where,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            year: true,
            posterUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0
    }),
    prisma.physicalCopy.count({ where })
  ]);

  res.json({
    copies,
    total,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0
  });
});

// Fetch physical copy data from barcode (UPC/EAN/ASIN)
export const fetchFromBarcode = asyncHandler(async (req: Request, res: Response) => {
  const { barcode } = req.params;
  const { movieId } = req.query;

  if (!barcode) {
    throw new AppError('Barcode is required', 400);
  }

  const results: any[] = [];
  let detectedAsin: string | null = null;

  // Try UPCitemdb.com API first (fast, free)
  try {
    const upcResponse = await axios.get(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      timeout: 5000
    });
    if (upcResponse.data && upcResponse.data.items && upcResponse.data.items.length > 0) {
      const item = upcResponse.data.items[0];

      // Extract ASIN from UPC response if available
      if (item.asin) {
        detectedAsin = item.asin;
      }

      results.push({
        source: 'UPC Database',
        confidence: 0.7,
        data: {
          distributor: item.brand || undefined,
          editionName: item.title || undefined,
          notes: item.description || undefined,
          coverImageUrl: item.images?.[0] || undefined,
          asin: item.asin || undefined,
          upc: barcode.length === 12 ? barcode : undefined,
          ean: barcode.length === 13 ? barcode : undefined
        }
      });
    }
  } catch (upcError) {
    console.log('UPCitemdb lookup failed:', upcError);
  }

  // Check if the barcode itself is an ASIN (10 alphanumeric characters)
  if (barcode.length === 10 && /^[A-Z0-9]{10}$/.test(barcode)) {
    detectedAsin = barcode;
  }

  // Get movie data if movieId provided
  let movie = null;
  if (movieId) {
    movie = await prisma.movie.findUnique({
      where: { id: movieId as string }
    });
  }

  // Try web scraping with priority on ASIN-based Amazon lookup
  try {
    const scrapedResults = await scrapeMultipleSources(
      detectedAsin || barcode,
      movie?.title || undefined,
      movie?.year || undefined
    );
    results.push(...scrapedResults);
  } catch (scrapeError) {
    console.log('Web scraping failed:', scrapeError);
  }

  // If we found results, return them all for user to choose
  if (results.length > 0) {
    res.json({ results });
  } else {
    throw new AppError(
      `No data found for barcode "${barcode}".\n\n` +
      `Tried: UPC Database, Amazon, Google Shopping, eBay.\n\n` +
      `This may happen if:\n` +
      `- The barcode is incorrect\n` +
      `- The product is not in online databases\n` +
      `- Anti-scraping measures blocked access\n\n` +
      `Try entering the data manually.`,
      404
    );
  }
});

// Search for physical media by name
export const searchPhysicalMedia = asyncHandler(async (req: Request, res: Response) => {
  const { query, movieId } = req.query;

  if (!query || !movieId) {
    throw new AppError('Query and movieId are required', 400);
  }

  // Get the movie from our database
  const movie = await prisma.movie.findUnique({
    where: { id: movieId as string }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  try {
    const results: any[] = [];

    // Search Amazon (requires Product Advertising API key)
    if (process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY) {
      // Amazon Product Advertising API implementation would go here
      // This requires signing requests with HMAC-SHA256
      // For now, we'll skip this and recommend manual entry
    }

    // For now, return a helpful structure based on the movie data
    // Users can manually fill in the physical media details
    results.push({
      source: 'manual',
      title: `${movie.title} (${movie.year})`,
      suggestedData: {
        editionName: `${movie.title} (${movie.year})`
      }
    });

    res.json({ results });
  } catch (error) {
    throw new AppError('Failed to search for physical media', 500);
  }
});
