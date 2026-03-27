# 🎬 UMDB - Universal Media Database

A comprehensive universal media database system designed to catalog ANY media (movies, TV shows, music, physical media) that aren't found in mainstream databases, with special focus on rare releases, Quebec-origin content, and regional editions.

## 🎯 Purpose

UMDB solves a real problem: **What do you do when your DVD, vinyl, or rare media isn't in any database?**

- **Universal catch-all database** for media missing from major platforms (IMDB, TMDB, Amazon, etc.)
- **Manual entry** of data from physical media copies (format, distributor, UPC)
- **Multi-source matching** to TMDB, IMDB, Amazon, OMDB, and more
- **Central repository** that can be integrated with other systems (like CineShelf)
- **Special focus** on Quebec content and regional releases
- **Extensible architecture** for future media types (CDs, vinyls, books, games)

Perfect for collectors, archivists, and cinephiles with rare or regional content.

## ✨ Features

### Core Functionality
- ✍️ **Manual Movie Entry** - Comprehensive form for entering data from physical media
- 🔍 **External Search** - Search and import from TMDB and IMDB
- 📚 **Browse & Search** - View your entire collection with filters and pagination
- 🎯 **Title Matching** - Smart search to find existing movies
- 🔗 **External Linking** - Track TMDB and IMDB IDs for cross-referencing
- 📦 **Box Sets** - Manage multi-movie collections with special features
- 🖼️ **Image Management** - Upload and manage custom cover images, snapshots, and posters

### Authentication & User Management
- 🔐 **Google OAuth** - Secure authentication with Google sign-in
- 👥 **User Roles** - Admin and user role management
- 📝 **Submission Tracking** - Track user-submitted movies and physical copies
- ✅ **Content Moderation** - Admin review and verification of user submissions

### Physical Media Management
- Track physical format (DVD, Blu-ray, 4K UHD, VHS, LaserDisc, etc.)
- Record distributor, UPC, EAN, ASIN barcodes
- Edition details (Collector's Edition, Director's Cut, region, package type)
- Audio/video specifications (audio formats, subtitles, video standard)
- Box set features (slipcover, booklet, bonus discs, 3D, digital copy)
- Condition and ownership tracking
- Component system for releases

### Data Management
- Add personal notes and ratings
- Manage cast and crew information
- Organize by genres
- Support for multiple languages and countries
- Import/export capabilities (CSV)

### External Integration
- 🔌 **Public API** - RESTful API for external applications
- 🎬 **CineShelf Integration** - Full API v1 compatibility with movie database sync
- 🔎 **Barcode Lookup** - Search by UPC, EAN, or ASIN codes
- 📊 **Statistics** - Public stats endpoint for collection metrics

## 🏗️ Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL with Prisma ORM
- TMDB & OMDB API integration
- RESTful API design

**Frontend:**
- React 18 + TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Vite for fast development

**Deployment:**
- Docker & Docker Compose
- Nginx reverse proxy
- Production-ready configuration

## 🚀 Quick Start

### Production (Docker)

```bash
# 1. Clone repository
git clone <repo-url> umdb
cd umdb

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Run setup script
./scripts/setup.sh
```

Access at http://localhost

### Development

```bash
# 1. Run dev setup
./scripts/dev-setup.sh

# 2. Set up database
createdb umdb
cd backend && npm run prisma:migrate

# 3. Start backend (terminal 1)
cd backend && npm run dev

# 4. Start frontend (terminal 2)
cd frontend && npm run dev
```

Access at http://localhost:5173

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup.

## 📖 Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Local development setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[frontend/README.md](frontend/README.md)** - Frontend documentation

## 🔑 API Keys & Configuration

### Required API Keys

**TMDB API** (free):
- Sign up at https://www.themoviedb.org/
- Go to Settings > API
- Request API key

**OMDB API** (free tier):
- Go to http://www.omdbapi.com/apikey.aspx
- Select free tier (1,000 requests/day)
- Verify email and copy key

### Optional Configuration

**Google OAuth** (for authentication):
- Create project at https://console.cloud.google.com/
- Enable Google+ API
- Create OAuth 2.0 credentials
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

**UMDB API Key** (for external integrations):
- Set `UMDB_API_KEY` in `.env` to require API keys for write operations
- If not set, read operations are open, write operations require authentication

