# CineShelf ↔ UMDB Integration Guide

## Base URL
```
https://umdb-production.up.railway.app/api/v1
```

## Authentication
- Optional API key via `X-API-Key` header or `?api_key=` query parameter
- Read endpoints (GET) are open if `UMDB_API_KEY` is not configured
- Write endpoints (POST/PUT) require a valid API key

---

## Quick Answers to Your Questions

### 1. What does `GET /api/v1/releases/{releaseId}` return?

**Cover image field name:** `cover_image` (full URL, not relative path)

**Release ID format:** `rel-{uuid}` ✅ Your code is correct!

**Cover image format:** Full URL (e.g., `https://example.com/cover.jpg`) OR base64 data URL (e.g., `data:image/jpeg;base64,...`)

**Example response:**
```json
{
  "id": "rel-cm5abc123xyz",
  "movie_id": "umdb-cm5def456",
  "name": "Fight Club (1999) Blu-ray - 20th Century Fox",
  "format": "Blu-ray",
  "edition": "Collector's Edition",
  "package_type": "Steelbook",
  "region": "Region A",
  "video_standard": "NTSC",
  "country": "US",
  "language": "English",
  "upc": "024543555551",
  "ean": null,
  "asin": "B0028O9W50",
  "barcode": "024543555551",
  "release_date": "2009-11-17",
  "distributor": "20th Century Fox",
  "studio": "Fox 2000 Pictures",
  "edition_publisher": "Criterion Collection",
  "disc_count": 2,
  "audio_formats": ["DTS-HD Master Audio", "Dolby TrueHD", "Dolby Atmos"],
  "subtitles": ["English", "Spanish", "French"],
  "copy_protected": true,
  "bonus_content": "Behind the scenes documentary, deleted scenes, commentary tracks",
  "notes": "Limited edition steelbook with embossed artwork",
  "cover_image": "https://example.com/fight-club-steelbook.jpg",
  "components": [
    {
      "id": "comp-cm5abc123xyz-1",
      "component_type": "disc",
      "component_name": "Blu-ray Disc"
    }
  ],
  "images": [
    {
      "id": "img-cm5ghi789",
      "type": "cover",
      "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "alt_text": "Fight Club Steelbook Front Cover",
      "is_primary": true,
      "width": 1600,
      "height": 2400,
      "mime_type": "image/jpeg"
    },
    {
      "id": "img-cm5jkl012",
      "type": "back",
      "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "alt_text": "Fight Club Steelbook Back Cover",
      "is_primary": false,
      "width": 1600,
      "height": 2400,
      "mime_type": "image/jpeg"
    }
  ],
  "movie": {
    "id": "umdb-cm5def456",
    "title": "Fight Club",
    "year": 1999,
    "poster_path": "https://image.tmdb.org/t/p/original/poster.jpg"
  }
}
```

### 2. How to find the releaseId for a specific physical release?

**Option A: List all editions for a movie**
```php
GET /api/v1/movie/{umdb_movie_id}/editions
```

Example:
```bash
curl "https://umdb-production.up.railway.app/api/v1/movie/umdb-cm5def456/editions"
```

Response:
```json
{
  "movie_id": "umdb-cm5def456",
  "results": [
    {
      "id": "rel-cm5abc123xyz",
      "name": "Fight Club (1999) DVD - 20th Century Fox",
      "format": "DVD",
      "cover_image": "https://...",
      ...
    },
    {
      "id": "rel-cm5xyz789abc",
      "name": "Fight Club (1999) Blu-ray - Criterion",
      "format": "Blu-ray",
      "cover_image": "https://...",
      ...
    }
  ]
}
```

**Option B: Search by movie title + format**
```php
GET /api/v1/search/releases?query=Fight+Club&format=dvd
```

**Option C: Search by barcode (if you have UPC/EAN)**
```php
GET /api/v1/search/releases?query={barcode}
```

---

## Complete API Reference

### Movies

#### Get Movie Details
```
GET /api/v1/movie/{movieId}
```

Movie IDs use `umdb-` prefix (e.g., `umdb-cm5def456`)

**Optional query params:**
- `?append_to_response=credits,release_dates` - Include additional data

