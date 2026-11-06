# Kalagram

Website and admin panel for Kalagram, a learning platform for natural building and traditional mud house construction.

| Folder | What it is |
| --- | --- |
| `kalagram-frontend/` | React (Vite), React Router, Framer Motion, Lucide, Axios, custom CSS |
| `kalagram-backend/` | Java 21, Spring Boot 3.5, Spring Data JPA, Spring Security (JWT), Flyway, MySQL 8 |
| `docs/API.md` | REST API reference |
| `start-local.cmd`, `stop-local.cmd` | Start and stop everything on a Windows development PC |

## Quick start on Windows

`start-local.cmd` starts everything on a Windows development PC, and `stop-local.cmd` stops it. Starting can take several minutes on a busy PC.

```
.\start-local.cmd -ToolsDir C:\path\to\tools
```

- Website: http://localhost:5180
- Admin panel: http://localhost:5180/admin

`-ToolsDir` is a folder containing JDK 21, Maven and MySQL 8 in `jdk\jdk-21*`, `maven\apache-maven-*` and `mysql\mysql-8*`. Node must also be installed. If you don't have that folder, follow the manual setup below.

The script runs its own MySQL on port 3307, listening only on this PC with a passwordless root account, and keeps the data in `%USERPROFILE%\.kalagram\mysql-data`. It does not touch any other MySQL installation.

The servers run in the background with no windows, and stop when the PC restarts. Each server writes to the `logs` folder: `backend.log`, `website.log` and an `-errors.log` for each. Starting again keeps the last run as `.previous.log`. These logs can contain visitors' details from error messages, so don't share them publicly.

The first run creates `kalagram-backend/.env` with random secrets and an admin password, and prints that password. It is the `ADMIN_PASSWORD` line in that file. This file is git-ignored.

## Manual setup

You need JDK 21, Node 20 or newer, and MySQL 8.0 or newer.

### Database

The API creates and migrates its own schema with Flyway (`kalagram-backend/src/main/resources/db/migration`). You only need a MySQL account that can create the database. For a dedicated account:

```sql
CREATE DATABASE kalagram CHARACTER SET utf8mb4;
CREATE USER 'kalagram'@'%' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON kalagram.* TO 'kalagram'@'%';
```

| Table | Holds |
| --- | --- |
| `admin_users` | Admin logins |
| `workshops` | Workshops; lists such as the schedule and FAQs are JSON text |
| `workshop_batches` | Dates and seats, linked to a workshop |
| `workshop_registrations` | Registrations, linked to a workshop and batch |
| `enquiries` | Contact form messages, status and internal notes |
| `gallery_images` | Gallery pictures |
| `resource_categories`, `resources` | Learning library |
| `site_settings` | Contact details and editable homepage content |

The brief's suggested `users` and `contact_messages` tables are left out: visitors have no accounts, and contact form messages are stored in `enquiries`.

### Backend

```
cd kalagram-backend
copy .env.example .env      (then fill in the required values)
mvnw.cmd spring-boot:run
```

Spring Boot reads `.env` from the folder it starts in. Real environment variables override it. `.env.example` lists every setting. `.env` is git-ignored: never commit it.

Tests: `mvnw.cmd test`.

### Frontend

```
cd kalagram-frontend
npm install
npm run dev
```

Vite proxies `/api` and `/uploads` to `http://localhost:8080`.

## Before going live

1. **Replace the sample content.** Workshop dates, descriptions, resources and the gallery are placeholders. Set `SEED_SAMPLE_DATA=false` before the first production start, or edit them in the admin panel.
2. **Replace the pictures.** Images were cut from the design mockups and are low resolution. Upload real photographs in the admin panel; files in `kalagram-frontend/public/images` can also be replaced.
3. **Confirm the Gallery numbers.** 20+, 50+, 500+ and 100% come from the mockup. Change them to real figures in Website Settings.
4. **Set real business details** in Website Settings: email (currently a placeholder, `hello@kalagram.org`) and social links. Also set the Google Maps location: the map and directions only point to Pune city for now, because searching the name "Kalagram" finds other businesses. Use exact coordinates, such as `18.5204,73.8567`.
5. **Set prices.** Workshops show "Price on request" until a price is entered.
6. **Secure MySQL** with a dedicated account and password rather than the local setup above.

## Public preview on GitHub Pages

https://dev-tushar-patil.github.io/kalagram/ is a static preview for showing the design. It has no backend: content is a saved copy, registrations and enquiries go through WhatsApp only and are not stored, seats are not tracked, and there is no admin panel. It is not a replacement for the deployment below.

To update it, run `npm run build:pages` in `kalagram-frontend` with the API running, then publish `dist-pages/` to the `gh-pages` branch. Workshop dates are copied at build time, so rebuild when they change.

## Deployment

```
cd kalagram-backend && mvnw.cmd -DskipTests package     (produces target/kalagram-backend-1.0.0.jar)
cd kalagram-frontend && npm run build                   (produces dist/)
```

Serve `dist/` as a static site and send unknown paths to `index.html`. On one domain, proxy `/api` and `/uploads` to the API. For example, with nginx:

```nginx
location / { root /var/www/kalagram; try_files $uri /index.html; }
location ~ ^/(api|uploads)/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 20m;
}
```

Production settings for the API:

- `FORWARD_HEADERS=framework` behind a proxy. Without it, rate limiting sees every visitor as the proxy's address.
- `CORS_ALLOWED_ORIGINS` set to the site's origin, if the site and API use different domains. Also build the frontend with `VITE_API_ORIGIN`.
- `UPLOAD_DIR` on storage that survives redeploys. Back it up along with the database.
- HTTPS on the proxy, because admin tokens and visitor details pass through it.

## WhatsApp

**Click-to-chat** works with no setup. After registering, the visitor gets a **Send Registration on WhatsApp** button that opens `wa.me` with the message filled in. WhatsApp requires the visitor to press Send. The number comes from Website Settings.

**Automatic notifications** are off until configured:

1. Create a WhatsApp Business app in Meta for Developers and note the phone number ID and a permanent access token.
2. Get a template approved, named to match `WHATSAPP_TEMPLATE_NAME` (default `new_workshop_registration`), with exactly 8 body variables in this order:

   ```
   New workshop registration
   ID: {{1}}
   Name: {{2}}
   Phone: {{3}}
   Email: {{4}}
   Workshop: {{5}}
   Date: {{6}}
   Participants: {{7}}
   City: {{8}}
   ```

3. Set these in the backend environment. The token belongs only there, never in code:

   ```
   WHATSAPP_ENABLED=true
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_TEMPLATE_LANGUAGE=en
   WHATSAPP_NOTIFY_TO=919011059088
   ```

Failures are logged and never affect the registration. Check that `WHATSAPP_API_VERSION` is still a version Meta supports.

## Email confirmation

Off by default. Set `MAIL_ENABLED=true`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` and `MAIL_FROM` to email participants when they register.

## Nature sounds

The Music ON/OFF control synthesises wind, water and birdsong in the browser with the Web Audio API (`src/utils/natureAudio.js`). There are no audio files, so there is nothing to license. To use a recording instead, replace that module's `start` and `stop`.
