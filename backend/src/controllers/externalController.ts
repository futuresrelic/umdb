import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import tmdbService from '../services/tmdbService';
import omdbService from '../services/omdbService';
import matchingService from '../services/matchingService';
import prisma from '../utils/prisma';
import { ExternalSource } from '@prisma/client';

export const searchExternal = asyncHandler(async (req: Request, res: Response) => {
  const { query, year, source } = req.query;

  if (!query) {
    throw new AppError('Query parameter is required', 400);
  }

  const results: any = {
    query: String(query),
    year: year ? parseInt(String(year)) : undefined
  };

  // Search both sources if no specific source is requested
  if (!source || source === 'tmdb') {
    try {
      const tmdbResults = await tmdbService.searchMovies(
        String(query),
        year ? parseInt(String(year)) : undefined
      );
      results.tmdb = tmdbResults.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        posterUrl: tmdbService.getPosterUrl(movie.poster_path),
        overview: movie.overview,
        rating: movie.vote_average
      }));
    } catch (error) {
      results.tmdb = { error: 'Failed to search TMDB' };
    }
  }

  if (!source || source === 'omdb') {
    try {
      const omdbResults = await omdbService.searchMovies(
        String(query),
        year ? parseInt(String(year)) : undefined
      );
      results.omdb = omdbResults.map((movie: any) => ({
        imdbId: movie.imdbID,
        title: movie.Title,
        year: parseInt(movie.Year),
        posterUrl: movie.Poster !== 'N/A' ? movie.Poster : null,
        type: movie.Type
      }));
    } catch (error) {
      results.omdb = { error: 'Failed to search OMDB' };
    }
  }

  res.json(results);
});

export const importFromTMDB = asyncHandler(async (req: Request, res: Response) => {
  const { tmdbId } = req.body;

  if (!tmdbId) {
    throw new AppError('TMDB ID is required', 400);
  }

  // Get movie details from TMDB
  const tmdbMovie = await tmdbService.getMovieDetails(parseInt(tmdbId));

  // Check if movie already exists
  const existing = await prisma.externalMatch.findFirst({
    where: {
      source: 'TMDB',
      externalId: String(tmdbId)
    },
    include: {
      movie: true
    }
  });

  if (existing) {
    return res.json({
      message: 'Movie already exists in UMDB',
      movie: existing.movie
    });
  }

  // Create genres if they don't exist
  const genreIds: string[] = [];
  if (tmdbMovie.genres) {
    for (const tmdbGenre of tmdbMovie.genres) {
      let genre = await prisma.genre.findUnique({
        where: { tmdbId: tmdbGenre.id }
      });

      if (!genre) {
        genre = await prisma.genre.create({
          data: {
            name: tmdbGenre.name,
            tmdbId: tmdbGenre.id
          }
        });
      }

      genreIds.push(genre.id);
    }
  }

  // Create the movie
  const movie = await prisma.movie.create({
    data: {
      title: tmdbMovie.title,
      originalTitle: tmdbMovie.original_title,
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
      runtime: tmdbMovie.runtime || null,
      plot: tmdbMovie.overview,
      tagline: tmdbMovie.tagline,
      language: tmdbMovie.original_language,
      posterUrl: tmdbService.getPosterUrl(tmdbMovie.poster_path),
      backdropUrl: tmdbService.getBackdropUrl(tmdbMovie.backdrop_path),
      sourceType: 'TMDB',
      rating: tmdbMovie.vote_average,
      externalMatches: {
        create: {
          source: 'TMDB',
          externalId: String(tmdbId),
          url: `https://www.themoviedb.org/movie/${tmdbId}`,
          rating: tmdbMovie.vote_average,
          voteCount: tmdbMovie.vote_count
        }
      },
      movieGenres: {
        create: genreIds.map(genreId => ({
          genre: { connect: { id: genreId } }
        }))
      }
    },
    include: {
      externalMatches: true,
      movieGenres: {
        include: {
          genre: true
        }
      }
    }
  });

  // Import cast and crew
  if (tmdbMovie.credits) {
    // Import directors
    const directors = tmdbMovie.credits.crew?.filter(c => c.job === 'Director') || [];
    for (const director of directors.slice(0, 5)) {
      let person = await prisma.person.findUnique({
        where: { tmdbId: director.id }
      });

      if (!person) {
        person = await prisma.person.create({
          data: {
            name: director.name,
            tmdbId: director.id,
            photoUrl: tmdbService.getImageUrl(director.profile_path, 'w500')
          }
        });
      }

      await prisma.moviePerson.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          role: 'DIRECTOR'
        }
      });
    }

    // Import main cast
    const cast = tmdbMovie.credits.cast?.slice(0, 10) || [];
    for (const actor of cast) {
      let person = await prisma.person.findUnique({
        where: { tmdbId: actor.id }
      });

      if (!person) {
        person = await prisma.person.create({
          data: {
            name: actor.name,
            tmdbId: actor.id,
            photoUrl: tmdbService.getImageUrl(actor.profile_path, 'w500')
          }
        });
      }

      await prisma.moviePerson.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          role: 'ACTOR',
          character: actor.character,
          order: actor.order
        }
      });
    }
  }

  // Fetch the complete movie with all relationships
  const completeMovie = await prisma.movie.findUnique({
    where: { id: movie.id },
    include: {
      externalMatches: true,
      movieGenres: {
        include: {
          genre: true
        }
      },
      moviePeople: {
        include: {
          person: true
        }
      }
    }
  });

  res.status(201).json(completeMovie);
});