**Response:**
```json
{
  "id": "umdb-cm5def456",
  "title": "Fight Club",
  "original_title": "Fight Club",
  "year": 1999,
  "release_date": "1999-01-01",
  "runtime": 139,
  "overview": "An insomniac office worker...",
  "poster_path": "https://image.tmdb.org/t/p/original/poster.jpg",
  "backdrop_path": "https://image.tmdb.org/t/p/original/backdrop.jpg",
  "vote_average": 8.4,
  "genres": [
    { "id": 18, "name": "Drama" }
  ],
  "imdb_id": "tt0137523",
  "tagline": "Mischief. Mayhem. Soap.",
  "credits": {
    "cast": [...],
    "crew": [...]
  }
}
```

#### Search Movies
```
GET /api/v1/search/multi?query={title}&page=1
```

**Response:**
```json
{
  "results": [
    {
      "id": "umdb-cm5def456",
      "media_type": "movie",
      "title": "Fight Club",
      "release_date": "1999-01-01",
      "poster_path": "https://...",
      ...
    }
  ],
  "total_results": 42,
  "total_pages": 3,
  "page": 1
}
```

#### Find by External ID
```
GET /api/v1/find/{externalId}?external_source=imdb_id
```

Supported sources: `imdb_id`, `tmdb_id`

**Example:**
```bash
curl "https://umdb-production.up.railway.app/api/v1/find/tt0137523?external_source=imdb_id"
```

**Response:**
```json
{
  "movie_results": [
    {
      "id": "umdb-cm5def456",
      "title": "Fight Club",
      ...
    }
  ],
  "tv_results": []
}
```

#### Create Movie (Auto-create from CineShelf)
```
POST /api/v1/movies
X-API-Key: your_api_key
```

**Request body:**
```json
{
  "title": "Fight Club",
  "year": 1999,
  "tmdb_id": "550",
  "imdb_id": "tt0137523",
  "overview": "An insomniac office worker...",
  "runtime": 139,
  "director": "David Fincher",
  "genre": "Drama, Thriller",
  "rating": 8.4,
  "poster_url": "https://image.tmdb.org/t/p/original/poster.jpg",
  "backdrop_url": "https://image.tmdb.org/t/p/original/backdrop.jpg",
  "language": "en",
  "country": "US"
}
```

**Response:**
```json
{
  "created": true,
  "movie": {
    "id": "umdb-cm5def456",
    "title": "Fight Club",
    ...
  }
}
```

**Notes:**
- Idempotent: Returns existing movie if `tmdb_id` or `imdb_id` already exists
- If `created: false`, the movie was already in UMDB
- All API-submitted movies go straight to `VERIFIED` status (trusted source)

---

### Physical Editions/Releases

#### List All Editions for a Movie
```
GET /api/v1/movie/{movieId}/editions
```

Returns all physical media editions (DVD, Blu-ray, VHS, etc.) for a specific movie.

**Response:**
```json
{
  "movie_id": "umdb-cm5def456",
  "results": [
    {
      "id": "rel-cm5abc123xyz",
      "name": "Fight Club (1999) DVD",
      "format": "DVD",
      "cover_image": "https://...",
      "images": [...],
      ...
    }
  ]
}
```

#### Get Single Edition Detail
```
GET /api/v1/editions/{editionId}
```

Or legacy alias:
```
GET /api/v1/releases/{releaseId}
```

Both accept IDs with or without the `rel-` prefix.

**Response:** See example at top of document (includes all fields)

#### Search Editions
```
GET /api/v1/search/releases?query={title}&format={format}&page=1
```

**Supported formats:**
- `vhs`, `dvd`, `blu-ray`, `bluray`, `blu_ray`
- `4k`, `4k uhd`, `4k uhd blu-ray`
- `laserdisc`, `laser disc`
- `betamax`, `hd dvd`
- `cd`, `vinyl`, `cassette`, `8-track`, `minidisc`

**Example:**
```bash
curl "https://umdb-production.up.railway.app/api/v1/search/releases?query=Fight+Club&format=blu-ray"
```

#### Create Edition (CineShelf → UMDB)
```
POST /api/v1/editions
X-API-Key: your_api_key
```

Or legacy alias:
```
POST /api/v1/releases
```

