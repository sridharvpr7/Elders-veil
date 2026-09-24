# Elder's Veil — Commercial Full-Stack Comic Reading Platform

Elder's Veil is a production-ready, dark-themed comic, manga, manhwa, and manhua reading platform built with Node.js, Express.js, PostgreSQL, JWT authentication, and Vanilla HTML5/CSS3/JavaScript.

---

## Features

- **Premium Dark UI**: Built with modern CSS variables, glassmorphism, smooth animations, responsive grids, toast notifications, and modal popups.
- **Interactive Vertical Reader**: Full-width comic pages, vertical scroll progress bar, page counter pill, fullscreen mode, chapter selector, and keyboard navigation (`←` / `→`).
- **PostgreSQL Database Support**: Parameterized SQL queries, automated schema migrations (`backend/migrations/schema.sql`), dynamic local fallback engine for out-of-the-box local testing.
- **User Authentication**: JWT authentication with bcrypt password hashing (10 rounds), duplicate email/username protection, profile avatar updates, and password changes.
- **Progress Tracking & Sync**: Save chapter reading history and current page number, bookmark comics, and favorite titles.
- **Admin Upload & Content Portal**: Upload cover images, banner images, and multi-page chapter images using Multer with strict MIME and size validations.
- **JSON Content Manager**: Comprehensive JSON import validation (detects missing fields, duplicate IDs/slugs/chapter numbers) and full JSON database export backup generator.
- **Render Ready**: Optimized for 1-click deployment on Render with automatic environment variable bindings and SSL PostgreSQL pool support.

---

## Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla CSS with variables), Vanilla JavaScript (Fetch API, ES6+ modules).
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, Multer, Helmet, CORS, Express Rate Limit, `dotenv`.
- **Database**: PostgreSQL (`pg` connection pool with Render SSL support).

---

## Local Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   PORT=5000
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/elders_veil
   JWT_SECRET=super_secret_jwt_key_elders_veil_2026_comicverse
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

3. **Start Server**:
   ```bash
   npm start
   ```
   Open `http://localhost:5000` in your web browser.

4. **Default Credentials**:
   - **Admin Account**: `admin@comicverse.com` / `AdminPass123!`
   - **Standard User**: `user@comicverse.com` / `UserPass123!`

---

## Render Deployment Guide

1. **Create PostgreSQL Database on Render**:
   - Log into Render Dashboard -> **New +** -> **PostgreSQL**.
   - Copy the **Internal Database URL** or **External Database URL**.

2. **Create Backend Web Service on Render**:
   - Connect your GitHub Repository.
   - Set **Environment**: `Node`.
   - Set **Build Command**: `npm install`.
   - Set **Start Command**: `node backend/src/server.js`.

3. **Set Environment Variables in Render**:
   - `PORT` = `10000` (or leave default assigned by Render)
   - `DATABASE_URL` = `<your_render_postgres_connection_string>`
   - `JWT_SECRET` = `<your_production_jwt_secret_key>`
   - `NODE_ENV` = `production`

4. **Verify Deployment**:
   - The application automatically runs `schema.sql` migrations and populates seed data on first boot.


## Creator & Premium System
- Users can activate Creator Mode from Creator Studio.
- Creators can create draft comics, upload chapters, and publish their own comics.
- Comic ownership is stored with `creator_id`.
- Registration stores a mobile number.
- Admins can activate/deactivate Premium, Block, Unblock, Ban, and Unban users from User Management.
- Premium accounts receive the exclusive golden UI theme.
- Existing PostgreSQL deployments receive the new columns automatically through the migration script.


## Creator Review & Reading Progress Updates

- Creator comic/chapter submissions now enter an **admin review queue** as `pending`.
- Only administrators can approve/publish or reject submissions.
- Rejected comics can be resubmitted by their creator.
- Unpublished comics/chapters are blocked from public catalog/reader access at the API level.
- Continue Reading restores the exact saved chapter and page.
- Reading history exposes an overall comic completion percentage and last-read chapter/page.
- Admin dashboard now includes users, comics, chapters, views, likes/favorites, bookmarks, pending reviews, creators, premium users, active users, and rejected submissions.
- Added responsive admin Review Queue at `/admin/review.html`.

**Database:** the schema adds `review_note` and `publish_status` fields for comics/chapters. Existing chapters remain published when the migration adds the new chapter status column.


## User Upload + Admin Review Workflow

- Any authenticated user can open Creator Studio and submit a comic.
- User submissions are always created with `publish_status = pending`.
- Chapter submissions are also `pending`.
- Only an administrator can approve/publish or reject a submission.
- Rejected comics can be resubmitted; rejected chapters can also be resubmitted.
- Pending/rejected content is hidden from public catalog and reader routes.
- Continue Reading stores the exact comic + chapter + page and displays overall progress.


