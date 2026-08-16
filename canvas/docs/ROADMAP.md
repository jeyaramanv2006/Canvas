# Roadmap

## Phase 1: Database & Model Foundation
- Setup `Users` and `Visits` database schemas and foreign key constraints.
- Seed initial manager and canvasser test accounts.

## Phase 2: Authentication & Access Control
- Implement `POST /api/login` with password hashing verification.
- Implement JWT token generation and validation middleware.
- Configure role verification logic (`canvasser` vs `manager`).

## Phase 3: Canvasser Field Workflows
- Build `POST /api/visits` endpoint for visit entry creation.
- Build `GET /api/visits` with strict `canvasser_id` filtering.
- Build `PATCH /api/visits/{id}` for deal status updates (Won/Lost).
- Develop mobile-first React UI with product chips and quick stats header.

## Phase 4: Manager Dashboard & Analytics
- Build `GET /api/admin/dashboard` analytics queries (Win Rate %, Hot Leads, Top Districts, Product Demand).
- Build `GET /api/admin/team` performance table.
- Build `GET /api/admin/export` CSV generator.
- Develop manager dashboard React UI with charts and recent activity feed.

## Phase 5: Future Upgrades (Proposed)
- Offline browser support (`localStorage` sync fallback).
- GPS check-in auto-tagging.
- Sample/School photo upload support.
- One-tap WhatsApp visit summary sharing.
