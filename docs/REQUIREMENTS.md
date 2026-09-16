# Requirements

## Functional Requirements

### Five-Tier Enterprise Role Model with Layer Access Scoping
- **Chief Executive Officer (`ceo`)**:
  - Layers Covered: **Global Command across L1 (Executive) through L4 (Field Operations)**.
  - Primary KPIs: Total Sales, Gross Profit, GP %, Collections, Overdue Receivables.
  - Capabilities: Unrestricted access to all dashboards, financials, operational data, school directories, user governance, and final approval/rejection of queued administrative mutations.
- **Chief Financial Officer (`cfo`)**:
  - Layers Covered: **L1 & L2 (Executive Financials & Treasury)**.
  - Primary KPIs: Revenue, Gross Profit, GP %, Collection Rate, Receivables Aging.
  - Capabilities: Full financial reports, P&L, cash flow tracking, invoice auditing, and pricing oversight.
- **Chief Coordinating Officer (`cco`)**:
  - Layers Covered: **L2 & L3 (Executive Operations & Field Coordination)**.
  - Primary KPIs: Total School Visits, Conversion Rate (Visits → Won), Orders Won, Sales Generated, Active Canvassers.
  - Capabilities: Operational performance oversight, canvasser activity tracking, and team coordination.
- **Admin Executive (`admin_exec` / `admin`)**:
  - Layers Covered: **L3 (Data Management, Commercial Invoicing & Operational Support)**.
  - Primary KPIs: Total Field Visits, Open Leads, Samples Sent, Orders Won, Active Field Team.
  - Capabilities: Full read/write/edit/delete authority across all visit logs with immutable audit trails, custom line-item Quotation and Tax Invoice generation (`INV-2026-XXX`), payment recording, and submission of user and master school actions to CEO approval queue.
- **Canvasser (`canvasser` / `cvs`)**:
  - Layers Covered: **L4 (Sales / Field Canvassing & Execution)**.
  - Primary KPIs: School Visits Logged, Orders Won, Invoiced Sales Credited (₹), Commission Earned (₹), Active Slab Tier, Leaderboard Rank.
  - Capabilities: Search-first school visit logging with unlisted fallback, fabric specifications notes, sample photo attachments, scoped "My Visits" feed, and multi-criteria gamified leaderboard. Top-level executive corporate financials are strictly masked.

### Dynamic Role KPI Dashboards
- Render Primary KPIs tailored for the logged-in user:
  - CEO and CFO see executive management financials (Sales, Gross Profit, Margin %, Receivables, Collections).
  - CCO and Admin see operational and team conversion metrics (Visits, Leads, Orders Won, Conversion %).
  - Canvassers see field performance (Visits, Orders Won, Invoices Credited, Commission Earned, Tier Progress, Rank).

### Authentication & Authorization
- Every user authenticates with username in format `<name>@<role>` (or email) and password.
- Passwords stored as secure cryptographic hashes using `bcrypt` (10 rounds).
- Authentication returns signed 7-day JWT with user ID, username, name, and role.
- Standard default user accounts:
  - CEO: `sudhan@ceo` (password: `password`)
  - CFO: `abhishek@cfo` (password: `password`)
  - CCO: `varshini@cco` (password: `password`)
  - Admin: `admin@admin` (password: `password`)
  - Canvassers: `murugan@cvs`, `gokul@cvs` (password: `password`)

### Field Operations & Master School Directory
- **Institutional Master Database Search**: Canvassers search by School Name, District, or Block/Cluster across the pre-cataloged master directory of verified schools across Tamil Nadu.
- **Auto-Population**: Selecting a school from the master database automatically populates `school_name`, `district`, `institution_type` (Board), and links `master_school_id`.
- **Custom Unlisted School Entry**: If a school is not present in the master directory, canvassers can switch to manual entry and type the custom school name and district (flagged as `🆕 Newly Discovered`).
- **Product Specifications & Principal Requirements**: Dedicated input field for canvassers to capture fabric GSM, yarn specifications, custom school crest embossing, double-ribbed socks, buckle designs, and principal feedback.
- **Sample Photos & Reference Images**: Canvassers can attach sample product photos (e.g. previous uniform/sock samples shown by the principal) with full lightbox modal preview.
- **Flexible Next Action Follow-Up**: Canvassers can set a specific date or toggle "No Follow-up Needed / None".
- **Restricted Canvasser Deal Statuses**: Canvassers can only choose from `Open`, `Sample Sent`, or `Not Interested`. Statuses `Quote Given`, `Won`, and `Lost` are strictly managed by Admin upon commercial negotiation.
- **My Visits List & Lightbox**: Canvassers view, search, and filter their own visits with specifications notes, photo thumbnails, and full-screen image lightboxes.
- **Edit & Delete Visit**: Canvassers can edit notes, specifications, photos, and delete their own logged visits.

