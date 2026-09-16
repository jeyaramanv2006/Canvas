# Architecture

## System Architecture
```
[ Field Canvasser (Mobile) ]     \
[ Admin Executive (Desktop) ]     ==> [ React + Tailwind CSS Web Client ] ==> [ REST API Backend (Node/Express) ] ==> [ Relational DB (SQLite / Postgres) ]
[ CCO / Operations (Desktop)]     /          || (5-Role Layer RBAC Engine)               ||
[ CFO / Finance (Desktop)   ]    /           ||                                (JWT Auth & Role Scoping)
[ CEO / Super Admin (Desk)  ]   /            v
                                    [ Dynamic KPI Engine & Data Masking ]
```

## System Components

### 1. Frontend Web Client (React + Tailwind CSS)
- **RBAC Engine (`src/lib/rbac.js`)**: Defines five distinct roles and their layer coverage:
  - **CEO (`ceo`)**: Global unrestricted command over all dashboards, financials, operations, school catalogs, user governance, and approval queues.
  - **CFO (`cfo`)**: Executive financial strategy, P&L, GP%, collection tracking, and commercial reporting.
  - **CCO (`cco`)**: Operations, field performance, conversion analytics, and team coordination.
  - **Admin Executive (`admin_exec` / `admin`)**: Data management, visit review & audit trails, invoice & quote generation, school management (via CEO approval), and user actions (via CEO approval).
  - **Canvasser (`canvasser` / `cvs`)**: Field school visits logging, unlisted school discovery, specifications capture, sample photo uploads, scoped visit history, and gamified multi-criteria leaderboard.
- **Dynamic KPI Section (`DynamicKPISection.jsx`)**: Context-aware metrics rendering tailored KPIs per role.
- **Executive Command Centers**:
  - `CEODashboard.jsx`: High-level strategic command room with overview KPIs, MIS data, User Management, Master School DB, and Pending Approvals Queue.
  - `CFODashboard.jsx`: Comprehensive financial reporting, revenue analysis, gross margins, receivables aging, and collection rates.
  - `CCODashboard.jsx`: Field operations, conversion funnel, and team activity tracking.
  - `ManagerDashboard.jsx`: Admin Executive operations, central visit registry, audit trail inspection, invoicing & quotations workspace, and school catalog management.
  - `CanvasserDashboard.jsx`: Mobile-first field sales app with quick stats, single-screen visit logging, sample photo attachments, and scoped visit history.
- **Core Modules**:
  - `CanvasserLeaderboard.jsx`: Multi-criteria sortable leaderboard with itemized converted invoice drawer and active commission slab tier progression.
  - `MasterSchoolsDirectoryModule.jsx`: Statewide institutional school directory with fuzzy search, student strength tracking, and RFC 4180 CSV export.
  - `UserManagementModule.jsx`: Enterprise user directory supporting account lifecycle (`ACTIVE`, `PAUSED`, `DELETED`), password resets, and CEO approval routing.
  - `PendingApprovalsDrawer.jsx`: CEO review interface for approving or rejecting user and school modifications.
  - `InvoicingModule.jsx` & `InvoiceDocumentModal.jsx`: Custom dynamic line-item quotations, tax invoices (`INV-2026-XXX`), payment tracking, and watermark-branded A4 document printing.
  - `FieldVisitRegistry.jsx`: Global visit log table with search, district filters, and discovery verification.
  - `EditHistoryModal.jsx`: Field-level diff audit trail viewer for modified visit records.

### 2. Backend REST API (Node.js & Express)
- Modular Express API with ES Modules handling authentication, JWT verification, role-based authorization, visit CRUD with audit logging, master schools management, user lifecycle & CEO approval queue, financial analytics, and CSV exports.

### 3. Relational Database Layer
- Dual relational database support:
  - **SQLite** via Node.js native `DatabaseSync` (`node:sqlite`) with WAL mode and foreign key constraints enabled for local and persistent single-instance deployment.
  - **PostgreSQL / Neon** via `pgAdapter.js` / `@neondatabase/serverless` for managed cloud deployments.
- Core relational tables: `users`, `pending_user_actions`, `visits`, `audit_logs`, `master_schools`, `products`, `quotations`, `invoices`, and `payments`.

## Security & Data Scoping Flow
1. User logs in (`POST /api/login` or `POST /api/auth/login`) with username `<name>@<role>` and password.
2. Backend validates credentials, checks account status (`ACTIVE` vs `PAUSED`/`DELETED`), and returns a signed 7-day JWT containing user ID, username, name, role, and role title.
3. Protected endpoints enforce `authenticateToken` middleware, with role-specific guards (`requireAdmin`, `requireCEO`).
4. **Data Isolation**: Canvassers are restricted to their own visit records for modifications. Executive and financial metrics are masked according to role permissions in `src/lib/rbac.js`.
5. **Audit Logging**: Any update or verification on visits creates an immutable entry in `audit_logs` capturing actor identity, action type, and field-level diffs.