**Request body:**
```json
{
  "movie_id": "umdb-cm5def456",
  "name": "Fight Club (1999) Blu-ray Steelbook",
  "format": "blu-ray",
  "package_type": "Steelbook",
  "edition": "Collector's Edition",
  "region": "Region A",
  "video_standard": "NTSC",
  "country": "US",
  "language": "English",
  "upc": "024543555551",
  "ean": "5039036012249",
  "asin": "B0028O9W50",
  "release_date": "2009-11-17",
  "distributor": "20th Century Fox",
  "studio": "Fox 2000 Pictures",
  "edition_publisher": "Criterion Collection",
  "disc_count": 2,
  "audio_formats": ["DTS-HD Master Audio", "Dolby Atmos"],
  "subtitles": ["English", "Spanish", "French"],
  "copy_protected": true,
  "bonus_content": "Behind the scenes documentary",
  "notes": "Limited edition steelbook",
  "cover_image": "https://example.com/cover.jpg",
  "components": [
    {
      "component_type": "disc",
      "component_name": "Feature Disc"
    },
    {
      "component_type": "disc",
      "component_name": "Bonus Disc"
    }
  ]
}
```

**Alternative: Auto-create movie if not found**

If you don't have `movie_id`, provide `tmdb_id` or `imdb_id` + movie metadata:

```json
{
  "tmdb_id": "550",
  "title": "Fight Club",
  "year": 1999,
  "overview": "An insomniac office worker...",
  "poster_url": "https://...",
  "format": "blu-ray",
  "name": "Fight Club (1999) Blu-ray",
  ...
}
```

**Response:**
```json
{
  "duplicate": false,
  "edition": {
    "id": "rel-cm5abc123xyz",
    "movie_id": "umdb-cm5def456",
    ...
  }
}
```

**Deduplication:**
- If an edition with the same `upc`/`ean` + `movieId` already exists, returns `duplicate: true`
- Returns existing edition instead of creating duplicate

#### Update Edition
```
PUT /api/v1/editions/{editionId}
X-API-Key: your_api_key
```

**Request body:** Same as create, but all fields are optional. Only include fields you want to update.

---

## Field Reference

### Edition/Release Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Release ID (prefixed with `rel-`) | `"rel-cm5abc123"` |
| `movie_id` | string | Movie ID (prefixed with `umdb-`) | `"umdb-cm5def456"` |
| `name` | string | Human-readable edition name | `"Fight Club (1999) Blu-ray Steelbook"` |
| `format` | string | Physical format | `"Blu-ray"`, `"DVD"`, `"4K UHD Blu-ray"`, `"VHS"` |
| `edition` | string | Edition type | `"Collector's Edition"`, `"Director's Cut"`, `"Criterion"` |
| `package_type` | string | Package style | `"Steelbook"`, `"Slipbox"`, `"Digipak"`, `"Standard"` |
| `region` | string | Region lock | `"Region A"`, `"Region 1"`, `"Region Free"` |
| `video_standard` | string | Video encoding | `"NTSC"`, `"PAL"`, `"SECAM"` |
| `country` | string | Release country | `"US"`, `"UK"`, `"JP"` |
| `language` | string | Audio language(s) | `"English"`, `"French (Quebec)"`, `"Bilingual EN/FR"` |
| `upc` | string | Universal Product Code (12 digits) | `"024543555551"` |
| `ean` | string | European Article Number (13 digits) | `"5039036012249"` |
| `asin` | string | Amazon ID (10 chars) | `"B0028O9W50"` |
| `barcode` | string | Generic barcode (UPC or EAN) | Same as `upc` or `ean` |
| `release_date` | string | ISO date | `"2009-11-17"` |
| `distributor` | string | Distribution company | `"20th Century Fox"` |
| `studio` | string | Production studio | `"Fox 2000 Pictures"` |
| `edition_publisher` | string | Edition publisher | `"Criterion Collection"` |
| `disc_count` | number | Number of discs/tapes | `2` |
| `audio_formats` | array | Audio codecs | `["DTS-HD Master Audio", "Dolby Atmos"]` |
| `subtitles` | array | Subtitle languages | `["English", "Spanish", "French"]` |
| `copy_protected` | boolean | Copy protection flag | `true` |
| `bonus_content` | string | Description of extras | `"Behind the scenes documentary..."` |
| `notes` | string | Additional notes | `"Limited edition steelbook..."` |
| `cover_image` | string | Cover art URL | `"https://..."` or `"data:image/jpeg;base64,..."` |
| `components` | array | Physical components | See below |
| `images` | array | Additional images | See below |
| `movie` | object | Related movie data | See below |