### Commission Slab, Per-Invoice Pay & Competitive Leaderboard Requirements
- **Standard Monthly Commission Slabs**:
  - Applied to monthly net realized sales attributed to the canvasser:
    - `₹0 – ₹99,999`: **2.00%**
    - `₹1,00,000 – ₹2,49,999`: **2.50%**
    - `₹2,50,000 – ₹4,99,999`: **3.00%**
    - `₹5,00,000 – ₹7,49,999`: **3.50%**
    - `₹7,50,000 – ₹9,99,999`: **4.00%**
    - `₹10,00,000 – ₹14,99,999`: **4.50%**
    - `₹15,00,000 – ₹24,99,999`: **5.00%**
    - `₹25,00,000 and above`: **5.50%**
- **Monthly Performance Incentive (Tiered Volume Bonus)**:
  - `₹5L+`: **+₹2,000** | `₹7.5L+`: **+₹4,000** | `₹10L+`: **+₹7,500** | `₹15L+`: **+₹12,500** | `₹20L+`: **+₹20,000** | `₹25L+`: **+₹30,000**
- **New School Acquisition Incentive**:
  - **₹1,000** bonus per converted newly acquired school account.
- **Monthly Settlement Cycle**:
  - Payout is calculated across base commission, volume incentives, and new school bonuses, finalized and credited on the **1st of every month**.
- **Multi-Criteria Dynamic Leaderboard Sorting**:
  - The leaderboard provides interactive sorting and ranking across:
    1. **Pay Earned (₹)**: Highest to lowest pay earned (or ascending).
    2. **Schools Canvassed**: Number of schools visited/canvassed.
    3. **Invoices Converted**: Number of confirmed invoices won.
    4. **Total Invoiced Value (₹)**: Cumulative revenue billed.
    5. **Conversion Rate (%)**: Percentage of visited schools that converted to invoices.
    6. **Average Deal Size (₹)**: Average revenue per converted invoice.
  - Interactive direction toggle (`Highest First / Descending` vs `Lowest First / Ascending`).
- **Itemized Invoice Pay Breakdown Drawer**:
  - Allows inspecting each individual converted invoice for a canvasser with invoice ID, school name, date, invoice value (₹), applied slab rate (%), pay earned (₹), and payment status.
- **Gamified Performance Ranking & Progress**:
  - Dynamic rank badges (`#1 🏆 Top Earner`, `#2 🥈 Senior Canvasser`, `#3 🥉 Field Canvasser`).
  - Interactive upgrade progress bar indicating distance to level up to the next slab percentage tier.

### Invoicing & Commercial Pipeline
- **Dynamic Quotation Generation**: Admin creates formal Sales Quotations with custom line items, sizes, rates, and GST calculations; auto-links to visits.
- **Tax Invoices & Order Attribution**: Admin generates itemized Tax Invoices (`INV-2026-XXX`), calculates GST (18% default), marks the visit as `Won`, and attributes the invoice to the originating Canvasser (`canvasser_id`), automatically computing their commission slab.
- **Printable Watermark Document Rendering**: Previews and prints official A4 documents with Murugan Enterprises corporate header, official bank details / terms & conditions, and centered background watermark logo.
- **Payment Tracking**: Log partial and full payment collections with payment modes (NEFT, UPI, Cheque, Cash) and reference IDs, updating pending balances dynamically.
- **Marketing Hub Removal**: The Marketing Hub section is completely removed from both Canvasser and Admin interfaces.

### Visit Audit Trail & Change History Requirements
- **Edit Tracking**: Whenever a visit record is updated, record the editor's identity (`last_edited_by_name`, `last_edited_by_role`) and timestamp (`last_edited_at`).
- **Field-Level Diffing**: Automatically calculate specific field changes and store them in an append-only `edit_history` audit array and central `audit_logs` table.
- **Audit Timeline Viewer**: Inspect the complete revision timeline of any visit log via an interactive modal (`EditHistoryModal.jsx`).

### User Directory, Role Governance & Lifecycle Requirements
- **Access Authorization**:
  - Exclusive access for **CEO** (`CEODashboard.jsx`) and **Admin Executive** (`ManagerDashboard.jsx`).
  - Blocked for all other roles (`cfo`, `cco`, `canvasser`).
