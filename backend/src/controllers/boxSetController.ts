import { Request, Response } from 'express';
import { PrismaClient, EntryStatus } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/box-sets - List all box sets with search and pagination
export async function getAllBoxSets(req: Request, res: Response): Promise<void> {
  try {
    const { search, format, sortBy = 'createdAt', sortOrder = 'desc', limit = 50, offset = 0 } = req.query;

    const where: any = {};

    // Search by name or notes
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { notes: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by format
    if (format) {
      where.format = format;
    }

    const [boxSets, total] = await Promise.all([
      prisma.boxSet.findMany({
        where,
        include: {
          items: {
            include: {
              movie: {
                select: {
                  id: true,
                  title: true,
                  year: true,
                  posterUrl: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          releases: {
            select: { id: true },
          },
        },
        orderBy: { [sortBy as string]: sortOrder },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.boxSet.count({ where }),
    ]);

    // Format response
    const formattedBoxSets = boxSets.map(boxSet => ({
      id: `boxset-${boxSet.id}`,
      name: boxSet.name,
      format: boxSet.format,
      region: boxSet.region,
      edition: boxSet.edition,
      packageType: boxSet.packageType,
      coverImageUrl: boxSet.coverImageUrl,
      spineImageUrl: boxSet.spineImageUrl,
      movieCount: boxSet.items.length,
      releaseCount: boxSet.releases?.length || 0,
      createdAt: boxSet.createdAt,
      movies: boxSet.items.map(item => ({
        id: item.movie?.id ? `movie-${item.movie.id}` : null,
        title: item.movie?.title,
        year: item.movie?.year,
        posterUrl: item.movie?.posterUrl,
        position: item.position,
        discNumber: item.discNumber,
        discLabel: item.discLabel,
        isPresent: item.isPresent,
      })),
    }));

    res.json({
      boxSets: formattedBoxSets,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    console.error('Failed to get box sets:', err);
    res.status(500).json({ error: 'Failed to get box sets' });
  }
}

// GET /api/box-sets/:id - Get a single box set with all details
export async function getBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rawId = id.replace(/^boxset-/, '');

    const boxSet = await prisma.boxSet.findUnique({
      where: { id: rawId },
      include: {
        items: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                year: true,
                posterUrl: true,
                backdropUrl: true,
                tagline: true,
                plot: true,
                rating: true,
                runtime: true,
              },
            },
            physicalCopy: {
              select: {
                id: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        releases: {
          select: { id: true, movieId: true },
        },
      },
    });

    if (!boxSet) {
      res.status(404).json({ error: 'Box set not found' });
      return;
    }

    // Format response
    const formatted = {
      id: `boxset-${boxSet.id}`,
      name: boxSet.name,
      format: boxSet.format,
      region: boxSet.region,
      edition: boxSet.edition,
      packageType: boxSet.packageType,
      notes: boxSet.notes,
      coverImageUrl: boxSet.coverImageUrl,
      spineImageUrl: boxSet.spineImageUrl,
      hasSlipcover: boxSet.hasSlipcover,
      hasBooklet: boxSet.hasBooklet,
      hasBonusDisc: boxSet.hasBonusDisc,
      bonusDiscCount: boxSet.bonusDiscCount,
      hasDigitalCopy: boxSet.hasDigitalCopy,
      has3d: boxSet.has3d,
      createdAt: boxSet.createdAt,
      updatedAt: boxSet.updatedAt,
      movies: boxSet.items.map(item => ({
        id: item.movie?.id ? `movie-${item.movie.id}` : null,
        boxSetItemId: item.id,
        title: item.movie?.title,
        year: item.movie?.year,
        posterUrl: item.movie?.posterUrl,
        backdropUrl: item.movie?.backdropUrl,
        plot: item.movie?.plot,
        rating: item.movie?.rating,
        runtime: item.movie?.runtime,
        position: item.position,
        discNumber: item.discNumber,
        discLabel: item.discLabel,
        isPresent: item.isPresent,
        physicalCopyId: item.physicalCopy?.id ? `rel-${item.physicalCopy.id}` : null,
      })),
      releases: boxSet.releases?.map(r => ({
        id: `rel-${r.id}`,
        movieId: r.movieId ? `movie-${r.movieId}` : null,
      })) || [],
    };

    res.json({ boxSet: formatted });
  } catch (err) {
    console.error('Failed to get box set:', err);
    res.status(500).json({ error: 'Failed to get box set' });
  }
}

// POST /api/box-sets - Create a new box set (simplified from CineShelf version)
export async function createBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      format,
      region,
      edition,
      packageType,
      notes,
      coverImageUrl,
      spineImageUrl,
      hasSlipcover,
      hasBooklet,
      hasBonusDisc,
      bonusDiscCount,
      hasDigitalCopy,
      has3d,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const boxSet = await prisma.boxSet.create({
      data: {
        name,
        format: format || null,
        region: region || null,
        edition: edition || null,
        packageType: packageType || null,
        notes: notes || null,
        coverImageUrl: coverImageUrl || null,
        spineImageUrl: spineImageUrl || null,
        hasSlipcover: hasSlipcover ?? false,
        hasBooklet: hasBooklet ?? false,
        hasBonusDisc: hasBonusDisc ?? false,
        bonusDiscCount: bonusDiscCount || null,
        hasDigitalCopy: hasDigitalCopy ?? false,
        has3d: has3d ?? false,
        status: EntryStatus.VERIFIED,
      },
    });

    res.status(201).json({
      boxSet: {
        id: `boxset-${boxSet.id}`,
        name: boxSet.name,
        format: boxSet.format,
      },
    });
  } catch (err) {
    console.error('Failed to create box set:', err);
    res.status(500).json({ error: 'Failed to create box set' });
  }
}

// PUT /api/box-sets/:id - Update box set metadata
export async function updateBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rawId = id.replace(/^boxset-/, '');
    const {
      name,
      format,
      region,
      edition,
      packageType,
      notes,
      coverImageUrl,
      spineImageUrl,
      hasSlipcover,
      hasBooklet,
      hasBonusDisc,
      bonusDiscCount,
      hasDigitalCopy,
      has3d,
    } = req.body;

    const boxSet = await prisma.boxSet.update({
      where: { id: rawId },
      data: {
        ...(name !== undefined && { name }),
        ...(format !== undefined && { format }),
        ...(region !== undefined && { region }),
        ...(edition !== undefined && { edition }),
        ...(packageType !== undefined && { packageType }),
        ...(notes !== undefined && { notes }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(spineImageUrl !== undefined && { spineImageUrl }),
        ...(hasSlipcover !== undefined && { hasSlipcover }),
        ...(hasBooklet !== undefined && { hasBooklet }),
        ...(hasBonusDisc !== undefined && { hasBonusDisc }),
        ...(bonusDiscCount !== undefined && { bonusDiscCount }),
        ...(hasDigitalCopy !== undefined && { hasDigitalCopy }),
        ...(has3d !== undefined && { has3d }),
      },
    });

    res.json({
      boxSet: {
        id: `boxset-${boxSet.id}`,
        name: boxSet.name,
      },
    });
  } catch (err) {
    console.error('Failed to update box set:', err);
    res.status(500).json({ error: 'Failed to update box set' });
  }
}

// DELETE /api/box-sets/:id - Delete box set
export async function deleteBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rawId = id.replace(/^boxset-/, '');

    await prisma.boxSet.delete({ where: { id: rawId } });

    res.json({ success: true, message: 'Box set deleted' });
  } catch (err) {
    console.error('Failed to delete box set:', err);
    res.status(500).json({ error: 'Failed to delete box set' });
  }
}

// POST /api/box-sets/:id/movies - Add a movie to box set
export async function addMovieToBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const rawId = id.replace(/^boxset-/, '');
    const { movieId, position, discNumber, discLabel, isPresent = true } = req.body;

    if (!movieId) {
      res.status(400).json({ error: 'movieId is required' });
      return;
    }

    const rawMovieId = movieId.replace(/^movie-/, '');

    const item = await prisma.boxSetItem.create({
      data: {
        boxSetId: rawId,
        movieId: rawMovieId,
        position: position || 0,
        discNumber: discNumber || null,
        discLabel: discLabel || null,
        isPresent: isPresent ?? true,
      },
    });

    res.status(201).json({
      item: {
        id: item.id,
        movieId: `movie-${item.movieId}`,
        position: item.position,
      },
    });
  } catch (err) {
    console.error('Failed to add movie to box set:', err);
    res.status(500).json({ error: 'Failed to add movie to box set' });
  }
}

