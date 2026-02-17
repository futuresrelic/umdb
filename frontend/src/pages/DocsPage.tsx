import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type DocTab = 'user' | 'admin' | 'dev' | 'changelog';

const USER_GUIDE = `
# User Guide

## Getting Started

UMDB (Universal Media Database) is a personal and community physical-media tracker. You can browse movies, track your physical collection, and contribute cover photos.

### Signing In

Click **Sign in with Google** in the top-right corner. Your account is created automatically on first sign-in.

---

## Browsing Movies

- Navigate to **Browse** to search and filter the movie catalogue.
- Click any movie card to view full details: cast, crew, genres, plot, and physical editions.

---

## My Collection

- **Collection** shows all physical copies you own.
- Each copy can have: format (Blu-ray, DVD, 4K…), barcode, condition, purchase price, edition name, package type, disc count, and country of release.

---

## Adding Movies

1. Click **Add Movie** to add a movie manually.
2. Alternatively, use **Search External** to pull data from TMDB or OMDb — the movie is imported with full metadata.
3. Manual submissions start in **Pending** status and require admin approval before becoming publicly visible.

---

## Cover Photos

On any movie detail page, click the **📷 Photos** button (visible when signed in) to:

- **Capture a photo** with your device camera (mobile-friendly).
- **Upload an image** from your device.
- **Edit** the image: crop, adjust brightness / contrast / saturation, and rotate.
- **Save** the processed image. The first image you upload is automatically set as primary (shows in movie card).
- **Set primary** (★ star button) on any of your images to make it the cover displayed across the app.
- **Delete** your own images at any time. Admins can delete any image.

Images are stored in the database and served from \`/api/images/:id\`. Edits are canvas-based; the final JPEG is saved (max 3 MB).

---

## CSV Import

Use **Import CSV** to bulk-import a list of movies. The expected columns are documented inside the importer page.

---

## My Submissions

**My Submissions** lists every movie and physical copy you have added, with their current verification status.

---

## Docs

This page! Available to all signed-in users. Admin and developer sections are restricted to admins.
`;

const ADMIN_GUIDE = `
# Admin Guide

## Accessing Admin Features

Your account must have the \`ADMIN\` role. If you believe you should be an admin, contact the system owner.

The **Admin** nav link (gold) appears once your role is set and you have signed out/in after the role change.

---

## Verifying Movies

New manually-submitted movies appear with a yellow **Pending Verification** banner on their detail page. As an admin:

- Click **Verify** to approve and make the movie publicly visible.
- Click **Reject** to dismiss (you can provide a rejection reason).

---

## Managing Users

In the **Admin** panel, the Users tab lists all registered accounts. You can:

- Promote a user to \`ADMIN\`.
- Demote an admin back to \`USER\`.

---

## Managing All Content

Admins can edit or delete **any** movie or physical copy, regardless of submitter.

Admins can also delete **any** user-uploaded cover photo.

---

## UMDB API Key

The CineShelf integration uses a shared API key set via the \`UMDB_API_KEY\` environment variable on Railway. To rotate the key:

1. Go to the Railway project → UMDB service → Variables.
2. Update \`UMDB_API_KEY\` to a new random string.
3. Set the matching key in the CineShelf service.

Without this variable, the \`/api/v1/\` write endpoints (\`POST /editions\`, \`POST /releases\`, etc.) are open (no key required). Always set the key in production.

---

## Database Access

The Postgres database is hosted on Railway. You can inspect data directly in the Railway "Data" tab under the Postgres service. Row-level edits (e.g., setting a user's role) can be done there if the admin UI isn't available yet.
`;

