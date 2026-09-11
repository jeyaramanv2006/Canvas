# Architectural and Technical Decisions

## Approved Decisions

### DEC-001: Client-Server Architecture with React & Tailwind CSS
- **Status**: CONFIRMED
- **Context**: Mobile-first field canvassing requires a fast, responsive UI for field workers and clear dashboard visualizations for managers.
- **Decision**: Build frontend using HTML, Tailwind CSS, and React, backed by a REST API server.
- **Rationale**: React enables dynamic single-screen form state and chart rendering; Tailwind provides rapid, mobile-friendly responsive design.

### DEC-002: Relational Two-Table Database Schema
- **Status**: CONFIRMED
- **Context**: System needs clear relationships between field staff and their school visits.
- **Decision**: Implement two relational tables (`Users` and `Visits`) linked by `canvasser_id` foreign key.
- **Rationale**: Simple, clean, and easily queryable for aggregate manager analytics.

### DEC-003: JWT Authentication with Role-Based Scoping & Full CRUD
- **Status**: CONFIRMED
- **Context**: Canvassers manage their own field records (create, read, edit, delete). Managers require a high-level command center with full visibility, analytics, editing authority, and CSV export over all field records.
- **Decision**: Issue signed JWT tokens on login. Canvassers are scoped to their own logs with edit/delete rights; Managers have global view and edit/delete permissions over all records.
- **Rationale**: Empowers canvassers to maintain accurate logs while granting management full operational oversight.

### DEC-004: Two-Role RBAC Model with Layer-Based Access Scoping
- **Status**: CONFIRMED
- **Context**: The client established a 2-role architecture where:
  1. **Admin / Leadership Role**: Covers **L1 through L3 (Executive, Commercial, Finance, Marketing Manager)**. Sees full management financials, strategy metrics, revenue, EBITDA, cash flow, receivables/payables, and campaign ROI.
  2. **Field Canvasser Role**: Covers **L4 (Sales / Field Canvassing & Execution)**. Sees field leads, school visits, orders won, conversion %, and competitive field leaderboard. Top-level corporate financials (EBITDA, Gross Profit %, Cash Position) are strictly masked.
- **Decision**: Enforce this 2-role model with layer scoping in `src/lib/rbac.js`.
- **Rationale**: Keeps user management simple with 2 concrete roles while enforcing the client's exact data visibility and financial masking rules.

### DEC-005: Canvasser Scope Refinement & Competitive Field Leaderboard
- **Status**: CONFIRMED
- **Context**: Client clarified that field canvassers should not have access to Invoicing or Marketing tabs. Invoicing, price negotiation with school principals, and quotation dispatch are centralized with the Admin. Canvassers need a competitive motivator to see team performance and invoiced value generated.
- **Decision**:
  1. Remove Invoicing and Marketing tabs/actions completely from the Canvasser dashboard.
  2. Implement a dedicated, read-only **Canvasser Leaderboard** (`CanvasserLeaderboard.jsx`) that displays all canvassers ranked by Total Invoiced Value Generated (₹), Total School Visits, and Won Deals.
  3. Ensure aggregate numbers are rendered without exposing confidential school-specific pricing or competitor client data.
  4. Attribute all Admin-generated quotations and invoices to the originating field canvasser (`canvasser_id`), automatically updating the leaderboard.
- **Rationale**: Preserves administrative control over company billing and margins while fueling field team competition and gamification.

### DEC-006: Institutional Master School Database & Search-First Canvasser Entry with Discovery Tracking
- **Status**: CONFIRMED
- **Context**: Canvassers need rapid access to verified school information across all target districts in Tamil Nadu to avoid manual typos and duplicate records, while retaining the flexibility to log visits to new, uncataloged institutions discovered in the field. Admin needs to monitor which visits come from pre-cataloged institutions vs newly discovered leads for master database maintenance.
- **Decision**:
  1. Create a curated Institutional Master Database (`masterSchools.js` / `MasterSchools` table) seeded with verified school records across all Tamil Nadu districts.
  2. Implement `<SchoolSearchPicker.jsx>` enabling instant fuzzy search across School Name, District, and Block/Cluster with auto-fill of institution metadata.
  3. Support seamless fallback to manual custom entry for unlisted schools.
  4. Track database origin (`is_from_master_db: true/false`, `master_school_id`) on all visit records.
  5. Provide visual origin badges (`🏛️ Master DB School` vs `🆕 Newly Discovered`) and origin filtering in both Canvasser feeds and Admin Central Visit Registry.
