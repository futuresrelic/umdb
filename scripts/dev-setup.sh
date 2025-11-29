#!/bin/bash
set -e

echo "🎬 UMDB Development Setup"
echo "========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Install Node.js 20+: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher (current: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Install PostgreSQL 16+: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL installed"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created backend/.env - please update with your values"
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma Client..."
npm run prisma:generate

echo ""
echo "⚠️  Database setup required:"
echo "1. Create PostgreSQL database: createdb umdb"
echo "2. Update DATABASE_URL in backend/.env"
echo "3. Run migrations: cd backend && npm run prisma:migrate"
echo ""

cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend

echo "Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "✅ Development setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up database (see instructions above)"
echo "2. Get API keys:"
echo "   - TMDB: https://www.themoviedb.org/settings/api"
echo "   - OMDB: http://www.omdbapi.com/apikey.aspx"
echo "3. Update backend/.env with your values"
echo "4. Run backend: cd backend && npm run dev"
echo "5. Run frontend: cd frontend && npm run dev"
echo ""
echo "See DEVELOPMENT.md for detailed instructions"