- **Account State & Lifecycle**:
  - `ACTIVE`: Normal platform access.
  - `PAUSED`: Temporarily disables login while preserving all visit logs, quotations, invoices, and progress. Can be resumed anytime.
  - `DELETED`: Permanently disables login. All historical progress, sales attribution, commission earnings, and visit history remain preserved in the dataset and visible with a `DELETED` badge.
- **Username Standards**:
  - Strict format `<name>@<role>` (e.g., `murugan@cvs`, `sudhan@ceo`, `admin@admin`, `abhishek@cfo`, `varshini@cco`).
  - Automatically synchronizes username upon role modification.
- **CEO Approval Queue**:
  - Admin actions (Add User, Edit Role, Pause User, Resume User, Delete User) are submitted as pending requests to the CEO.
  - CEO can Approve or Reject requests.
  - CEO account is protected (non-CEO actors cannot edit, pause, delete, or reset CEO).
- **Password Reset Flow**:
  - Admin and CEO can trigger instant Password Resets for any user without CEO approval queue.
  - Flagged users receive an interactive prompt modal (`ForcePasswordResetModal.jsx`) upon login to enter and confirm their new password.

### Master Schools Database & Statewide Catalog Requirements
- **Relational Persistence**:
  - Full relational persistence in SQLite (`master_schools` table) with fields: `id`, `school_name`, `district`, `block_or_cluster`, `zone`, `board`, `area`, `student_strength`, `contact_person`, `phone`, `priority`, `status`, `created_at`, `updated_at`.
- **CEO & Admin Access**:
  - Available as a dedicated workspace module in both **CEO Dashboard** (`CEODashboard.jsx`) and **Admin Executive Dashboard** (`ManagerDashboard.jsx`).
- **Dedicated Student Strength Column & Unknown Handling**:
  - Rendered in a dedicated separate column between `Board` and `Contact Info`.
  - When student strength, contact person, or phone number is unknown / null / empty, it displays as a clean dash `—` in the table and `-` in CSV export.
  - When strength is populated, it displays with an amber numerical badge.
- **Field Canvassing Strength & Contact Details Auto-Sync**:
  - When canvassers log new school visits or update existing visits with student strength, contact person name, and phone number in the field, all values automatically reflect and synchronize in the `master_schools` database record (matched by `master_school_id` or `school_name` & `district`).
- **Governance & Approval Routing**:
  - **CEO**: Directly adds new schools, edits existing school records, and deletes schools with instantaneous SQLite database updates.
  - **Admin**: Adds, edits, or deletes schools by dispatching structured action requests (`SCHOOL_CREATE`, `SCHOOL_EDIT`, `SCHOOL_DELETE`) to the CEO approval queue (`pending_user_actions` table / `PendingApprovalsDrawer.jsx`).
  - **CEO Decision**: Approving an action executes the mutation immediately in the database; rejecting marks the request as rejected without modifying the catalog.
- **RFC 4180 CSV Data Export**:
  - Endpoint `GET /api/master-schools/export` streams clean RFC 4180 CSV data with proper quotation escaping, custom column headers, and attachment download disposition (`master_schools_catalog.csv`).
  - Unknown student strengths, contact persons, and phone numbers are exported as `"-"`.
  - Frontend provides a prominent "Export Database (CSV)" button for instant single-click export.

## Non-Functional Requirements
- **Mobile-First UX**: Optimized touch targets and responsive UI for smartphones and desktop command rooms.
- **Data Security**: Secure token-based validation and role-based permissions scoping.
- **Performance**: Instant data persistence and fast client-side calculations.

## Confirmed Requirements
- `<name>@<role>` username login with 5-tier RBAC (CEO, CFO, CCO, Admin Executive, Canvasser).
- Master School Database search with unlisted custom fallback.
- Master School Database management with CEO direct execution, Admin CEO approval queue, and RFC 4180 CSV export.
- Product Specifications notes and Sample Photo attachments.
- Canvasser outcome status restricted to `Open`, `Sample Sent`, `Not Interested`.
- Flexible follow-up (Date or None).
- Admin management of custom Quotes, Invoices, Status updates to `Won`/`Lost`, and Canvasser attribution.
- 8-Tier Monthly Commission Slab structure (2.00% to 5.50%), Volume Bonus Tiers, and 1st-of-month settlement cycle.
- Immutable visit audit trail with diff logging.
- Removal of Marketing Hub from active workflows.