### DEC-007: Canvasser Workflow Simplification, Restricted Statuses, Specifications/Photo Logging, and Tiered Commission Slabs (1% - 5%)
- **Status**: CONFIRMED
- **Context**: Client established the exact field-to-invoice workflow:
  1. Canvasser visits school, selects from master DB (or enters unlisted), inputs contact/strength, selects product interests, types custom product specifications notes (GSM, material, sample requests), attaches sample photos/images, sets follow-up (or None), and selects outcome strictly from `[Open, Sample Sent, Not Interested]`.
  2. Admin views all visit logs with full audit trail history (who changed what and when), contacts principals, and generates Quotations/Tax Invoices directly from the catalog.
  3. Once order is confirmed, Admin generates invoice and credits canvasser sales (visit outcome updates to `Won`), automatically applying tiered commission slabs (1% to 5%).
  4. Real-time Leaderboard with commission tier badges, commission earnings, and progress bars.
  5. Complete removal of Marketing Hub section for both canvassers and admins.
- **Decision**:
  1. Restrict canvasser status selection to `Open`, `Sample Sent`, `Not Interested`. `Quote Given`, `Won`, and `Lost` are managed exclusively by Admin.
  2. Add `product_specifications` and `attachments` to visit schema and forms.
  3. Support flexible follow-up (date picker or "No Follow-up Needed").
  4. Implement commission slab tiers in `mockApi.js`:
     - 1-5L: 1%
     - 5-10L: 2%
     - 10-15L: 3%
     - 15-20L: 4%
     - >20L: 5% Max
  5. Display commission slab badges, commission earned (₹), and slab progress bar on the Leaderboard and Canvasser KPI cards.
  6. Remove Marketing Hub section completely from Canvasser and Admin interfaces.
- **Rationale**: Exactly aligns with the client's operational hierarchy, incentivizes field sales through transparent tier upgrades, and streamlines CRM data entry.

### DEC-008: Flexible Client Line Items, Removal of Fixed Product Master, and Standardized Watermark Document Printing
- **Status**: CONFIRMED
- **Context**: CEO stated that there is no fixed product catalog because apparel offerings, sizes, fabrics, and pricing are fully tailored per client institution. Quotations and invoices require custom line items rather than being locked to a rigid catalog. Additionally, printable invoices and quotations must strictly follow the official Murugan Enterprises format with full GSTIN, PAN, bank/terms details, itemized HSN breakdown, and a centered background watermark logo.
- **Decision**:
  1. Remove the "Product Master" tab and hardcoded catalog maintenance from the Invoicing Suite.
  2. Implement a dynamic line-item builder allowing arbitrary items, custom descriptions, HSN codes, sizes, units, quantities, unit rates, and GST rates for both Quotations and Invoices.
  3. Standardize printable document previews (`InvoiceDocumentModal.jsx`) to feature Murugan Enterprises corporate header, official bank details (for Invoices) or 5-point terms & conditions (for Quotations), itemized calculation breakdowns, and a centered background watermark logo (`/assets/murugan_logo.png`) that renders cleanly across screen previews and A4 printouts.
  4. Fix document modal prop bindings and data normalization so all "View" and "Convert" actions work reliably.
### DEC-009: Strict User Directory Governance, CEO Approval Queue, Account Lifecycle (Active/Paused/Deleted), and Immediate Password Reset
- **Status**: CONFIRMED
- **Context**: Access to the User Directory is strictly restricted to **CEO** and **Admin Executive**. System provision accounts using strict `<name>@<role>` username convention (e.g. `murugan@cvs`, `sudhan@ceo`, `admin@admin`). Admin actions (Create user, Delete user, Pause user, Resume user, Edit user role) must be routed to the CEO as approval requests for review (Accept/Reject). Admin cannot perform any of these actions on the CEO account. CEO actions execute immediately. Admin and CEO can trigger instant Password Reset for users without CEO approval queue, prompting users with a mandatory reset modal upon login. When users are deleted, historical visit progress and invoicing records remain preserved in the dataset while disabling login.
- **Decision**:
  1. Restrict User Directory access exclusively to CEO (`CEODashboard.jsx`) and Admin Executive (`ManagerDashboard.jsx`).
  2. Implement full account state tracking: `ACTIVE`, `PAUSED` (temporarily pauses login, progress preserved, resumable), and `DELETED` (login permanently disabled, progress completely preserved).
  3. Enforce CEO Approval Queue for all Admin-initiated user provisioning, role changes, pause, resume, and deletion actions.
  4. Allow Admin to dispatch instant Password Resets without CEO approval.
  5. Provide `ForcePasswordResetModal.jsx` prompting flagged users to enter a new password upon login.
  6. Enforce strict `<name>@<role>` username generation and role synchronization.
