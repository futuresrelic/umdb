import prisma from '../utils/prisma';

interface TMDBCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string;
  order?: number;
}

interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string;
}

interface TMDBData {
  credits?: {
    cast?: TMDBCastMember[];
    crew?: TMDBCrewMember[];
  };
  alternative_titles?: {
    titles?: Array<{
      iso_3166_1: string;
      title: string;
      type: string;
    }>;
  };
  genres?: Array<{
    id: number;
    name: string;
  }>;
  images?: {
    posters?: Array<{
      file_path: string;
      vote_average?: number;
    }>;
    backdrops?: Array<{
      file_path: string;
      vote_average?: number;
    }>;
  };
}

export class ImportService {
  /**
   * Import cast and crew from TMDB cached data
   */
  async importCastAndCrew(movieId: string, tmdbData: TMDBData): Promise<void> {
    if (!tmdbData.credits) {
      console.log('No credits data found in TMDB cache');
      return;
    }

    const { cast = [], crew = [] } = tmdbData.credits;

    // Import cast (actors)
    for (const castMember of cast) {
      await this.importPerson(movieId, castMember, 'ACTOR', castMember.character);
    }

    // Import crew - prioritize directors, writers, and producers
    const directors = crew.filter(c => c.job === 'Director');
    const writers = crew.filter(c => c.department === 'Writing');
    const producers = crew.filter(c => c.department === 'Production' &&
      (c.job.includes('Producer') || c.job === 'Executive Producer'));
    const otherCrew = crew.filter(c =>
      c.department !== 'Writing' &&
      c.job !== 'Director' &&
      !(c.department === 'Production' && c.job.includes('Producer'))
    );

    // Import directors
    for (const director of directors) {
      await this.importPerson(movieId, director, 'DIRECTOR');
    }

    // Import writers
    for (const writer of writers) {
      await this.importPerson(movieId, writer, 'WRITER');
    }

    // Import producers
    for (const producer of producers) {
      await this.importPerson(movieId, producer, 'PRODUCER');
    }

    // Import other crew (limit to key roles)
    const keyDepartments = ['Camera', 'Editing', 'Sound', 'Art', 'Costume & Make-Up'];
    const keyCrew = otherCrew.filter(c => keyDepartments.includes(c.department));

    for (const crewMember of keyCrew.slice(0, 20)) { // Limit to 20 key crew
      await this.importPerson(movieId, crewMember, 'CREW', undefined, crewMember.job);
    }
  }

  /**
   * Import a person and create movie-person relationship
   */
  private async importPerson(
    movieId: string,
    personData: TMDBCastMember | TMDBCrewMember,
    role: 'ACTOR' | 'DIRECTOR' | 'WRITER' | 'PRODUCER' | 'CREW',
    character?: string,
    job?: string
  ): Promise<void> {
    try {
      // Check if person already exists by TMDB ID
      let person = await prisma.person.findFirst({
        where: { tmdbId: personData.id }
      });

      // If not, create new person
      if (!person) {
        person = await prisma.person.create({
          data: {
            name: personData.name,
            tmdbId: personData.id,
            photoUrl: personData.profile_path
              ? `https://image.tmdb.org/t/p/w500${personData.profile_path}`
              : null
          }
        });
      }

      // Check if this movie-person relationship already exists
      const existing = await prisma.moviePerson.findFirst({
        where: {
          movieId,
          personId: person.id,
          role
        }
      });

      // Create relationship if it doesn't exist
      if (!existing) {
        await prisma.moviePerson.create({
          data: {
            movieId,
            personId: person.id,
            role,
            character: character || null,
            job: job || null
          }
        });
      }
    } catch (error) {
      console.error(`Error importing person ${personData.name}:`, error);
    }
  }

  /**
   * Import alternate titles from TMDB data
   */
  async importAlternateTitles(movieId: string, tmdbData: TMDBData): Promise<void> {
    if (!tmdbData.alternative_titles?.titles) {
      console.log('No alternate titles found in TMDB cache');
      return;
    }

    for (const altTitle of tmdbData.alternative_titles.titles) {
      try {
        // Check if this alternate title already exists
        const existing = await prisma.alternativeTitle.findFirst({
          where: {
            movieId,
            title: altTitle.title,
            region: altTitle.iso_3166_1
          }
        });

        if (!existing) {
          await prisma.alternativeTitle.create({
            data: {
              movieId,
              title: altTitle.title,
              region: altTitle.iso_3166_1,
              type: altTitle.type || null
            }
          });
        }
      } catch (error) {
        console.error(`Error importing alternate title ${altTitle.title}:`, error);
      }
    }
  }

  /**
   * Import genres from TMDB data
   */
  async importGenres(movieId: string, tmdbData: TMDBData): Promise<void> {
    if (!tmdbData.genres) {
      console.log('No genres found in TMDB cache');
      return;
    }

    for (const genreData of tmdbData.genres) {
      try {
        // Find or create genre
        let genre = await prisma.genre.findFirst({
          where: { tmdbId: genreData.id }
        });

        if (!genre) {
          genre = await prisma.genre.create({
            data: {
              name: genreData.name,
              tmdbId: genreData.id
            }
          });
        }

        // Create movie-genre relationship
        const existing = await prisma.movieGenre.findFirst({
          where: {
            movieId,
            genreId: genre.id
          }
        });

        if (!existing) {
          await prisma.movieGenre.create({
            data: {
              movieId,
              genreId: genre.id
            }
          });
        }
      } catch (error) {
        console.error(`Error importing genre ${genreData.name}:`, error);
      }
    }
  }

  /**
   * Import all data from a TMDB external match
   */
  async importFromTMDB(movieId: string, externalMatchId: string): Promise<void> {
    // Get the external match with cached TMDB data
    const externalMatch = await prisma.externalMatch.findUnique({
      where: { id: externalMatchId }
    });

    if (!externalMatch || externalMatch.source !== 'TMDB') {
      throw new Error('External match not found or not a TMDB match');
    }

    const tmdbData = externalMatch.cachedData as TMDBData;

    // Import all data types
    await this.importCastAndCrew(movieId, tmdbData);
    await this.importAlternateTitles(movieId, tmdbData);
    await this.importGenres(movieId, tmdbData);

    console.log(`Successfully imported data from TMDB for movie ${movieId}`);
  }

  /**
   * Import data for a movie from all its external matches
   */
  async importFromAllMatches(movieId: string): Promise<void> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: { externalMatches: true }
    });

    if (!movie) {
      throw new Error('Movie not found');
    }

    // Import from TMDB match (most complete data)
    const tmdbMatch = movie.externalMatches.find(m => m.source === 'TMDB');
    if (tmdbMatch) {
      await this.importFromTMDB(movieId, tmdbMatch.id);
    }
  }
}

export const importService = new ImportService();
