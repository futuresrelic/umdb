# UMDB Development Guide

Guide for local development setup.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Database Setup

Create PostgreSQL database:
```bash
createdb umdb
```

Or using psql:
```sql
CREATE DATABASE umdb;
```

### 3. Configure Environment

Backend `.env`:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/umdb?schema=public"
PORT=3001
NODE_ENV=development
TMDB_API_KEY=your_tmdb_key
OMDB_API_KEY=your_omdb_key
CORS_ORIGIN=http://localhost:5173
```

### 4. Run Database Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Servers

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Development Workflow

### Database Changes

1. Modify `backend/prisma/schema.prisma`
2. Create migration:
```bash
npx prisma migrate dev --name description_of_change
```
3. Prisma Client is auto-generated

### API Development

- Controllers in `backend/src/controllers/`
- Routes in `backend/src/routes/`
- Services in `backend/src/services/`
- Add new routes to `backend/src/index.ts`

### Frontend Development

- Pages in `frontend/src/pages/`
- Components in `frontend/src/components/`
- API calls in `frontend/src/services/api.ts`
- Types in `frontend/src/types/`

### Code Style

Backend uses TypeScript strict mode. Frontend uses TypeScript with React.

## Useful Commands

### Backend

```bash
# Development server with watch
npm run dev

# Build
npm run build

# Run production build
npm start

# Prisma Studio (DB GUI)
npm run prisma:studio

# Generate Prisma Client
npm run prisma:generate

# Create migration
npx prisma migrate dev
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Database Tools

### Prisma Studio

Visual database editor:
```bash
cd backend
npm run prisma:studio
```

Opens at http://localhost:5555

### Reset Database

**WARNING: This deletes all data!**
```bash
cd backend
npx prisma migrate reset
```

## Testing

### Manual Testing

1. Start both servers
2. Open http://localhost:5173
3. Test workflows:
   - Add manual movie
   - Search external sources
   - Import from TMDB
   - Import from IMDB
   - Browse movies
   - View movie details

### API Testing

Use curl or Postman:

```bash
# Health check
curl http://localhost:3001/api/health

# Get all movies
curl http://localhost:3001/api/movies

# Search TMDB
curl "http://localhost:3001/api/external/search?query=inception&year=2010"
```

## Common Issues

### Port already in use

Backend (3001) or Frontend (5173) port in use:
```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Database connection error

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

### Prisma Client not found

Regenerate:
```bash
cd backend
npm run prisma:generate
```

### CORS errors

- Check CORS_ORIGIN in backend .env
- Should be http://localhost:5173 for dev

## Project Structure

```
umdb/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic & external APIs
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utilities
│   │   └── index.ts       # Server entry
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── package.json
└── docker-compose.yml     # Docker configuration
```

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Commit with clear message
5. Push and create PR

## Next Steps

- [ ] Add image upload for posters
- [ ] Add user authentication
- [ ] Add collections/lists
- [ ] Add export functionality
- [ ] Add advanced search
- [ ] Add statistics dashboard