**CORS Origins**:
- Set `CORS_ORIGIN` for allowed frontend origins (comma-separated)
- Default: `http://localhost:5173`

## 📦 Project Structure

```
umdb/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic & external APIs
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Utilities
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── Dockerfile
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   ├── Dockerfile
│   └── nginx.conf
├── scripts/              # Setup scripts
├── docker-compose.yml    # Docker configuration
├── DEVELOPMENT.md        # Development guide
└── DEPLOYMENT.md         # Deployment guide
```

## 🌐 Deployment

**Live Site:** https://umdb.ca

Deploy to your own server:
```bash
# On server
git clone <repo-url> umdb
cd umdb
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for SSL setup, reverse proxy, and production configuration.

## 🎨 Screenshots

- **Home Page** - Welcome with quick access to all features
- **Browse Movies** - Grid view with search and filters
- **Movie Details** - Comprehensive information display
- **Manual Entry** - Full form for physical media data
- **External Search** - Side-by-side TMDB and IMDB results

## 🗄️ Database Schema

### Core Models
- **Movie** - Core movie data with all metadata and verification status
- **PhysicalCopy** - Physical media releases (DVDs, Blu-rays, VHS, etc.) with format, region, distributor, condition tracking, and box set support
- **BoxSet** - Multi-movie collections (e.g., "The Matrix Trilogy") with special features, components, and metadata
- **BoxSetItem** - Junction linking box sets to movies/releases with disc tracking

### Media & Metadata
- **MediaImage** - User-uploaded images (covers, snapshots, alternate posters) with dimensions and size tracking
- **ExternalMatch** - Links to TMDB/IMDB for cross-referencing
- **Person** - Actors, directors, crew with profiles
- **Genre** - Movie genres and categories
- **MoviePerson** - Junction with roles (actor, director, writer, producer, etc.)
- **MovieGenre** - Junction for movie-genre relationships

### User Management
- **User** - User accounts with Google OAuth support, roles (admin/user), and profile information
- **Session** - User sessions for authentication tracking

### Components & Features
- **Component** - Reusable components for box sets and releases (e.g., "4K UHD Disc", "Blu-ray Disc", "Digital Copy Code")
- **PhysicalCopyComponent** - Links physical copies to their components
- **ReleaseComponent** - Component templates for releases

### Settings
- **SiteSetting** - Configurable site-wide settings (key-value pairs)

See `backend/prisma/schema.prisma` for the full schema with relationships and constraints.

## 🔧 API Endpoints

### Authentication
```
GET    /api/auth/google              # Get Google OAuth URL
GET    /api/auth/google/callback     # Google OAuth callback
GET    /api/auth/me                  # Get current user (requires auth)
```

### Movies
```
GET    /api/movies              # List movies (with search, filter, pagination)
GET    /api/movies/:id          # Get movie details
POST   /api/movies              # Create movie (requires auth)
PUT    /api/movies/:id          # Update movie (requires auth)
DELETE /api/movies/:id          # Delete movie (requires auth)
POST   /api/movies/:id/external-matches  # Add external match
GET    /api/movies/:id/physical-copies   # Get all copies for a movie
```

### Physical Copies & Editions
```
GET    /api/physical-copies              # List all physical copies
GET    /api/physical-copies/:id          # Get physical copy details
POST   /api/physical-copies              # Create physical copy (requires auth)
PUT    /api/physical-copies/:id          # Update physical copy (requires auth)
DELETE /api/physical-copies/:id          # Delete physical copy (requires auth)
GET    /api/movies/:id/physical-copies   # Get all copies for a movie
```

### Box Sets
```
GET    /api/box-sets            # List all box sets (with search, filter, pagination)
GET    /api/box-sets/:id        # Get box set details (includes all movies)
POST   /api/box-sets            # Create box set with movies (requires auth)
PUT    /api/box-sets/:id        # Update box set (requires auth)
DELETE /api/box-sets/:id        # Delete box set (requires auth)
```

### Image Management
```
GET    /api/images/:id                # Serve image (public)
GET    /api/images/movie/:movieId     # List movie images
GET    /api/images/copy/:copyId       # List physical copy images
POST   /api/images                    # Upload image (requires auth)
PUT    /api/images/:id                # Update image metadata (requires auth)
DELETE /api/images/:id                # Delete image (requires auth)
```

### User Management
```
GET    /api/users/me/submissions      # Get user's submissions (requires auth)
```

### Admin (requires admin role)
```
GET    /api/admin/pending             # Get pending entries for review
GET    /api/admin/stats               # Get admin statistics
GET    /api/admin/movies              # Get all movies (admin view)
POST   /api/admin/movies/:id/verify   # Verify movie
POST   /api/admin/movies/:id/reject   # Reject movie
POST   /api/admin/movies/:id/merge/:targetId  # Merge movies
POST   /api/admin/physical-copies/:id/verify  # Verify physical copy
POST   /api/admin/physical-copies/:id/reject  # Reject physical copy
GET    /api/admin/users               # List all users
PUT    /api/admin/users/:id/role      # Update user role
DELETE /api/admin/cineshelf-data      # Clear CineShelf data
DELETE /api/admin/all-data            # Nuclear reset (clear all data)
```

### Public API (for external integrations)
```
GET    /api/public/stats              # Get database statistics
GET    /api/public/movies/search      # Search movies by title or UPC
GET    /api/public/movies/:id         # Get movie details
GET    /api/public/movies/:id/physical-copies  # Get movie physical copies
GET    /api/public/barcode/:code      # Lookup by UPC, EAN, or ASIN
POST   /api/public/physical-copies    # Submit physical copy (requires API key)
```

### CineShelf Integration (API v1)
```
GET    /api/v1/search/multi           # Multi-search (movies, TV, people)
GET    /api/v1/search/releases        # Search physical releases
GET    /api/v1/movie/:id              # Get movie details
GET    /api/v1/movie/:id/images       # Get movie images
GET    /api/v1/movie/:id/credits      # Get movie credits
GET    /api/v1/movie/:id/releases     # Get movie releases
GET    /api/v1/find/:externalId       # Find by external ID (TMDB, IMDB)
POST   /api/v1/movies                 # Create/find movie (requires API key)
GET    /api/v1/movie/:id/editions     # Get movie editions
POST   /api/v1/editions               # Create edition (requires API key)
PUT    /api/v1/editions/:id           # Update edition (requires API key)
POST   /api/v1/releases               # Create release (alias, requires API key)
PUT    /api/v1/releases/:id           # Update release (alias, requires API key)
GET    /api/v1/box-sets               # List box sets
GET    /api/v1/box-sets/:id           # Get box set
POST   /api/v1/box-sets               # Create box set (requires API key)
```

### External APIs
```
GET    /api/external/search           # Search TMDB & IMDB
POST   /api/external/import/tmdb      # Import from TMDB
POST   /api/external/import/imdb      # Import from IMDB
```

### People & Genres
```
GET    /api/people              # List people
GET    /api/people/:id          # Get person details
GET    /api/genres              # List genres
GET    /api/genres/:id          # Get genre details
```

### Health & Diagnostics
```
GET    /api/health              # Health check with database status
GET    /api/diagnostics/*       # Diagnostic endpoints
```

See [backend/README.md](backend/README.md) for detailed API documentation and [CINESHELF_API_INTEGRATION.md](CINESHELF_API_INTEGRATION.md) for external integration guide.

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📝 Future Enhancements

### Completed ✅
- [x] Image upload for custom posters
- [x] User authentication & multi-user support
- [x] Advanced search with filters
- [x] Statistics dashboard
- [x] Integration with CineShelf
- [x] Box sets and multi-movie collections
- [x] Export to CSV
- [x] Admin panel with content moderation
- [x] Public API for external integrations
- [x] Barcode lookup (UPC, EAN, ASIN)

### Planned
- [ ] Import from CSV/JSON
- [ ] Mobile app (PWA or native)
- [ ] Support for CDs and vinyl records
- [ ] Support for books and games
- [ ] Amazon product data integration
- [ ] Extensible source system for future platforms
- [ ] Advanced filtering (by distributor, region, format, etc.)
- [ ] Wishlist and want-to-buy tracking
- [ ] Price tracking and value estimation
- [ ] Collection sharing and public profiles
- [ ] API rate limiting and usage tracking
- [ ] Bulk operations (batch edit, batch import)
- [ ] Automated duplicate detection
- [ ] Release notifications for new editions

## 📄 License

Private project

## 👤 Author

Built for managing rare Quebec DVDs and regional content not found in mainstream databases.

---

**Made with ❤️ for movie collectors and archivists**
