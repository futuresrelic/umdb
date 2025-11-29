#!/bin/bash
set -e

echo "🎬 UMDB Setup Script"
echo "==================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env with your actual values before continuing"
    echo ""
    read -p "Press enter when you've updated .env file..."
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required API keys
if [ -z "$TMDB_API_KEY" ] || [ "$TMDB_API_KEY" = "your_tmdb_api_key_here" ]; then
    echo "❌ TMDB_API_KEY not set in .env"
    echo "Get one at: https://www.themoviedb.org/settings/api"
    exit 1
fi

if [ -z "$OMDB_API_KEY" ] || [ "$OMDB_API_KEY" = "your_omdb_api_key_here" ]; then
    echo "❌ OMDB_API_KEY not set in .env"
    echo "Get one at: http://www.omdbapi.com/apikey.aspx"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

echo "Starting UMDB with Docker Compose..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

echo ""
echo "✅ UMDB is now running!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:3001"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop: docker-compose down"
echo "  Restart: docker-compose restart"
echo ""
echo "For production deployment, see DEPLOYMENT.md"