export const importFromIMDB = asyncHandler(async (req: Request, res: Response) => {
  const { imdbId } = req.body;

  if (!imdbId) {
    throw new AppError('IMDB ID is required', 400);
  }

  // Check if movie already exists
  const existing = await prisma.externalMatch.findFirst({
    where: {
      source: 'IMDB',
      externalId: imdbId
    },
    include: {
      movie: true
    }
  });

  if (existing) {
    return res.json({
      message: 'Movie already exists in UMDB',
      movie: existing.movie
    });
  }

  // Get movie details from OMDB (which provides IMDB data)
  const omdbMovie = await omdbService.getMovieByImdbId(imdbId);

  // Parse genres
  const genreNames = omdbMovie.Genre.split(', ').filter(Boolean);
  const genreIds: string[] = [];

  for (const genreName of genreNames) {
    let genre = await prisma.genre.findUnique({
      where: { name: genreName }
    });

    if (!genre) {
      genre = await prisma.genre.create({
        data: { name: genreName }
      });
    }

    genreIds.push(genre.id);
  }

  // Create the movie
  const movie = await prisma.movie.create({
    data: {
      title: omdbMovie.Title,
      year: parseInt(omdbMovie.Year),
      runtime: omdbService.parseRuntime(omdbMovie.Runtime),
      plot: omdbMovie.Plot,
      language: omdbMovie.Language,
      country: omdbMovie.Country,
      posterUrl: omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : null,
      sourceType: 'IMDB',
      rating: parseFloat(omdbMovie.imdbRating),
      externalMatches: {
        create: {
          source: 'IMDB',
          externalId: imdbId,
          url: `https://www.imdb.com/title/${imdbId}`,
          rating: parseFloat(omdbMovie.imdbRating),
          voteCount: parseInt(omdbMovie.imdbVotes.replace(/,/g, ''))
        }
      },
      movieGenres: {
        create: genreIds.map(genreId => ({
          genre: { connect: { id: genreId } }
        }))
      }
    },
    include: {
      externalMatches: true,
      movieGenres: {
        include: {
          genre: true
        }
      }
    }
  });

  res.status(201).json(movie);
});

// Find matches across all sources for a movie
export const findMatchesForMovie = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;

  // Get the movie
  const movie = await prisma.movie.findUnique({
    where: { id: movieId }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  // Find matches
  const matches = await matchingService.findMatches(movie.title, movie.year || undefined);

  res.json({
    movieId,
    title: movie.title,
    year: movie.year,
    matches
  });
});

// Save a match to a movie
export const saveMatchToMovie = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const { source, externalId } = req.body;

  if (!source || !externalId) {
    throw new AppError('Source and external ID are required', 400);
  }

  // Validate source
  if (!Object.values(ExternalSource).includes(source)) {
    throw new AppError('Invalid source', 400);
  }

  // Check if movie exists
  const movie = await prisma.movie.findUnique({
    where: { id: movieId }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  // Save the match
  await matchingService.saveMatch(movieId, source as ExternalSource, externalId);

  // Return updated movie with all matches
  const updatedMovie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      externalMatches: true,
      alternativeTitles: true
    }
  });

  res.json(updatedMovie);
});

// Get all matches for a movie
export const getMovieMatches = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;

  const matches = await matchingService.getMovieMatches(movieId);

  res.json(matches);
});

// Get detailed data from a specific source
export const getSourceDetails = asyncHandler(async (req: Request, res: Response) => {
  const { source, externalId } = req.params;

  // Validate source
  if (!Object.values(ExternalSource).includes(source as ExternalSource)) {
    throw new AppError('Invalid source', 400);
  }

  const details = await matchingService.getDetailedData(source as ExternalSource, externalId);

  res.json(details);
});

// Remove a match from a movie
export const removeMatchFromMovie = asyncHandler(async (req: Request, res: Response) => {
  const { movieId, source } = req.params;

  // Validate source
  if (!Object.values(ExternalSource).includes(source as ExternalSource)) {
    throw new AppError('Invalid source', 400);
  }

  await matchingService.removeMatch(movieId, source as ExternalSource);

  res.json({ message: 'Match removed successfully' });
});