const DEV_GUIDE = `
# Developer Guide

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (Railway) |
| Auth | Google OAuth 2.0 (JWT stored in localStorage) |
| Hosting | Railway (monorepo — two services) |
| PWA | vite-plugin-pwa (Workbox) |

---

## Repository Layout

\`\`\`
umdb/
├── backend/
│   ├── prisma/schema.prisma     # Prisma schema (source of truth)
│   └── src/
│       ├── controllers/         # Route handlers
│       ├── middleware/          # auth, errorHandler
│       └── routes/              # Express routers
└── frontend/
    ├── public/icons/            # PWA icons
    ├── src/
    │   ├── components/          # Reusable UI
    │   ├── context/             # AuthContext
    │   ├── pages/               # Route-level pages
    │   ├── services/api.ts      # Axios client + typed helpers
    │   └── types/               # Shared TypeScript types
    └── vite.config.ts           # Vite + PWA config
\`\`\`

---

## Key Models (schema.prisma)

- **Movie** — core metadata (title, year, plot, TMDB/IMDb IDs…)
- **PhysicalCopy** — edition of a release (format, barcode, editionName, packageType, discCount, country, components Json)
- **MediaImage** — base64 image stored in Postgres (dataUrl Text), served via \`/api/images/:id\`
- **Person**, **MoviePerson** — cast & crew
- **Genre**, **MovieGenre** — genre linking
- **ExternalMatch** — TMDB / OMDb match stored per movie
- **User** — OAuth user with \`role: USER | ADMIN\`

---

## Image Storage

Images are stored as base64 \`dataUrl\` in a \`Text\` column (Postgres, via Railway — no persistent disk). Payload limit: 3 MB.

Endpoints:
\`\`\`
POST   /api/images          — upload (auth required)
GET    /api/images/:id      — serve binary (public, Cache-Control: immutable)
GET    /api/images/movie/:movieId
GET    /api/images/copy/:copyId
PUT    /api/images/:id      — update alt text / type / primary flag
DELETE /api/images/:id      — ownership check (uploader or admin)
\`\`\`

CineShelf can fetch cover images for any movie via \`GET /api/v1/movie/:id/images\` (returns metadata + \`src\` URL) or directly via \`GET /api/images/:id\`.

---

## CineShelf API (v1)

All endpoints are under \`/api/v1/\`. Optional API key via \`X-API-Key\` header (open if \`UMDB_API_KEY\` env var not set).

### Read endpoints (open)
| Method | Path | Description |
|--------|------|-------------|
| GET | /search/multi | Search movies |
| GET | /search/releases | Search physical editions |
| GET | /movie/:id | Movie detail (TMDB shape) |
| GET | /movie/:id/images | Images for a movie |
| GET | /movie/:id/credits | Cast & crew |
| GET | /movie/:id/releases | Physical editions |
| GET | /movie/:id/editions | Physical editions (canonical) |
| GET | /tv/:id | TV placeholder |
| GET | /find/:externalId | Lookup by IMDb / TMDB ID |
| GET | /releases/:id | Single edition |
| GET | /editions/:id | Single edition (canonical) |

### Write endpoints (API key required)
| Method | Path | Description |
|--------|------|-------------|
| POST | /movies | Create/find movie (idempotent) |
| POST | /editions | Create edition |
| PUT | /editions/:id | Update edition |
| POST | /releases | Alias for POST /editions |

UMDB IDs are prefixed with \`umdb-\` when sent to CineShelf (e.g. \`umdb-clxxx...\`).

---

## PWA

vite-plugin-pwa is configured in \`vite.config.ts\`. Service worker caches:
- All built JS/CSS/HTML
- TMDB images (\`CacheFirst\`, 30 days)
- UMDB images (\`CacheFirst\`, 90 days)

Icons are in \`frontend/public/icons/\`. Replace with high-quality artwork before production.

---

## Environment Variables

### Backend
\`\`\`
DATABASE_URL      Postgres connection string
JWT_SECRET        Secret for signing JWTs
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
TMDB_API_KEY
OMDB_API_KEY
UMDB_API_KEY      API key for CineShelf write endpoints
CORS_ORIGIN       Comma-separated allowed origins
PORT              Default 3001
\`\`\`

### Frontend
\`\`\`
VITE_API_URL      Backend URL (optional, defaults to /api)
VITE_GOOGLE_CLIENT_ID
\`\`\`

---

## Running Locally

\`\`\`bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
\`\`\`

---

## Deploying (Railway)

Each service (\`backend\`, \`frontend\`) is configured as a Railway service pointing to the respective directory. Railway auto-detects the build command from \`package.json\`. After schema changes:

1. Push to main / the active branch.
2. Railway runs \`npx prisma migrate deploy\` (or add it to the build command) automatically.
`;

