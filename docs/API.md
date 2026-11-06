# Kalagram REST API

Base URL: `/api` (locally `http://localhost:8080/api`). Requests and responses are JSON unless noted. Dates are `YYYY-MM-DD`; timestamps are UTC ISO-8601.

## Errors

Every error has the same shape. `fieldErrors` appears only on validation failures.

```json
{ "status": 400, "message": "Please correct the highlighted fields.", "fieldErrors": { "email": "Enter a valid email address" } }
```

| Status | Meaning |
| --- | --- |
| 400 | Invalid input |
| 401 | Missing, invalid or expired token; wrong login |
| 404 | Not found (also inactive workshops and unpublished resources on public routes) |
| 409 | Conflict: batch full or closed, or a delete blocked by existing registrations |
| 413 | Upload too large |
| 415 | Unsupported content type |
| 429 | Rate limit reached (login, registration and enquiry POSTs, per IP, per minute) |

## Public endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/workshops` | Active workshops, each with `upcomingBatches` |
| GET | `/workshops/{idOrSlug}` | Full details, with upcoming `batches` |
| GET | `/workshops/{id}/batches` | Upcoming active batches, including full ones |
| POST | `/registrations` | Create a registration (below) |
| POST | `/enquiries` | Create an enquiry. Returns `{ "id": 1 }` |
| GET | `/gallery?category=` | Optional `MUD_HOUSES`, `WORKSHOPS`, `MATERIALS`, `SPACES_INTERIORS`, `CAMPUS_NATURE` |
| GET | `/resources?categoryId=` | Published resources, without `body` |
| GET | `/resources/{idOrSlug}` | One published resource, with `body` |
| GET | `/resource-categories` | Resource categories |
| GET | `/settings` | Public site settings |

### POST /registrations

```json
{
  "fullName": "Asha Patil",
  "email": "asha@example.com",
  "mobile": "+91 90000 00000",
  "workshopId": 1,
  "batchId": 1,
  "participants": 2,
  "city": "Pune",
  "message": "Optional"
}
```

`city` and `message` are optional. `participants` is 1 to 20. Response `201`:

```json
{
  "registrationId": "KG-2026-7HQ2MZ",
  "status": "PENDING",
  "fullName": "Asha Patil",
  "mobile": "+91 90000 00000",
  "email": "asha@example.com",
  "workshopTitle": "Mud House Building Workshop",
  "startDate": "2026-11-27",
  "endDate": "2026-12-03",
  "batchLabel": "Upcoming batch",
  "participants": 2,
  "city": "Pune",
  "message": "Optional"
}
```

Seats are taken inside a transaction holding a row lock on the batch, so concurrent requests cannot overbook. A `409` means the batch is full, has too few seats left, has started, or is closed; `message` says which. Automatic WhatsApp and email notifications run after commit on a background thread, so their failure never affects the registration.

### POST /enquiries

```json
{ "name": "Ravi", "email": "r@example.com", "phone": "9000000000", "enquiryFor": "Collaboration", "message": "Hello" }
```

## Admin endpoints

All paths below start `/api/admin` and require `Authorization: Bearer <token>`, except login.

### Authentication

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | Body `{ "email", "password" }`. Returns `{ "token", "expiresAt", "email", "displayName" }` |
| GET | `/auth/me` | The signed-in admin |

### Dashboard

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/dashboard` | `totalRegistrations`, `upcomingWorkshops` (upcoming active batches), `totalEnquiries`, `newEnquiries`, `totalParticipants` (excluding cancelled), `registrationsLast30Days`, `recentRegistrations` |

### Workshops and batches

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/workshops` | All workshops, including inactive |
| GET | `/workshops/{id}` | Details, with all batches |
| POST | `/workshops` | Create (`201`) |
| PUT | `/workshops/{id}` | Update |
| DELETE | `/workshops/{id}` | `204`, or `409` if it has registrations: mark it inactive instead |
| GET | `/workshops/{id}/batches` | All batches |
| POST | `/batches` | Create (`201`) |
| PUT | `/batches/{id}` | Update. `409` if total seats would fall below booked seats |
| DELETE | `/batches/{id}` | `204`, or `409` if it has registrations |

Workshop body:

```json
{
  "title": "Earthen Plaster & Finishes",
  "category": "Plaster & Finishes",
  "shortDescription": "Required",
  "overview": "Required. Blank lines separate paragraphs.",
  "imageUrl": "/uploads/abc.jpg",
  "bannerUrl": "/uploads/def.jpg",
  "duration": "3 Days",
  "skillLevel": "BEGINNER",
  "priceInr": 4500,
  "location": "Kalagram, Pune, Maharashtra",
  "learningOutcomes": ["..."],
  "curriculum": ["..."],
  "schedule": [{ "day": "Day 1", "title": "Preparing", "description": "..." }],
  "materialsProvided": ["..."],
  "whatToBring": ["..."],
  "faqs": [{ "question": "...", "answer": "..." }],
  "displayOrder": 1,
  "active": true
}
```

`skillLevel` is `BEGINNER`, `INTERMEDIATE`, `ADVANCED` or `ALL_LEVELS`. Leave `priceInr` null to show "Price on request".

Batch body:

```json
{ "workshopId": 1, "label": "Winter batch", "startDate": "2027-01-05", "endDate": "2027-01-11", "totalSeats": 20, "active": true }
```

### Registrations

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/registrations` | Paged. Query: `q` (name, mobile or ID), `workshopId`, `status`, `from`, `to` (registration date, India time), `page`, `size` (max 100) |
| GET | `/registrations/export` | CSV with the same filters. Cells that could run as spreadsheet formulas are neutralised |
| GET | `/registrations/{id}` | One registration |
| PUT | `/registrations/{id}/status` | Body `{ "status": "CONFIRMED" }`: `PENDING`, `CONFIRMED`, `CANCELLED` or `COMPLETED` |

Cancelling returns seats to the batch. Moving a cancelled registration back takes them again, or returns `409` if they have gone.

Paged responses look like `{ "content": [], "page": 0, "size": 20, "totalElements": 0, "totalPages": 0 }`.

### Enquiries

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/enquiries` | Paged. Query: `status`, `page`, `size` |
| PUT | `/enquiries/{id}` | Body `{ "status": "IN_PROGRESS", "internalNotes": "..." }`. Status: `NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |

### Gallery

Read through the public `GET /api/gallery`.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/gallery` | Body `{ "title", "altText", "imageUrl", "category", "displayOrder" }` (`201`) |
| PUT | `/gallery/{id}` | Update. A replaced uploaded file is deleted |
| DELETE | `/gallery/{id}` | `204`. An uploaded file is deleted too |

### Resources

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/resources` | All, including drafts |
| POST | `/resources` | Create (`201`) |
| PUT | `/resources/{id}` | Update |
| DELETE | `/resources/{id}` | `204` |
| POST | `/resource-categories` | Body `{ "name", "description", "icon", "displayOrder" }`. `icon` is `book`, `video`, `download` or `article` |
| PUT | `/resource-categories/{id}` | Update |
| DELETE | `/resource-categories/{id}` | `204`, or `409` if it still has resources |

Resource body:

```json
{
  "title": "Required",
  "categoryId": 1,
  "type": "ARTICLE",
  "shortDescription": "Required",
  "body": "Text. Blank lines separate paragraphs.",
  "thumbnailUrl": "/uploads/abc.jpg",
  "fileUrl": "/uploads/guide.pdf",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "readingMinutes": 8,
  "featured": false,
  "published": true
}
```

`type` is `ARTICLE`, `GUIDE`, `VIDEO` (needs `videoUrl`) or `DOWNLOAD` (needs `fileUrl`). `ARTICLE` and `GUIDE` need `body` or `fileUrl`.

### Uploads

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/uploads` | `multipart/form-data` with a `file` field. JPG, PNG, WebP or PDF, checked by file content; 20 MB by default. Returns `{ "url", "fileName", "size" }` (`201`). Put `url` in a workshop, gallery or resource |

Uploaded files are served at `/uploads/{name}`.

### Settings

| Method | Path | Notes |
| --- | --- | --- |
| PUT | `/settings` | Body: any subset of the keys below, as strings. Returns all settings |

Keys: `phone`, `whatsapp` (digits with country code), `email`, `address`, `mapsQuery`, `facebookUrl`, `instagramUrl`, `youtubeUrl`, `heroTitle`, `heroSubtitle`, `aboutPreview`, `ctaTitle`, `ctaText`, and `stat1Value` / `stat1Label` through `stat4Value` / `stat4Label`.