### Components Array

Each component represents a physical item (disc, tape, booklet, etc.):

```json
{
  "component_type": "disc",
  "component_name": "Feature Disc",
  "description": "Main movie with commentary",
  "position": 1
}
```

**Component types:** `disc`, `tape`, `booklet`, `slipcover`, `poster`, `other`

### Images Array

Additional cover art, spine shots, back covers, etc.:

```json
{
  "id": "img-cm5ghi789",
  "type": "cover",
  "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "alt_text": "Front cover artwork",
  "is_primary": true,
  "width": 1600,
  "height": 2400,
  "mime_type": "image/jpeg"
}
```

**Image types:** `cover`, `back`, `spine`, `disc`, `snapshot`, `other`

**URL format:** Base64 data URLs (embedded images) or HTTP(S) URLs

### Movie Object (nested in edition response)

```json
{
  "id": "umdb-cm5def456",
  "title": "Fight Club",
  "year": 1999,
  "poster_path": "https://image.tmdb.org/t/p/original/poster.jpg"
}
```

---

## Recommended CineShelf Integration Flow

### 1. User Links Physical Copy to UMDB

When user scans/enters a barcode or searches for an edition:

```php
// Search for the edition
$response = $umdb->get("/api/v1/search/releases", [
    'query' => 'Fight Club',
    'format' => 'blu-ray'
]);

// Display results, let user select
foreach ($response['results'] as $edition) {
    echo $edition['name'];
    echo $edition['cover_image']; // Edition-specific cover!
}
```

### 2. Store releaseId in CineShelf Database

```sql
ALTER TABLE physical_copies ADD COLUMN umdb_release_id VARCHAR(255);
UPDATE physical_copies SET umdb_release_id = 'rel-cm5abc123xyz' WHERE id = 42;
```

### 3. Fetch Edition Cover for Display

```php
// In your display code
if ($copy['umdb_release_id']) {
    $edition = $umdb->get("/api/v1/releases/{$copy['umdb_release_id']}");

    // Use edition-specific cover instead of TMDB poster
    $coverUrl = $edition['cover_image'] ?? $edition['images'][0]['url'] ?? null;

    if ($coverUrl) {
        echo "<img src='{$coverUrl}' alt='{$edition['name']}'>";
    }
}
```

### 4. Fallback Logic

```php
function getCoverImage($copy, $movie) {
    // 1. Try UMDB edition cover
    if ($copy['umdb_release_id']) {
        $edition = fetchUmdbRelease($copy['umdb_release_id']);
        if ($edition['cover_image']) return $edition['cover_image'];
        if ($edition['images'][0]['url']) return $edition['images'][0]['url'];
    }

    // 2. Fall back to TMDB theatrical poster
    return $movie['poster_path'];
}
```

### 5. Create Edition from CineShelf

If user scans a barcode not yet in UMDB:

```php
$edition = $umdb->post("/api/v1/editions", [
    'tmdb_id' => $movie['tmdb_id'],
    'title' => $movie['title'],
    'year' => $movie['year'],
    'format' => 'blu-ray',
    'upc' => '024543555551',
    'cover_image' => $uploadedCoverUrl,
    // ... other fields
], [
    'headers' => ['X-API-Key' => 'your_api_key']
]);

if ($edition['duplicate']) {
    // Already exists, use existing edition
    $releaseId = $edition['edition']['id'];
} else {
    // Created new edition
    $releaseId = $edition['edition']['id'];
}

// Store in CineShelf
updatePhysicalCopy($copyId, ['umdb_release_id' => $releaseId]);
```

---

## Box Sets

Box sets are multi-movie collections (like "The Matrix Trilogy" or "The Lord of the Rings Extended Edition Box Set").

### Create Box Set
```
POST /api/v1/box-sets
X-API-Key: your_api_key
```

