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

### Authentication
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `GET /api/auth/me` - Get current authenticated user (requires auth)

### Movies
- `GET /api/movies` - List all movies (with search, filter, pagination)
- `GET /api/movies/:id` - Get movie details with relationships
- `POST /api/movies` - Create a new movie (requires auth)
- `PUT /api/movies/:id` - Update a movie (requires auth)
- `DELETE /api/movies/:id` - Delete a movie (requires auth)
- `POST /api/movies/:id/external-matches` - Add external match to movie
- `GET /api/movies/:id/physical-copies` - Get all physical copies for a movie

### Physical Copies
- `GET /api/physical-copies` - List all physical copies (with search, filter, pagination)
- `GET /api/physical-copies/:id` - Get physical copy details with movie info
- `POST /api/physical-copies` - Create a new physical copy (requires auth)
- `PUT /api/physical-copies/:id` - Update a physical copy (requires auth)
- `DELETE /api/physical-copies/:id` - Delete a physical copy (requires auth)

Physical copy fields include:
- Format (DVD, Blu-ray, VHS, 4K UHD, LaserDisc, etc.)
- Edition details (Collector's Edition, Director's Cut, region, package type)
- Distribution info (distributor, UPC, EAN, ASIN, release date)
- Audio/video specs (audio formats, subtitles, video standard)
- Box set features (slipcover, booklet, bonus discs, digital copy, 3D)
- Condition and ownership tracking
- Component system for tracking disc contents

### Box Sets
- `GET /api/box-sets` - List all box sets (with search, filter, pagination)
- `GET /api/box-sets/:id` - Get box set details (includes all movies and releases)
- `POST /api/box-sets` - Create a new box set with movies (requires auth)
- `PUT /api/box-sets/:id` - Update a box set (requires auth)
- `DELETE /api/box-sets/:id` - Delete a box set (requires auth)

Box sets support:
- Multi-movie collections (e.g., "The Matrix Trilogy", "Lord of the Rings Extended Edition")
- Special features (slipcover, booklet, bonus discs, 3D, digital copies)
- Disc tracking (disc number, label, presence status)
- Cover and spine images
- Auto-creation of movies from TMDB/IMDB IDs
- Component auto-generation from metadata flags

### Image Management
- `GET /api/images/:id` - Serve image file (public, cache-friendly)
- `GET /api/images/movie/:movieId` - List all images for a movie
- `GET /api/images/copy/:copyId` - List all images for a physical copy
- `POST /api/images` - Upload a new image (requires auth)
- `PUT /api/images/:id` - Update image metadata (requires auth)
- `DELETE /api/images/:id` - Delete an image (requires auth)

Supported image types:
- Cover images (front covers, spines, back covers)
- Snapshots (screenshots, bonus content)
- Alternate posters and artwork
- Box set packaging photos

### User Management
- `GET /api/users/me/submissions` - Get current user's submitted movies and physical copies (requires auth)

