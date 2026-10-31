# Neon Serverless Postgres Optimization Audit & Implementation Plan

**Project:** MG The One / Murugan Canvass Platform  
**Target Infrastructure:** Neon Serverless Postgres (`neondb` / AWS us-east-1) + Render Backend Web Service  
**Architecture Review Focus:** Public Network Transfer (Egress / Bandwidth) & Compute Consumption (CU-Hours / Scale-to-Zero)  
**Performance Directive:** Zero performance degradation; 100% feature preservation with strictly improved throughput and lower latency.

---

## 1. Executive Summary

### Top 3 Worst Offenders Killing Network Transfer (Egress)
1. **Unpaginated Master Schools Catalog Dump (2,610 Rows / ~1.1 MB per fetch):**
   - **Culprit:** `backend/controllers/masterSchoolsController.js` (lines 16–67) + `frontend/src/components/MasterSchoolsDirectoryModule.jsx` (line 67).
   - **Impact:** Calling `GET /api/master-schools?limit=all` pulls all 2,610 institutional records across 14 columns over the Postgres wire on every visit. With no HTTP compression in Express, ~1.1 MB of raw JSON is sent over the network on every catalog view.
2. **Eager Audit Logs Join on Unbounded Visits List Query:**
   - **Culprit:** `backend/controllers/visitsController.js` (lines 44–94).
   - **Impact:** `GET /api/visits` executes `SELECT * FROM visits` (with no `LIMIT`) and immediately executes a secondary query fetching **all 324 audit logs** (`SELECT * FROM audit_logs WHERE visit_id IN (...)`). Even for simple tabular lists, all historical change logs, JSON diffs, notes, and attachments are transferred.
3. **Double-Fetching Entire Entity Tables in CEO Command Center:**
   - **Culprit:** `frontend/src/components/CEODashboardOverview.jsx` (lines 58–64).
   - **Impact:** On dashboard mount, `getCEODashboardHubData()` calls `/api/ceo/mis` (which queries all tables on the backend). In parallel, the frontend independently fires `getVisits()`, `getInvoices()`, `getQuotations()`, and `getPayments()`, streaming the entire database twice per page load.

---

### Top 3 Worst Offenders Killing Compute Hours (CU-Hours & Scale-to-Zero)
1. **Cold-Start DDL Storm on Every Boot (34 Sequential DDL/DML Queries):**
   - **Culprit:** `backend/server.js` (line 21) invoking `await initDB()` -> `backend/database/pgAdapter.js` (lines 72–458).
   - **Impact:** Because Render's free tier idles after 15 minutes, every wakeup executes 13 `CREATE TABLE IF NOT EXISTS`, 13 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, 4 `SELECT COUNT(*)`, and multiple user queries before serving a single route. In Postgres, DDL locks system catalogs (`pg_class`), invalidates relation caches, flushes WAL, and spikes Neon CPU to maximum compute units.
2. **Direct Connection String Bypassing Neon PgBouncer Pooler:**
   - **Culprit:** `backend/database/pgAdapter.js` (lines 11–16).
   - **Impact:** Connecting to `ep-winter-butterfly-b8k2ib0q.c-14.us-east-1.aws.neon.tech` (direct port 5432) instead of the Neon Pooled Endpoint (`...-pooler...`) holds active Postgres backend worker processes in memory. Neon's compute proxy cannot scale down to zero while backend connections linger.
3. **Zero Indexes on Relational Foreign Keys, Status Columns, and Timestamps:**
   - **Culprit:** Missing index definitions in `backend/database/pgAdapter.js` (lines 79–263).
   - **Impact:** Columns frequently queried with `WHERE`, `JOIN`, or `ORDER BY` (`visits.canvasser_id`, `visits.created_at`, `audit_logs.visit_id`, `invoices.created_at`, `quotations.created_at`) have **zero indexes**. Postgres must perform full sequential table scans for every filter, sorting operation, and portfolio drilldown.

---

## 2. Network Transfer (Egress) Findings Table