- **Rationale**: Establishes enterprise-grade role governance, protects data integrity and field progress, and ensures secure credential delegation.

### DEC-010: Master Schools Database Governance, CEO Approval Queue, SQLite Persistence & RFC 4180 CSV Export
- **Status**: CONFIRMED
- **Context**: The master school database is backed by a relational SQLite backend (`master_schools` table) and accessible by both **CEO** and **Admin**. Both roles have full permissions to add new schools, edit existing school metadata, and delete schools. CEO modifications execute immediately in the database. Admin modifications are submitted as structured pending requests (`SCHOOL_CREATE`, `SCHOOL_EDIT`, `SCHOOL_DELETE`) into the CEO approval queue (`pending_user_actions` table / `PendingApprovalsDrawer.jsx`) requiring CEO acceptance before affecting the database. The database must support on-demand, standard RFC 4180 CSV export for reports and offline analysis.
- **Decision**:
  1. Maintain SQLite relational persistence for master schools with schema: `id`, `code`, `school_name`, `district`, `block_cluster`, `zone`, `board`, `area`, `contact_person`, `phone`, `email`, `student_strength`, `created_at`, `updated_at`.
  2. Implement backend endpoint `GET /api/master-schools/export` that generates and streams clean RFC 4180 CSV with escaped quotes, headers, and standard filename (`master_schools_catalog.csv`).
  3. Route Admin school mutations (Add, Edit, Delete) to the CEO approval queue, executing directly only upon CEO acceptance.
  4. Provide full interactive management UI in both CEO (`CEODashboard.jsx`) and Admin (`ManagerDashboard.jsx`) dashboards with real-time statistics, search, district filters, creation modal, edit modal, deletion confirmation, and one-click CSV export.
- **Rationale**: Guarantees data accuracy and integrity across statewide institutional data while giving leadership complete governance over catalog expansions.

### DEC-011: Immediate Production Deployment Path — Vercel, Railway, and Single-Instance Persistent SQLite
- **Status**: CONFIRMED
- **Context**: The client requires an immediate usable release for recording real canvassing activity and issuing invoices. The existing codebase already implements an Express API with SQLite, but the React frontend is currently driven by browser-local mock data and is not connected to the API.
- **Decision**:
  1. Deploy the React/Vite frontend to Vercel and the Express API to Railway.
  2. First replace mock-driven live workflows with authenticated API calls and make the backend the sole authoritative source for business records.
  3. Use the current SQLite implementation as an interim production database on a Railway persistent volume at a configurable path (target: `/data/canvas.db`).
  4. Run exactly one Railway API replica while SQLite is the production datastore, and establish tested backups and restart-persistence checks before users enter real records.
  5. Keep a PostgreSQL migration outside this immediate release; revisit it before multi-instance scaling or when production reliability requirements exceed a single persistent SQLite instance.
- **Rationale**: This enables an urgent, controlled launch without presenting mock/local browser data as real records, while keeping a clear path to a managed relational database as operational needs grow.

---

## Decisions Required / Unresolved Questions

### DEC-REQ-001: Backend Runtime & API Framework Choice
- **Status**: RESOLVED — see DEC-011
- **Decision**: Continue with the implemented Node.js + Express backend for the immediate deployment path.

### DEC-REQ-002: Relational Database Engine Choice
- **Status**: RESOLVED FOR IMMEDIATE RELEASE — see DEC-011
- **Decision**: Use persistent single-instance SQLite on Railway for the immediate release. PostgreSQL remains a deliberate future migration option, not an unresolved blocker for this release.
