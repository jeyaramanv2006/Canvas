# Technical Requirements Document (TRD)

## Technical Architecture
- **Pattern**: Client-Server Architecture (RESTful JSON API).
- **Frontend Stack**: React 18, Vite, HTML5, Tailwind CSS, Lucide Icons, Framer Motion animations.
- **Backend Stack**: Node.js (ES Modules), Express.js REST API server.
- **Database Stack**: Dual-Engine Relational Architecture:
  - **SQLite**: Local development & Railway single-instance production via native Node.js `DatabaseSync` (`node:sqlite`) with Write-Ahead Logging (WAL) and foreign keys enabled.
  - **PostgreSQL / Neon**: Serverless cloud PostgreSQL via `pgAdapter.js` and `@neondatabase/serverless` when `DATABASE_URL` is set.
- **Security & Session**: Stateless JWT (JSON Web Tokens) with 7-day expiration, signed with HMAC-SHA256 secret key; bcrypt password hashing (`bcryptjs` with salt factor 10).

## Technical Constraints & Standards
- Passwords must be hashed using bcrypt before database storage; plain text is never persisted or logged.
- Stateless JWT verification on every protected endpoint (`authenticateToken` middleware).
- Strict database foreign key relationships (`visits.canvasser_id` -> `users.id`, `quotations.canvasser_id` -> `users.id`, `payments.invoice_id` -> `invoices.id`).
- All visit updates and discovery verifications must produce append-only audit trail records in `audit_logs`.
- Master School mutations by non-CEO roles must pass through the `pending_user_actions` queue.
- CSV exports must conform strictly to RFC 4180 standards with quoted escaping.

## Implementation Architecture
- **Frontend Runtime**: Single Page Application (SPA) bundled via Vite, deployed on Vercel or static CDN.
- **Backend Runtime**: Node.js 20+ service running Express server on port 5000 (configurable via `PORT` environment variable).
- **Persistence Path**: SQLite data directory at `backend/data/canvas.db` (or configurable volume mount in production).
- **CORS Configuration**: Supports preflight and cross-origin requests for decoupled web clients.