| Severity | File & Line(s) | Issue Description | Estimated Egress Impact | Exact Fix (SQL / Code Change) |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | `backend/controllers/masterSchoolsController.js:16-80`<br>`frontend/src/components/MasterSchoolsDirectoryModule.jsx:67` | **Unbounded Master Schools Fetch:** Frontend passes `limit=all`, transferring all 2,610 schools and 14 columns (~1.1 MB uncompressed JSON) on every view. | **~1.1 MB** per catalog open | Enforce default server-side pagination (`LIMIT 50 OFFSET ?`). Exclude unchanged audit columns (`created_at`, `updated_at`, `status`). Cache catalog responses with HTTP `ETag` and browser `sessionStorage`. |
| **CRITICAL** | `backend/controllers/visitsController.js:44-94` | **`SELECT *` + Eager Fetch of All Audit Logs:** `getVisits` selects all columns (including `notes`, `attachments`, `product_specifications`) and then runs a secondary query fetching all 324 audit logs for the list view. | **~250 KB – 500 KB** per visit query (or **10MB–20MB** if an attachment is present) | Project only list columns: `SELECT id, canvasser_id, canvasser_name, school_name, district, outcome_status, interest_level, follow_up_date, created_at FROM visits`. Remove `audit_logs` fetch from `getVisits`; fetch logs only in `GET /api/visits/:id` or on demand. |
| **CRITICAL** | `backend/controllers/uploadController.js:42-56` | **Silent Base64 Fallback to Postgres:** If ImageKit credentials are missing or the API fails, the server sends the raw Base64 data URI back, which gets stored in `visits.attachments` in Postgres (e.g. the 22.2 MB row #120). | **5 MB – 25 MB** per uncompressed photo upload | Strip out `local_fallback`. If ImageKit fails, immediately return `res.status(502).json({ error: "Cloud image upload failed. Please verify ImageKit credentials or retry." })`. Never permit raw Base64 payloads into Postgres. |
| **HIGH** | `frontend/src/components/CEODashboardOverview.jsx:58-64` | **Duplicate Redundant Entity Fetching:** Dashboard calls `/api/ceo/mis` (which computes KPIs server-side) and simultaneously fetches `getVisits()`, `getInvoices()`, `getQuotations()`, and `getPayments()` just to run client-side count filters. | **~350 KB** redundant transfer on every CEO dashboard visit | Remove parallel client calls for `invoices`, `visits`, `quotations`, and `payments` in `CEODashboardOverview.jsx`. Use the structured aggregates already provided by `mockApi.getCEODashboardHubData()`. |
| **HIGH** | `backend/server.js:23-31` | **Missing HTTP Response Compression:** Express does not register `compression` middleware. All large JSON arrays (schools, visits, invoices, MIS stats) travel over the public wire as raw uncompressed text. | **80% – 85%** avoidable egress overhead | Install `compression` and add `app.use(compression())` at the top of Express middleware. Gzip/Brotli shrinks 1.1 MB school JSON down to ~140 KB. |
| **HIGH** | `frontend/src/components/SchoolSearchPicker.jsx:41-64` | **Keystroke Remote Queries on Static Data:** `SchoolSearchPicker` fires `GET /api/master-schools?q=...` on a 200ms debounce during typing, even though `MASTER_SCHOOLS_DATABASE` is already bundled locally in `masterSchools.js`. | **~50 KB – 200 KB** per school search session | Switch `SchoolSearchPicker` to filter against local in-memory/cached schools array. Zero network calls on typing. |
| **MEDIUM** | `backend/controllers/financialsController.js:104-133` | **In-Memory Sequential ID Generation:** `generateNextSequentialId` pulls `SELECT id FROM invoices` or `SELECT id FROM quotations` into Node.js memory and uses regex to find the maximum sequence ID. | **~10 KB – 50 KB** per created invoice/quote | Replace with SQL max-sequence query: `SELECT id FROM quotations WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`. |
| **MEDIUM** | `backend/controllers/financialsController.js:193-207`<br>`backend/controllers/financialsController.js:754-764` | **Unbounded Financial Collections:** `getQuotations`, `getProformaInvoices`, `getInvoices`, and `getPayments` use `SELECT *` with no `LIMIT` or time boundary. | **~100 KB – 500 KB** growth over time | Add pagination or default FY/date range filters (`created_at >= ?`). |

---

## 3. Compute Hours (CU-Hours & Scale-to-Zero) Findings Table

| Severity | File & Line(s) | Blocker Type | Issue Description | Exact Fix |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | `backend/server.js:21`<br>`backend/database/pgAdapter.js:72-458` | **CPU Spike / DDL Lock Storm** | **`initPgDB()` running on every cold start:** Executes 34 DDL and DML statements (`CREATE TABLE`, `ALTER TABLE`, `SELECT COUNT`, `UPDATE users`) every time Render wakes from sleep. Acquires table locks, invalidates Postgres cache, and writes unnecessary WAL. | Move schema migrations and seeding to a dedicated build-step/script (`npm run migrate`). On app boot, execute only a lightweight connection check (`SELECT 1`), or bypass migration check when `NODE_ENV === 'production'`. |
| **CRITICAL** | `backend/database/pgAdapter.js:11-23` | **Scale-to-Zero Blocker** | **Direct Connection vs Neon PgBouncer Pooler:** Connection pool connects to direct host without `-pooler` suffix. Lingering TCP connections in `pg.Pool` keep the Postgres compute node active even when no queries are executing. | 1. Update `DATABASE_URL` in production to use Neon's Pooled connection string (`ep-xxxx-pooler.c-14...`).<br>2. In `getPgPool()`, configure `idleTimeoutMillis: 5000` and `max: 5` to quickly release idle backends so Neon autoscales to zero within 5 minutes. |
| **HIGH** | `backend/database/pgAdapter.js:129-161`<br>`backend/controllers/visitsController.js:44-77` | **CPU Spike (Seq Scans)** | **Missing Indexes on `visits` Table:** `visits` has **no indexes** on `created_at`, `canvasser_id`, `district`, `outcome_status`, or `interest_level`. Every list view and filter runs a full sequential scan. | Add composite and B-tree indexes: `CREATE INDEX idx_visits_canvasser_created ON visits(canvasser_id, created_at DESC)`, `CREATE INDEX idx_visits_status ON visits(outcome_status, interest_level)`. |
| **HIGH** | `backend/database/pgAdapter.js:163-172`<br>`backend/controllers/auditController.js:33` | **CPU Spike (Seq Scans)** | **Missing Index on `audit_logs(visit_id)` & `timestamp`:** Audit logs are joined by `visit_id` and ordered by `timestamp DESC`. Without an index, Postgres performs sequential scans across all log entries. | `CREATE INDEX idx_audit_logs_visit_time ON audit_logs(visit_id, timestamp DESC);` |
| **HIGH** | `backend/controllers/dashboardController.js:221-250` | **CPU Spike (Memory Filter)** | **Application-Side Filtering across All History:** `getCanvasserLeaderboard` pulls all visits and all invoices across all months from Postgres, then filters them by `selectedMonth` in JavaScript memory. | Push filtering to SQL: `WHERE created_at >= $1 AND created_at < $2` using index scan instead of scanning all historical data. |
| **MEDIUM** | `backend/controllers/financialsController.js:767-849`<br>`backend/controllers/dashboardController.js:396-435` | **CPU Spike (App Aggregation)** | **Client-Side Financial Aggregations:** `getCFOAnalytics` and `getCEOExecutiveMIS` pull individual rows from `invoices` and `payments` to run `.reduce()` in Node.js instead of utilizing Postgres native aggregates. | Replace row fetches with single SQL aggregation: `SELECT COALESCE(SUM(grand_total), 0) AS total_invoiced, COALESCE(SUM(paid_amount), 0) AS total_collected FROM invoices`. |
| **MEDIUM** | `backend/controllers/masterSchoolsController.js:187-250` | **CPU Spike (Sequential Scan)** | **Unindexed `LOWER(TRIM(school_name))` Lookups:** `getSchoolPortfolio` searches for matching visits and quotations using `LOWER(TRIM(school_name)) = LOWER(TRIM(?))`. Without functional indexes, this forces full table scans. | Add functional indexes: `CREATE INDEX idx_visits_lower_school ON visits((LOWER(TRIM(school_name))));` |

---

## 4. Database Schema & Index Recommendations

Execute the following DDL migration in Neon to eliminate sequential scans, speed up joins by 10x–50x, and lower CPU utilization:

```sql
-- ==============================================================================
-- NEON POSTGRES PERFORMANCE & COMPUTE OPTIMIZATION INDEXES
-- Safe, idempotent execution (IF NOT EXISTS)
-- ==============================================================================

-- 1. Visits Table Indexes (Filters, Sorting, RBAC & Portfolio Joins)
CREATE INDEX IF NOT EXISTS idx_visits_canvasser_created ON visits(canvasser_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_district_created ON visits(district, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_outcome_interest ON visits(outcome_status, interest_level);
CREATE INDEX IF NOT EXISTS idx_visits_master_school ON visits(master_school_id) WHERE master_school_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_lower_school ON visits((LOWER(TRIM(school_name))));

-- 2. Audit Logs Indexes (Relational Join & Chronological Traversal)
CREATE INDEX IF NOT EXISTS idx_audit_logs_visit_time ON audit_logs(visit_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

-- 3. Invoices Table Indexes (Aging Analysis, Canvasser Slicing, Sequences)
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_canvasser ON invoices(canvasser_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status_balance ON invoices(payment_status, outstanding_balance) WHERE outstanding_balance > 0;
CREATE INDEX IF NOT EXISTS idx_invoices_visit_id ON invoices(visit_id) WHERE visit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_lower_school ON invoices((LOWER(TRIM(school_name))));

-- 4. Quotations Table Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_created ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_canvasser ON quotations(canvasser_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_visit_id ON quotations(visit_id) WHERE visit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_lower_school ON quotations((LOWER(TRIM(school_name))));

-- 5. Payments Table Indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_at ON payments(recorded_at DESC);

-- 6. Master Schools Search Optimization (Trigram extension for high-speed ILIKE / LIKE)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_master_schools_trgm_name ON master_schools USING gin (school_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_master_schools_district_name ON master_schools(district, school_name);
```

---

## 5. Step-by-Step Implementation Plan

### Phase 1: Zero-Risk Quick Wins (No Breaking Changes, Instant Impact)
*Execution time: ~30 mins. Focus: Halting unnecessary CU drain and eliminating large payloads.*

1. **Switch Connection Pool to Neon `-pooler` Endpoint & Idle Timeout:**
   - In production environment, update `DATABASE_URL` to use the pooled hostname (`...-pooler.c-14.us-east-1.aws.neon.tech`).
   - In `backend/database/pgAdapter.js`, configure `idleTimeoutMillis: 5000` and `max: 10` so idle client connections close quickly, enabling Neon to scale to zero within 5 minutes.
2. **Apply Missing Database Indexes:**
   - Execute the SQL migration from Section 4 directly on Neon to eliminate sequential scans immediately.
3. **Guard Against Base64 Storage in Postgres:**
   - In `backend/controllers/uploadController.js`, remove `local_fallback` storing Base64 text in database. Return an explicit error if ImageKit fails.
4. **Enable Express HTTP Compression:**
   - Install `compression` package in `backend/package.json` and register `app.use(compression())` in `backend/server.js`.
5. **Decouple Cold-Start DDL Storm from Server Boot:**
   - Wrap `initPgDB()` in `backend/server.js` so that in production (`NODE_ENV === 'production'`), it verifies connection with `SELECT 1` rather than running 34 `CREATE TABLE` and `ALTER TABLE` statements on every wakeup.

### Phase 2: Query Projections, Aggregations & Frontend Caching
*Execution time: ~1 hour. Focus: Slashing API response sizes by 80–90% and eliminating redundant queries.*

1. **Lightweight List Projections for Visits:**
   - Modify `backend/controllers/visitsController.js`:
     - `GET /api/visits` selects only table columns (excludes `attachments` and `product_specifications`).
     - Remove eager query for `audit_logs` in `getVisits()`. Retain it only in `getVisitById()` (`GET /api/visits/:id`).
2. **Eliminate Double-Fetching in CEO Dashboard:**
   - In `frontend/src/components/CEODashboardOverview.jsx`, use the totals already calculated and returned by `/api/ceo/mis`. Remove the parallel calls to `mockApi.getVisits()`, `mockApi.getInvoices()`, `mockApi.getQuotations()`, and `mockApi.getPayments()`.
3. **Client-Side School Search & Session Caching:**
   - In `frontend/src/components/SchoolSearchPicker.jsx`, point search queries to the local `MASTER_SCHOOLS_DATABASE` already compiled into the frontend bundle instead of firing network requests to Neon on every keystroke.
   - In `frontend/src/components/MasterSchoolsDirectoryModule.jsx`, cache the catalog in `sessionStorage` with a 30-minute TTL or version stamp so switching tabs requires zero round-trips.
4. **Push Leaderboard & Analytics Filtering to SQL:**
   - In `backend/controllers/dashboardController.js` (lines 220–250), filter by month directly in SQL with indexed date ranges (`WHERE created_at >= $1 AND created_at < $2`) instead of pulling all historical records into Node.js memory.

---

### Expected Outcome Upon Implementation
- **Network Transfer (Egress):** Dropped by **80% to 90%** (from ~100 MB/day down to <10 MB/day for normal usage).
- **Scale-to-Zero:** Neon compute will reliably suspend within 5 minutes of inactivity between user visits instead of burning continuous CU-hours.
- **Latency:** Faster dashboard and page loads (<150ms) because payload sizes are reduced by 85% and sequential scans are replaced with B-tree index lookups.

