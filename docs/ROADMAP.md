# Roadmap

## Phase 1: Database & Model Foundation (Completed)
- Setup relational database schema (`users`, `visits`, `master_schools`, `pending_user_actions`, `audit_logs`, `products`, `quotations`, `invoices`, `payments`).
- Dual-engine adapter for SQLite (`node:sqlite`) with WAL mode and PostgreSQL / Neon (`pgAdapter.js`).
- Seed initial multi-role executive, admin, and canvasser accounts.

## Phase 2: Authentication & Role-Based Access Control (Completed)
- Implement `POST /api/login` and `POST /api/auth/login` with bcrypt password verification.
- Implement JWT token generation and validation middleware (`authenticateToken`, `requireAdmin`, `requireCEO`).
- Five-tier role scoping engine (`CEO`, `CFO`, `CCO`, `Admin Executive`, `Canvasser`).
- Mandatory force-password-reset workflow.

## Phase 3: Field Canvassing & Institutional Directory (Completed)
- Statewide Master School Catalog with search-first picker (`SchoolSearchPicker.jsx`) and fallback unlisted discovery tracking.
- Single-screen visit logging with fabric GSM specifications, sample photo attachments, flexible follow-up, and restricted outcome stages.
- Scoped "My Visits" feed with photo lightbox and edit history timeline.
- Canvasser field contact details & student strength auto-sync to master catalog.

## Phase 4: Commercial Invoicing Suite & Gamified Leaderboard (Completed)
- Dynamic line-item Quotation and Tax Invoicing generator (`INV-2026-XXX`) with GST calculation and Murugan Enterprises watermark A4 printing.
- Payment installment recording and accounts receivable tracking.
- Multi-criteria sortable Canvasser Leaderboard with itemized converted invoice drawer.
- Standard Monthly Commission Matrix (8 Slabs: 2.00% to 5.50%), Volume Bonus Tiers, and 1st-of-month payout schedule.

## Phase 5: Enterprise Governance & Executive MIS (Completed)
- User Management directory with account lifecycle (`ACTIVE`, `PAUSED`, `DELETED`).
- CEO Approval Queue for Admin user actions and master school catalog mutations.
- Immutable visit audit trail with field-level diff logging.
- Executive dashboards for CEO, CFO, CCO with dev preview overlays.

## Phase 6: Production Deployment & Field Scaling (Active)
- Deploy React/Vite frontend to Vercel and Express API to Railway.
- Single-instance persistent SQLite volume mount on Railway with backup verification.
- Offline browser capability (`localStorage` cache queue for remote school campuses).