**Request body:**
```json
{
  "name": "The Matrix Trilogy",
  "format": "DVD Box Set",
  "edition": "Ultimate Collection",
  "region": "Region 1",
  "package_type": "Slipcase",
  "notes": "Complete trilogy with bonus materials",
  "has_slipcover": true,
  "has_booklet": false,
  "has_bonus_disc": true,
  "bonus_disc_count": 1,
  "has_digital_copy": false,
  "has_3d": false,
  "cover_image": "https://example.com/matrix-trilogy-cover.jpg",
  "spine_image": "https://example.com/matrix-trilogy-spine.jpg",
  "movies": [
    {
      "tmdb_id": "603",
      "title": "The Matrix",
      "year": 1999,
      "disc_number": 1,
      "disc_label": "Disc 1: The Matrix",
      "is_present": true,
      "position": 0
    },
    {
      "tmdb_id": "604",
      "title": "The Matrix Reloaded",
      "year": 2003,
      "disc_number": 2,
      "disc_label": "Disc 2: The Matrix Reloaded",
      "is_present": true,
      "position": 1,
      "umdb_release_id": "rel-cm5abc123"
    },
    {
      "tmdb_id": "605",
      "title": "The Matrix Revolutions",
      "year": 2003,
      "disc_number": 3,
      "disc_label": "Disc 3: The Matrix Revolutions",
      "is_present": true,
      "position": 2
    }
  ]
}
```

**Response:**
```json
{
  "duplicate": false,
  "box_set": {
    "id": "boxset-cm5xyz789",
    "name": "The Matrix Trilogy",
    "format": "DVD Box Set",
    "edition": "Ultimate Collection",
    "region": "Region 1",
    "package_type": "Slipcase",
    "notes": "Complete trilogy with bonus materials",
    "has_slipcover": true,
    "has_booklet": false,
    "has_bonus_disc": true,
    "bonus_disc_count": 1,
    "has_digital_copy": false,
    "has_3d": false,
    "cover_image": "https://example.com/matrix-trilogy-cover.jpg",
    "spine_image": "https://example.com/matrix-trilogy-spine.jpg",
    "movies": [
      {
        "disc_number": 1,
        "disc_label": "Disc 1: The Matrix",
        "is_present": true,
        "position": 0,
        "umdb_release_id": null,
        "movie": {
          "id": "umdb-cm5abc123",
          "title": "The Matrix",
          "year": 1999,
          "poster_path": "https://..."
        }
      },
      {
        "disc_number": 2,
        "disc_label": "Disc 2: The Matrix Reloaded",
        "is_present": true,
        "position": 1,
        "umdb_release_id": "rel-cm5abc123",
        "movie": {
          "id": "umdb-cm5def456",
          "title": "The Matrix Reloaded",
          "year": 2003,
          "poster_path": "https://..."
        }
      },
      {
        "disc_number": 3,
        "disc_label": "Disc 3: The Matrix Revolutions",
        "is_present": true,
        "position": 2,
        "umdb_release_id": null,
        "movie": {
          "id": "umdb-cm5ghi789",
          "title": "The Matrix Revolutions",
          "year": 2003,
          "poster_path": "https://..."
        }
      }
    ]
  }
}
```

**Notes:**
- **Auto-creates movies**: If a movie with `tmdb_id` or `imdb_id` doesn't exist in UMDB, it will be auto-created
- **Deduplication**: If a box set with the same `name` + `format` already exists, returns `duplicate: true` with the existing box set
- **Release linking**: Use `umdb_release_id` to link to a specific physical edition (e.g., if you have the special edition Blu-ray of Matrix Reloaded)
- **Movies array**: Each movie requires either:
  - `tmdb_id` or `imdb_id` (UMDB will create/find the movie)
  - `title` + `year` (for manual entry)
  - `umdb_release_id` (if already cataloged)

### Get Box Set
```
GET /api/v1/box-sets/{boxsetId}
```

**Example:**
```bash
curl "https://umdb-production.up.railway.app/api/v1/box-sets/boxset-cm5xyz789"
```

**Response:** Same as create response (see above)

### List All Box Sets
```
GET /api/v1/box-sets?page=1&limit=20
```

**Response:**
```json
{
  "results": [
    {
      "id": "boxset-cm5xyz789",
      "name": "The Matrix Trilogy",
      "cover_image": "https://...",
      "movies": [...]
    }
  ],
  "total_results": 42,
  "total_pages": 3,
  "page": 1
}
```