const CHANGELOG = `
# Changelog

## 2026-02-17

### Added
- **PWA support** — UMDB is now installable as a Progressive Web App on Android, iOS, and desktop. Service worker caches assets and images for offline browsing.
- **Cover photos** — Users can capture or upload cover images for any movie directly from the movie detail page:
  - Camera capture (mobile: rear camera preferred)
  - File upload fallback
  - Canvas-based editor: crop (drag to select region), brightness / contrast / saturation sliders, 90° rotation
  - Gallery with set-primary (★) and delete actions
  - Ownership model: only the uploader (or an admin) can delete their images
- **Image API** (\`/api/images\`) — Images stored as base64 in Postgres; served as binary with \`Cache-Control: immutable\` for CDN/browser caching. CineShelf can fetch covers via \`GET /api/v1/movie/:id/images\`.
- **Docs page** (\`/docs\`) — Four guides accessible from the navigation: User Guide (all signed-in users), Admin Guide, Dev Guide, Changelog (admins only).

---

## 2026-02-16

### Added
- **PhysicalCopyManager** — new edition metadata fields: Edition Name, Package Type, Country of Release, Disc/Tape Count.
- **POST /api/v1/movies** — idempotent movie create/find for CineShelf integration.
- **CineShelf compatibility** — \`POST /api/v1/releases\` alias, component field normalisation (\`type\`/\`name\` → \`component_type\`/\`component_name\`), \`imdb_id\` lookup fallback.

---

## Earlier (2026-02)

### Added
- **CineShelf API v1** (\`/api/v1/\`) — TMDB-compatible endpoints for search, movie/TV detail, images, credits, releases. Optional \`X-API-Key\` authentication.
- **Edition endpoints** — \`POST /api/v1/editions\`, \`GET /api/v1/movie/:id/editions\`, \`GET /api/v1/editions/:id\`, \`PUT /api/v1/editions/:id\`.
- **Admin verification workflow** — admins can verify or reject submitted movies from the detail page.
- **CSV import** — bulk-import movies from CSV files.
- **Google OAuth** — sign in with Google; JWT stored in localStorage.
- **External source matching** — match movies to TMDB / OMDb records and pull metadata.
- **Physical copy tracking** — format, barcode, condition, price, notes, and more.
`;

const TABS: { id: DocTab; label: string; adminOnly: boolean }[] = [
  { id: 'user', label: 'User Guide', adminOnly: false },
  { id: 'admin', label: 'Admin Guide', adminOnly: true },
  { id: 'dev', label: 'Dev Guide', adminOnly: true },
  { id: 'changelog', label: 'Changelog', adminOnly: true },
];

const CONTENT: Record<DocTab, string> = {
  user: USER_GUIDE,
  admin: ADMIN_GUIDE,
  dev: DEV_GUIDE,
  changelog: CHANGELOG,
};

/** Very small Markdown renderer — only handles headings, code blocks, tables, bold, lists, hr */
function renderMarkdown(md: string): JSX.Element[] {
  const lines = md.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} className="bg-gray-900 text-green-300 rounded p-4 my-4 overflow-x-auto text-sm font-mono">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Table
    if (line.startsWith('|') && lines[i + 1]?.startsWith('|---')) {
      const headers = line.split('|').map(s => s.trim()).filter(Boolean);
      i += 2; // skip separator row
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i].split('|').map(s => s.trim()).filter(Boolean));
        i++;
      }
      elements.push(
        <div key={key++} className="my-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {headers.map((h, hi) => (
                  <th key={hi} className="border border-gray-300 px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-gray-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-gray-300 px-3 py-2">{inlineMd(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // HR
    if (/^-{3,}$/.test(line.trim())) {
      elements.push(<hr key={key++} className="my-6 border-gray-200" />);
      i++;
      continue;
    }

    // Headings
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h1) { elements.push(<h1 key={key++} className="text-3xl font-bold mt-8 mb-4 text-gray-900">{h1[1]}</h1>); i++; continue; }
    if (h2) { elements.push(<h2 key={key++} className="text-2xl font-bold mt-6 mb-3 text-gray-800">{h2[1]}</h2>); i++; continue; }
    if (h3) { elements.push(<h3 key={key++} className="text-lg font-semibold mt-4 mb-2 text-gray-700">{h3[1]}</h3>); i++; continue; }

    // Unordered list item
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ''));
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside my-2 space-y-1 text-gray-700">
          {items.map((it, idx) => <li key={idx}>{inlineMd(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal list-inside my-2 space-y-1 text-gray-700">
          {items.map((it, idx) => <li key={idx}>{inlineMd(it)}</li>)}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Regular paragraph
    elements.push(
      <p key={key++} className="my-2 text-gray-700 leading-relaxed">{inlineMd(line)}</p>
    );
    i++;
  }

  return elements;
}

/** Handle inline **bold** and `code` */
function inlineMd(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-gray-100 px-1 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function DocsPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<DocTab>('user');

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Please sign in to view the documentation.</p>
      </div>
    );
  }

  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Documentation</h1>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-8 gap-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 -mb-px text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-8">
        {renderMarkdown(CONTENT[activeTab])}
      </div>
    </div>
  );
}