## New production features added

- Mandatory mobile number during registration.
- One-month premium expiry handling with automatic expired state.
- User Light/Dark theme plus premium-expired red state.
- Profile picture validation at 50 KB maximum.
- Comic page validation at 150 KB maximum and up to 50 pages.
- Drag/drop page ordering and previews.
- Normal users use Dashboard → Become a Comic Writer; direct upload APIs require creator/admin role.
- Creator drafts/submissions and admin review with Approve, Reject and Request Changes.
- Admin users pinned at the top of User Management.
- Notifications center and notification preferences.
- Likes, follows, ratings, reviews/comments.
- WhatsApp Business Cloud API integration hooks for welcome, new comic and new chapter notifications.
- Creator dashboard summary analytics.
- Role management for users from the admin panel.
- PostgreSQL schema for notifications and engagement data.

### WhatsApp setup

Create approved WhatsApp Business/Meta Cloud API templates named according to your provider configuration (default names used by this project are `elder_veil_welcome`, `elder_veil_new_comic`, and `elder_veil_new_chapter`). Configure:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_LANGUAGE=en_US
FRONTEND_URL=https://your-domain.example
```

The WhatsApp integration never exposes the access token to the browser. If WhatsApp is not configured, account creation and publishing continue normally and the delivery failure is not treated as a fatal application error.

### Deployment

For Render/PostgreSQL, configure `DATABASE_URL`, `JWT_SECRET`, and the other values in `.env.example`. The application runs the PostgreSQL schema migration automatically at startup when `DATABASE_URL` is available.


## Elder's Veil v2 upgrades
The project now includes a production-oriented feature layer for: Continue Reading with exact page progress, reader modes/zoom/swipe/fullscreen, recommendations, trending discovery, creator drafts and scheduling, AI-ready comic drafting, Cloudinary-ready image storage, premium Razorpay checkout, password reset email integration, comment likes/replies/moderation, reports, creator follows, achievements, analytics events, admin operations, audit logs, support tickets, manual backups, PWA installation/offline shell, SEO metadata hooks, stricter CORS/rate limiting, and request-scoped error IDs. Optional integrations are disabled until their environment variables are configured.

## 25 Feature Upgrade Pack

The current build includes the requested platform upgrade set:

1. Continue-reading with chapter/page resume and saved reading progress.
2. Reader controls: single, double, vertical, zoom, fullscreen, keyboard and touch navigation, lazy loading.
3. Social engagement: likes, follows, ratings, comments, replies, comment likes and reports.
4. User profile improvements, achievements and reading statistics.
5. Creator Studio with drafts, submissions, analytics and chapter management.
6. Notifications with in-app messages, preferences, publication alerts and scheduled publishing support.
7. PWA installation support with manifest, service worker and app icons.
8. Performance improvements through lazy image loading, caching and client-side chapter image compression.
9. Optional Cloudinary storage for production media.
10. Security improvements: Helmet, CORS allow-list, API/login rate limiting, protected roles, upload validation and request IDs.
11. Premium state, expiry tracking and expired-premium visual state.
12. Optional Razorpay one-month Premium checkout with server-side signature verification.
13. Search suggestions plus language-aware comic filtering.
14. SEO metadata, Open Graph tags, clean comic/chapter links and structured data.
15. Bilingual UI foundation with English/Tamil selector and comic language filters.
16. Content moderation/report workflow and admin review actions.
17. Analytics event collection and admin analytics overview.
18. Trending ranking endpoint and home-page trending section.
19. Homepage sections for trending, popular, latest and personalized recommendations.
20. Rich comic cards with rating, views, status/type and creator links.
21. Optional AI adapter plus local smart drafting fallback.
22. Near-real-time notification refresh with backend SSE endpoint available for future native EventSource auth.
23. Admin operations, support tickets and moderation reports.
24. Manual/daily JSON backups of database/application data (use persistent external storage for production backup retention).
25. Syntax-test script and structured error IDs for production troubleshooting.

### Production Environment

Required core variables:
```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
ALLOWED_ORIGINS=
```

WhatsApp Cloud API:
```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_LANGUAGE=en_US
WHATSAPP_GRAPH_VERSION=v25.0
```

Optional storage, email, AI and payments are documented in `.env.example`. Keep all secrets only in the backend environment (for Render, use the service Environment page) and never commit `.env`.

For GitHub Pages, keep `FRONTEND_URL` pointed at the published frontend URL and set `UPLOAD_BASE_URL` to the backend public URL when using local backend uploads. For Cloudinary storage, set `STORAGE_PROVIDER=cloudinary` and provide its three credentials.