### Box Set Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Box set ID (prefixed with `boxset-`) | `"boxset-cm5xyz789"` |
| `name` | string | Box set name | `"The Matrix Trilogy"` |
| `format` | string | Physical format | `"DVD Box Set"`, `"Blu-ray Box Set"` |
| `edition` | string | Edition type | `"Ultimate Collection"`, `"Limited Edition"` |
| `region` | string | Region lock | `"Region 1"`, `"Region A"` |
| `package_type` | string | Package style | `"Slipcase"`, `"Steelbook"`, `"Digibook"` |
| `notes` | string | Additional notes | `"Complete trilogy..."` |
| `has_slipcover` | boolean | Slipcover included | `true` |
| `has_booklet` | boolean | Booklet included | `false` |
| `has_bonus_disc` | boolean | Bonus disc(s) included | `true` |
| `bonus_disc_count` | number | Number of bonus discs | `1` |
| `has_digital_copy` | boolean | Digital copy included | `false` |
| `has_3d` | boolean | 3D version included | `false` |
| `cover_image` | string | Cover art URL | `"https://..."` or `"data:image/..."` |
| `spine_image` | string | Spine image URL | `"https://..."` |
| `movies` | array | Movies in box set | See below |

### Movies Array (in Box Set)

Each movie in the box set:

```json
{
  "disc_number": 1,
  "disc_label": "Disc 1: The Matrix",
  "is_present": true,
  "position": 0,
  "umdb_release_id": "rel-cm5abc123",
  "movie": {
    "id": "umdb-cm5def456",
    "title": "The Matrix",
    "year": 1999,
    "poster_path": "https://..."
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `disc_number` | number | Disc number in the set |
| `disc_label` | string | Label on the disc |
| `is_present` | boolean | Whether disc is present (for tracking missing discs) |
| `position` | number | Order in the box set (0-indexed) |
| `umdb_release_id` | string | Link to specific UMDB edition (if cataloged) |
| `movie` | object | Movie metadata |

---

## Error Handling

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - New resource created
- `400 Bad Request` - Invalid request (missing required fields)
- `401 Unauthorized` - Invalid or missing API key
- `404 Not Found` - Movie/edition not found
- `422 Unprocessable Entity` - Cannot resolve movie reference
- `503 Service Unavailable` - API key required but not configured

### Error Response Format

```json
{
  "status": 404,
  "error": "Release not found"
}
```

---

## Image Handling

UMDB supports two types of image storage:

### 1. External URLs
```json
{
  "cover_image": "https://example.com/covers/fight-club-blu-ray.jpg"
}
```

### 2. Base64 Data URLs (Embedded Images)
```json
{
  "cover_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

**Best Practice for CineShelf:**

```php
function displayImage($url) {
    if (strpos($url, 'data:image/') === 0) {
        // Base64 data URL - can use directly in <img src="">
        return $url;
    } else {
        // External URL - fetch and cache locally if needed
        return $url;
    }
}
```

---

## CORS & Server-Side Calls

UMDB's CORS policy allows requests from configured origins. For **server-side PHP calls**, CORS doesn't apply since there's no browser `Origin` header.

**✅ Server-side calls work without CORS restrictions:**

```php
$ch = curl_init("https://umdb-production.up.railway.app/api/v1/movie/umdb-cm5def456");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
// ✅ Works perfectly
```

---

## Rate Limiting

Currently no rate limits enforced. Please be respectful with API usage.

---

## Support & Questions

If you encounter issues or have questions:

1. Check this documentation
2. Test endpoints with `curl` or Postman
3. Verify `releaseId` format: `rel-{uuid}` ✅
4. Confirm field name: `cover_image` ✅
5. Reach out via GitHub issues: https://github.com/futuresrelic/umdb

---

## Example PHP Implementation

```php
<?php

class UmdbClient {
    private $baseUrl = 'https://umdb-production.up.railway.app/api/v1';
    private $apiKey;

    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey;
    }

    public function get($endpoint, $params = []) {
        $url = $this->baseUrl . $endpoint;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        if ($this->apiKey) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "X-API-Key: {$this->apiKey}"
            ]);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            throw new Exception("UMDB API error: HTTP {$httpCode}");
        }

        return json_decode($response, true);
    }

    public function post($endpoint, $data) {
        $url = $this->baseUrl . $endpoint;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "X-API-Key: {$this->apiKey}"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            throw new Exception("UMDB API error: HTTP {$httpCode}");
        }

        return json_decode($response, true);
    }

    public function getRelease($releaseId) {
        // Normalize ID (strip rel- prefix if present, then re-add)
        $id = str_replace('rel-', '', $releaseId);
        return $this->get("/releases/rel-{$id}");
    }

    public function getMovieEditions($movieId) {
        // Normalize ID (strip umdb- prefix if present, then re-add)
        $id = str_replace('umdb-', '', $movieId);
        return $this->get("/movie/umdb-{$id}/editions");
    }

    public function createBoxSet($data) {
        return $this->post('/box-sets', $data);
    }

    public function getBoxSet($boxsetId) {
        // Normalize ID (strip boxset- prefix if present, then re-add)
        $id = str_replace('boxset-', '', $boxsetId);
        return $this->get("/box-sets/boxset-{$id}");
    }

    public function listBoxSets($page = 1, $limit = 20) {
        return $this->get('/box-sets', ['page' => $page, 'limit' => $limit]);
    }
}

// Usage
$umdb = new UmdbClient('your_api_key_here');

// Get edition details
$edition = $umdb->getRelease('rel-cm5abc123xyz');
echo "Cover: " . $edition['cover_image'];
echo "Format: " . $edition['format'];
echo "Audio: " . implode(', ', $edition['audio_formats']);

// List all editions for a movie
$editions = $umdb->getMovieEditions('umdb-cm5def456');
foreach ($editions['results'] as $ed) {
    echo "{$ed['name']} - {$ed['format']}\n";
    echo "Cover: {$ed['cover_image']}\n";
}

// Create new edition
$newEdition = $umdb->post('/editions', [
    'tmdb_id' => '550',
    'title' => 'Fight Club',
    'year' => 1999,
    'format' => 'dvd',
    'upc' => '024543123456',
    'cover_image' => 'https://example.com/cover.jpg'
]);
echo "Created: " . $newEdition['edition']['id'];

// Create box set
$boxSet = $umdb->createBoxSet([
    'name' => 'The Matrix Trilogy',
    'format' => 'DVD Box Set',
    'edition' => 'Ultimate Collection',
    'has_slipcover' => true,
    'has_bonus_disc' => true,
    'bonus_disc_count' => 1,
    'cover_image' => 'https://example.com/matrix-cover.jpg',
    'movies' => [
        [
            'tmdb_id' => '603',
            'title' => 'The Matrix',
            'year' => 1999,
            'disc_number' => 1,
            'disc_label' => 'Disc 1: The Matrix',
            'position' => 0
        ],
        [
            'tmdb_id' => '604',
            'title' => 'The Matrix Reloaded',
            'year' => 2003,
            'disc_number' => 2,
            'position' => 1
        ],
        [
            'tmdb_id' => '605',
            'title' => 'The Matrix Revolutions',
            'year' => 2003,
            'disc_number' => 3,
            'position' => 2
        ]
    ]
]);
echo "Box set created: " . $boxSet['box_set']['id'] . "\n";

// Get box set details
$boxSet = $umdb->getBoxSet('boxset-cm5xyz789');
echo "Box set: {$boxSet['name']}\n";
echo "Movies: " . count($boxSet['movies']) . "\n";
foreach ($boxSet['movies'] as $movie) {
    echo "  - {$movie['movie']['title']} ({$movie['disc_label']})\n";
}

// List all box sets
$boxSets = $umdb->listBoxSets(1, 10);
echo "Total box sets: " . $boxSets['total_results'] . "\n";
?>
```

---

**Ready to integrate?** Start by testing the endpoints with your Fight Club examples!

```bash
# Get Fight Club editions
curl "https://umdb-production.up.railway.app/api/v1/search/releases?query=Fight+Club"

# Get specific edition (replace with actual ID from search)
curl "https://umdb-production.up.railway.app/api/v1/releases/rel-{id}"
```

🎬 Happy integrating! Let me know if you need any clarification.
