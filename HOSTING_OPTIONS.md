# UMDB Hosting Options

This guide compares different hosting options for deploying UMDB, from free services to your Dreamhost shared hosting.

## Overview

UMDB requires:
- **Backend**: Node.js API server (Express)
- **Frontend**: Static React site (can be served from CDN)
- **Database**: PostgreSQL

## Recommended Option: Free Tier Hosting

### ✅ Railway.app (Recommended - Best Free Option)

**Pros:**
- $5/month free credit (enough for small usage)
- Supports Node.js, PostgreSQL out of the box
- Automatic deployments from GitHub
- Built-in SSL/HTTPS
- Custom domain support (umdb.ca)
- Simple PostgreSQL setup

**Setup:**
1. Sign up at https://railway.app
2. Connect your GitHub repository
3. Create new project from GitHub repo
4. Add PostgreSQL service
5. Configure environment variables (TMDB_API_KEY, OMDB_API_KEY, DATABASE_URL)
6. Deploy!
7. Add custom domain umdb.ca

**Estimated Monthly Cost:** FREE (within $5 credit limit)

**Deployment Guide:**
```bash
# 1. Push your code to GitHub
# 2. Go to Railway.app
# 3. New Project → Deploy from GitHub
# 4. Select your umdb repository
# 5. Add PostgreSQL database
# 6. Set environment variables:
#    - DATABASE_URL (auto-set by Railway)
#    - TMDB_API_KEY
#    - OMDB_API_KEY
#    - CORS_ORIGIN=https://umdb.ca
# 7. Deploy!
```

---

### ✅ Render.com (Great Alternative)

**Pros:**
- Free tier for web services
- Free PostgreSQL (90 days, then $7/month)
- GitHub auto-deploy
- Custom domain support
- SSL included

**Cons:**
- Free tier sleeps after 15 min inactivity (wakes in ~1 minute)
- PostgreSQL not free after 90 days

**Setup:**
1. Create account at https://render.com
2. New Web Service from GitHub repo
3. Create PostgreSQL database
4. Set environment variables
5. Deploy

**Estimated Monthly Cost:**
- First 90 days: FREE
- After: $7/month (PostgreSQL only)

---

### ⚠️ Vercel + PlanetScale (Frontend Only Free)

**Pros:**
- Excellent for frontend (React)
- Vercel is very fast
- PlanetScale has free PostgreSQL tier

**Cons:**
- Backend serverless functions have limitations
- More complex setup
- Need to adapt backend for serverless

**Not Recommended** for UMDB (requires backend restructuring)

---

## Dreamhost Shared Hosting

**Current Challenge:**
Your Dreamhost shared hosting likely doesn't support Node.js or PostgreSQL natively.

### Option 1: Host Frontend Only on Dreamhost

**Setup:**
1. Build frontend: `cd frontend && npm run build`
2. Upload `dist/` folder to Dreamhost
3. Host backend on Railway/Render
4. Point frontend to backend API

**Pros:**
- Use existing hosting
- Fast static site

**Cons:**
- Still need backend hosting elsewhere
- More complex setup

### Option 2: Check if Dreamhost VPS Available

If you have DreamHost VPS (not shared hosting):
- Install Node.js
- Install PostgreSQL
- Deploy using Docker

**Dreamhost Shared Hosting Limitations:**
- ❌ No Node.js support
- ❌ No PostgreSQL (only MySQL)
- ❌ No Docker
- ❌ No long-running processes

**Verdict:** Dreamhost shared hosting is **NOT suitable** for UMDB backend. Use for frontend static files only.

---

## Comparison Table

| Option | Backend | Database | Cost | Ease | Sleep/Downtime | Recommendation |
|--------|---------|----------|------|------|----------------|----------------|
| **Railway** | ✅ Node.js | ✅ PostgreSQL | FREE-$5 | ⭐⭐⭐⭐⭐ | No sleep | **Best Choice** |
| **Render** | ✅ Node.js | ✅ PostgreSQL | FREE-$7 | ⭐⭐⭐⭐ | Sleeps on free | Good Alternative |
| **Vercel+PlanetScale** | ⚠️ Serverless | ✅ PostgreSQL | FREE | ⭐⭐⭐ | No sleep | Complex Setup |
| **Dreamhost Shared** | ❌ Not supported | ❌ MySQL only | Paid | ⭐ | N/A | Frontend Only |
| **Dreamhost VPS** | ✅ Node.js | ✅ Can install | $15+/month | ⭐⭐ | No sleep | Expensive |

---

## Final Recommendation

### For UMDB with Gmail Login & Public Access:

**Best Setup: Railway.app**

1. **Deploy to Railway.app** (free $5/month credit)
   - Host both backend + PostgreSQL
   - Auto-deploys from GitHub
   - Built-in SSL for umdb.ca

2. **Optional: Use Dreamhost for Static Assets**
   - Host movie poster images
   - Reduce Railway bandwidth usage

3. **Domain Setup**
   - Point umdb.ca to Railway
   - Railway provides SSL certificate automatically

### Migration Steps:

1. Create Railway account
2. Push code to new GitHub repo (`/umdb`)
3. Deploy to Railway from GitHub
4. Add PostgreSQL database
5. Configure environment variables
6. Add custom domain umdb.ca
7. Test everything works

**Total Cost:** $0/month (within free credits)

---

## Environment Variables Needed

For Railway/Render deployment:

```env
DATABASE_URL=<automatically_set_by_hosting>
TMDB_API_KEY=your_tmdb_key
OMDB_API_KEY=your_omdb_key
CORS_ORIGIN=https://umdb.ca
PORT=3001
NODE_ENV=production
```

---

## CineShelf Integration

Once UMDB is deployed:
- UMDB API will be at `https://umdb.ca/api`
- CineShelf can query: `GET https://umdb.ca/api/movies?title=...`
- Match CineShelf entries with IMDB, TMDB, or UMDB data
- Public API access (add authentication later if needed)

---

## Next Steps

1. Push code to new GitHub repository `/umdb`
2. Set up Railway.app account
3. Deploy UMDB to Railway
4. Point umdb.ca domain to Railway
5. Test with CineShelf integration
6. Add Gmail authentication (future enhancement)

**Questions? Check Railway.app documentation: https://docs.railway.app/**
