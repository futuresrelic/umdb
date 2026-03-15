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
- 📚 **Browse & Search** - View your entire collection with filters
- 🎯 **Title Matching** - Smart search to find existing movies
- 🔗 **External Linking** - Track TMDB and IMDB IDs for cross-referencing

### Data Management
- Track physical format (DVD, Blu-ray, VHS, etc.)
- Record distributor and UPC codes
- Add personal notes and ratings
- Manage cast and crew information
- Organize by genres
- Support for multiple languages and countries

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

## 🔑 API Keys Required

**TMDB API** (free):
- Sign up at https://www.themoviedb.org/
- Go to Settings > API
- Request API key

**OMDB API** (free tier):
- Go to http://www.omdbapi.com/apikey.aspx
- Select free tier (1,000 requests/day)
- Verify email and copy key

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

Key models:
- **Movie** - Core movie data with all metadata
- **PhysicalCopy** - Physical media releases (DVDs, Blu-rays, VHS, etc.) with format, region, distributor, and condition tracking
- **BoxSet** - Multi-movie collections (e.g., "The Matrix Trilogy") with special features
- **BoxSetItem** - Junction linking box sets to movies/releases
- **ExternalMatch** - Links to TMDB/IMDB
- **Person** - Actors, directors, crew
- **Genre** - Movie genres
- **MoviePerson** - Junction with roles (actor, director, etc.)
- **MovieGenre** - Junction for genres
- **MediaImage** - User-uploaded images (covers, snapshots, alternate posters)

See `backend/prisma/schema.prisma` for full schema.

## 🔧 API Endpoints

### Movies
```
GET    /api/movies              # List movies
GET    /api/movies/:id          # Get movie details
POST   /api/movies              # Create movie
PUT    /api/movies/:id          # Update movie
DELETE /api/movies/:id          # Delete movie
```

### Physical Copies & Editions
```
GET    /api/physical-copies              # List all physical copies
GET    /api/physical-copies/:id          # Get physical copy details
POST   /api/physical-copies              # Create physical copy
PUT    /api/physical-copies/:id          # Update physical copy
DELETE /api/physical-copies/:id          # Delete physical copy
GET    /api/movies/:id/physical-copies   # Get all copies for a movie
```

### Box Sets
```
GET    /api/box-sets            # List all box sets
GET    /api/box-sets/:id        # Get box set details
POST   /api/box-sets            # Create box set
PUT    /api/box-sets/:id        # Update box set
DELETE /api/box-sets/:id        # Delete box set
```

### External APIs
```
GET    /api/external/search     # Search TMDB & IMDB
POST   /api/external/import/tmdb  # Import from TMDB
POST   /api/external/import/imdb  # Import from IMDB
```

### People & Genres
```
GET    /api/people              # List people
GET    /api/genres              # List genres
```

See [backend/README.md](backend/README.md) for full API documentation and [CINESHELF_API_INTEGRATION.md](CINESHELF_API_INTEGRATION.md) for external integration guide.

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📝 Future Enhancements

- [ ] Image upload for custom posters
- [ ] User authentication & multi-user support
- [ ] Collections and lists
- [ ] Export to CSV/JSON
- [ ] Advanced search with filters
- [ ] Statistics dashboard
- [ ] Mobile app
- [ ] Integration with CineShelf
- [ ] Support for CDs and vinyl records
- [ ] Amazon product data integration
- [ ] Extensible source system for future platforms

## 📄 License

Private project

## 👤 Author

Built for managing rare Quebec DVDs and regional content not found in mainstream databases.

---

**Made with ❤️ for movie collectors and archivists**