### Admin Endpoints (requires admin role)
- `GET /api/admin/pending` - Get all pending entries awaiting review
- `GET /api/admin/stats` - Get admin statistics and metrics
- `GET /api/admin/movies` - Get all movies (admin view)
- `POST /api/admin/movies/:id/verify` - Verify and approve a movie
- `POST /api/admin/movies/:id/reject` - Reject a movie submission
- `POST /api/admin/movies/:id/merge/:targetId` - Merge duplicate movies
- `POST /api/admin/physical-copies/:id/verify` - Verify and approve a physical copy
- `POST /api/admin/physical-copies/:id/reject` - Reject a physical copy submission
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/role` - Update user role (admin/user)
- `GET /api/admin/box-sets` - Get all box sets (admin view)
- `DELETE /api/admin/box-sets/:id` - Delete a box set (admin)
- `POST /api/admin/box-sets/:id/backfill` - Backfill box set data
- `POST /api/admin/box-sets/backfill-all` - Backfill all box sets
- `DELETE /api/admin/box-sets` - Delete all box sets (dangerous)
- `DELETE /api/admin/cineshelf-data` - Clear all CineShelf-imported data
- `DELETE /api/admin/all-data` - Nuclear reset - clear all data (dangerous)

### Public API (for external integrations)
- `GET /api/public/stats` - Get database statistics (total movies, copies, box sets)
- `GET /api/public/movies/search` - Search movies by title or UPC/barcode
- `GET /api/public/movies/:id` - Get public movie details
- `GET /api/public/movies/:id/physical-copies` - Get physical copies for a movie
- `GET /api/public/barcode/:code` - Lookup movie by UPC, EAN, or ASIN barcode
- `POST /api/public/physical-copies` - Submit a physical copy (requires API key header)

### CineShelf Integration API (v1)
All endpoints are under `/api/v1` prefix. Read operations (GET) are open; write operations (POST/PUT) require API key.

**Search:**
- `GET /api/v1/search/multi?query=...` - Multi-search (movies, TV, people)
- `GET /api/v1/search/releases?query=...` - Search physical releases

**Movies:**
- `GET /api/v1/movie/:id` - Get movie details (TMDB-compatible format)
- `GET /api/v1/movie/:id/images` - Get movie images
- `GET /api/v1/movie/:id/credits` - Get movie credits (cast/crew)
- `GET /api/v1/movie/:id/releases` - Get movie release information
- `POST /api/v1/movies` - Create or find movie (idempotent by tmdb_id/imdb_id)

**TV Shows:**
- `GET /api/v1/tv/:id` - Get TV show details

**External ID Lookup:**
- `GET /api/v1/find/:externalId?external_source=...` - Find by TMDB/IMDB ID

**Editions/Releases:**
- `GET /api/v1/movie/:id/editions` - Get all editions for a movie
- `GET /api/v1/editions/:id` - Get specific edition details
- `POST /api/v1/editions` - Create a new edition (requires API key)
- `PUT /api/v1/editions/:id` - Update an edition (requires API key)
- `GET /api/v1/releases/:releaseId` - Get release details (legacy path)
- `POST /api/v1/releases` - Create release (alias for editions, requires API key)
- `PUT /api/v1/releases/:id` - Update release (alias for editions, requires API key)

**Box Sets:**
- `GET /api/v1/box-sets` - List all box sets
- `GET /api/v1/box-sets/:boxsetId` - Get box set details
- `POST /api/v1/box-sets` - Create a box set (requires API key)
- `POST /api/v1/box-sets/:boxsetId/create-releases` - Auto-create releases for box set (requires API key)

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

### Health & Diagnostics
- `GET /api/health` - Health check with database status and migration info
- `GET /api/diagnostics/*` - Various diagnostic endpoints

### Icons
- `GET /api/icons/:name` - Get icon by name
- `POST /api/icons` - Create custom icon

### External Integration
For detailed API integration documentation (including CineShelf integration examples and response formats), see [CINESHELF_API_INTEGRATION.md](../CINESHELF_API_INTEGRATION.md).

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `TMDB_API_KEY` - TMDB API key (get from https://www.themoviedb.org/settings/api)
- `OMDB_API_KEY` - OMDB API key (get from http://www.omdbapi.com/apikey.aspx)

### Optional - Server Configuration
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins, comma-separated (default: http://localhost:5173)

### Optional - Authentication
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (for Google sign-in)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL (default: http://localhost:3001/api/auth/google/callback)
- `SESSION_SECRET` - Secret for session management (auto-generated if not set)
- `JWT_SECRET` - Secret for JWT token signing (auto-generated if not set)
- `FRONTEND_URL` - Frontend URL for OAuth redirects (default: http://localhost:5173)

### Optional - API Security
- `UMDB_API_KEY` - API key for external integrations (CineShelf, etc.)
  - If set: Write operations (POST/PUT) require this key via `X-API-Key` header or `?api_key=` query
  - If not set: Read operations are open, write operations require user authentication

### Optional - Features
- `ENABLE_PUBLIC_SUBMISSIONS` - Allow public submissions without authentication (default: false)
- `MAX_IMAGE_SIZE_MB` - Maximum image upload size in MB (default: 3)

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
