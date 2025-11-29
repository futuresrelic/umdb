# UMDB Backend

Backend API server for the Universal Media Database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run dev
```

The server will run on http://localhost:3001

## API Endpoints

### Movies
- `GET /api/movies` - List all movies (with search, filter, pagination)
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies` - Create a new movie (manual entry)
- `PUT /api/movies/:id` - Update a movie
- `DELETE /api/movies/:id` - Delete a movie
- `POST /api/movies/:id/external-matches` - Add external match to movie

### External APIs
- `GET /api/external/search?query=...&year=...&source=...` - Search TMDB and OMDB
- `POST /api/external/import/tmdb` - Import movie from TMDB
- `POST /api/external/import/imdb` - Import movie from IMDB (via OMDB)

### People
- `GET /api/people` - List all people
- `GET /api/people/:id` - Get person details
- `POST /api/people` - Create a new person
- `PUT /api/people/:id` - Update a person
- `DELETE /api/people/:id` - Delete a person

### Genres
- `GET /api/genres` - List all genres
- `GET /api/genres/:id` - Get genre details
- `POST /api/genres` - Create a new genre
- `PUT /api/genres/:id` - Update a genre
- `DELETE /api/genres/:id` - Delete a genre

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `TMDB_API_KEY` - TMDB API key (get from https://www.themoviedb.org/settings/api)
- `OMDB_API_KEY` - OMDB API key (get from http://www.omdbapi.com/apikey.aspx)

Optional:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)

## Database

This project uses PostgreSQL with Prisma ORM.

### Migrations

Create a new migration:
```bash
npm run prisma:migrate
```

Open Prisma Studio (database GUI):
```bash
npm run prisma:studio
```

## Development

Run in watch mode:
```bash
npm run dev
```

## Production

Build and run:
```bash
npm run build
npm start
```