// DELETE /api/box-sets/:id/movies/:movieId - Remove movie from box set
export async function removeMovieFromBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id, movieId } = req.params;
    const rawId = id.replace(/^boxset-/, '');
    const rawMovieId = movieId.replace(/^movie-/, '');

    await prisma.boxSetItem.deleteMany({
      where: {
        boxSetId: rawId,
        movieId: rawMovieId,
      },
    });

    res.json({ success: true, message: 'Movie removed from box set' });
  } catch (err) {
    console.error('Failed to remove movie from box set:', err);
    res.status(500).json({ error: 'Failed to remove movie from box set' });
  }
}

// PUT /api/box-sets/:id/movies/:movieId - Update movie position/disc info
export async function updateBoxSetMovie(req: Request, res: Response): Promise<void> {
  try {
    const { id, movieId } = req.params;
    const rawId = id.replace(/^boxset-/, '');
    const rawMovieId = movieId.replace(/^movie-/, '');
    const { position, discNumber, discLabel, isPresent } = req.body;

    const item = await prisma.boxSetItem.updateMany({
      where: {
        boxSetId: rawId,
        movieId: rawMovieId,
      },
      data: {
        ...(position !== undefined && { position }),
        ...(discNumber !== undefined && { discNumber }),
        ...(discLabel !== undefined && { discLabel }),
        ...(isPresent !== undefined && { isPresent }),
      },
    });

    res.json({ success: true, updated: item.count });
  } catch (err) {
    console.error('Failed to update box set movie:', err);
    res.status(500).json({ error: 'Failed to update box set movie' });
  }
}
