# UMDB Deployment Guide

This guide covers deploying UMDB to your server or hosting platform.

## Prerequisites

- Server with Docker and Docker Compose installed OR free hosting platform (see deployment options below)
- Domain pointing to your server (e.g., umdb.ca)
- TMDB API key (https://www.themoviedb.org/settings/api)
- OMDB API key (http://www.omdbapi.com/apikey.aspx)

## Quick Start

### 1. Get API Keys

**TMDB API Key:**
1. Create account at https://www.themoviedb.org/
2. Go to Settings > API
3. Request an API key (free)
4. Copy your API key

**OMDB API Key:**
1. Go to http://www.omdbapi.com/apikey.aspx
2. Select free tier (1,000 requests/day)
3. Enter your email
4. Verify email and copy API key

### 2. Clone Repository on Server

```bash
git clone <repository-url> umdb
cd umdb
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Edit the `.env` file with your values:
```
DB_PASSWORD=your_secure_password_here
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key
CORS_ORIGIN=https://umdb.ca
```

### 4. Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

The application will be available at:
- Frontend: http://your-server-ip
- Backend API: http://your-server-ip:3001

## Production Deployment with HTTPS

For production with SSL/HTTPS, you'll want to use a reverse proxy like Nginx or Caddy.

### Option 1: Using Caddy (Easiest)

Create `Caddyfile`:
```
umdb.ca {
    reverse_proxy frontend:80
}
```

Add to `docker-compose.yml`:
```yaml
caddy:
  image: caddy:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy-data:/data
    - caddy-config:/config
  networks:
    - umdb-network
```

### Option 2: Using Nginx with Let's Encrypt

Install certbot on host and get SSL certificate:
```bash
sudo certbot certonly --standalone -d umdb.ca
```

Create nginx config with SSL and proxy to the Docker containers.

## Server Requirements

- **CPU**: 1 core minimum, 2+ recommended
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 10GB minimum (more depending on poster images)
- **OS**: Ubuntu 22.04 LTS or similar

## Maintenance

### Backup Database

```bash
# Backup
docker-compose exec postgres pg_dump -U umdb umdb > backup.sql

# Restore
docker-compose exec -T postgres psql -U umdb umdb < backup.sql
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Update Application

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Database Migrations

Migrations run automatically when backend starts. To run manually:

```bash
docker-compose exec backend npx prisma migrate deploy
```

## Troubleshooting

### Backend won't start
- Check DATABASE_URL in environment
- Check database is healthy: `docker-compose ps`
- Check logs: `docker-compose logs backend`

### Frontend shows 404 for API calls
- Verify backend is running: `docker-compose ps`
- Check nginx.conf has correct proxy settings
- Check CORS_ORIGIN in backend environment

### Database connection errors
- Verify postgres container is running
- Check DATABASE_URL format
- Ensure postgres is healthy before backend starts

### External API errors
- Verify TMDB_API_KEY is valid
- Verify OMDB_API_KEY is valid
- Check API rate limits

## Security Checklist

- [ ] Change default database password
- [ ] Set up SSL/HTTPS
- [ ] Configure firewall (only open 80, 443)
- [ ] Regular backups configured
- [ ] Keep Docker images updated
- [ ] Monitor logs for errors

## Performance Tips

1. **Database**: Consider increasing Postgres memory for larger collections
2. **Images**: Consider using a CDN for movie posters
3. **Caching**: Add Redis for API response caching
4. **Monitoring**: Set up monitoring (Prometheus/Grafana)

## Support

For issues, check:
1. Application logs: `docker-compose logs`
2. Database logs: `docker-compose logs postgres`
3. Container status: `docker-compose ps`
