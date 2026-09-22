# Changelog

## [0.15.4] - CFO Dashboard Live Database Synchronization & Dynamic Telemetry Wiring

- **Live Database Telemetry Integration** (`CFODashboard.jsx` & `mockApi.js`):
  - Wired CFO Strategy Overview directly to live PostgreSQL/Neon data via `mockApi.getCFOAnalytics()` with live call to `/api/cfo/analytics` and client-side fallback aggregation from `getInvoices()`, `getPayments()`, and `getQuotations()`.
  - Added interactive **"Sync Live Data"** refresh button in the strategy sub-header with spinning feedback during queries.
  - Linked **Report 1 (Sales Trend)** to dynamically calculated monthly revenue from live invoices.
  - Linked **Report 2 (Gross Profit Trend)** to live billed revenue with transparent 66% modeled COGS formula.
  - Linked **Report 3 (Collection vs Sales)** to real cash receipts and total billed invoice revenue, dynamically updating the collection rate.
  - Linked **Report 4 (Receivables / Overdue)** to live aging brackets (0-30d, 31-60d, 61-90d, 90+d), total outstanding balance, and overdue account counts.
  - Linked **Report 7 (This Month vs Last Month)** table to dynamically reflect live month-to-date metrics across Sales, Gross Profit, GP%, Collections, Receivables, and Overdue.
  - Linked **Report 8 (Actual vs Target)** table to dynamically evaluate targets against live actuals, computing real achievement percentages and gaps.
  - Linked **Executive Red Alert Drawer** to live overdue balances, overdue institution counts, and real collection percentage.
- **Data Source Integrity Preservation**:
  - Maintained explicit amber `FABRICATED MODEL` badges and concrete formula boxes for modeled benchmark projections (COGS, warehouse inventory, cash out).
  - Maintained emerald `LIVE DB LOGIC` badges for all metrics derived from real database records.

## [0.15.3] - CFO Dashboard Preview Removal, Data Classification & In-Dashboard Formulas

- **CFO Construction Preview Veil Removed** (`CFODashboard.jsx`):
  - Completely removed the "Under Active Construction" overlay shield, developer preview unlock toggle, floating re-lock buttons, and blurring restrictions.
  - The 8-report strategic MIS suite and hierarchical financial drilldown audit engine are now immediately active, crisp, and interactive upon opening the CFO dashboard.
- **Data Source Transparency & In-Dashboard Formula Annotations**:
  - Added the top **Data Integrity Breakdown** bar distinguishing verified database calculations from modeled benchmark projections.
  - Classified every CFO report with explicit visual badges (`FABRICATED MODEL`, `LIVE DB LOGIC`, `MATHEMATICAL AUDIT`, `CALCULATED METRIC`).
  - Added dedicated monospace formula callout boxes directly on all 8 report cards:
    - **Report 1 (Sales Trend)**: `Formula: MoM Growth % = ((Sales_Jun - Sales_May) / Sales_May) × 100 • 6M Curve is Modeled Benchmark`
    - **Report 2 (Gross Profit Trend)**: `Formula: COGS = Sales × 66% • GP = Sales - COGS • GP % = (GP / Sales) × 100 = 34.4%`
    - **Report 3 (Collection vs Sales)**: `Formula: Collection Rate % = (Realized Cash Collections / Total Billed Sales) × 100 = 71.9%`
    - **Report 4 (Receivables / Overdue)**: `Formula: Age = ⌊(Now - Invoice_Date) / 86,400,000⌋ • Receivables = Σ(Total - Paid) • Overdue = Σ(Age > 30d)`
    - **Report 5 (Inventory Value)**: `Formula: Valuation = Σ(Warehouse Batch Qty × Standard Cost) [Yarn 40%, Finished 38%, WIP 15%, Trims 7%]`
    - **Report 6 (Cash Flow Trend)**: `Formula: Net Cash Flow = Total Inflows (Collections + Advances) - Total Outflows (Payables + Factory Opex + Comm + Freight)`
    - **Report 7 (This Month vs Last Month)**: `Formula: Absolute Δ = (Value_Jun - Value_May) • % Change = (Δ / Value_May) × 100 • Margin Δ = pp`
    - **Report 8 (Actual vs Target)**: `Formula: Achievement % = (Actual / Target) × 100 • Gap = Actual - Target • Overdue On-Track if Actual ≤ Target`
- **Drilldown Modal Formula Context** (`FinancialDrilldownModal.jsx`):
  - Added dynamic calculation formula badges in the drilldown calculation trail bar.
- **Documentation**:
  - Created `docs/CFO_DASHBOARD_FORMULAS.md` containing the complete classification matrix, variable definitions, and step-by-step arithmetic proofs.

## [0.15.2] - Visible Fabricated Badges & In-Dashboard Mathematical Formula Annotations

- **Explicit "Fabricated" vs "Live DB" Badging**:
  - Added visible `FABRICATED` (amber) vs `LIVE DB` (emerald) pill badges directly onto all dashboard KPI cards and sections.
  - Displayed exact mathematical formulas in dedicated monospace formula boxes right on each respective card:
    - **Gross Profit**: `Formula: Revenue - (Revenue × 52% COGS)`
    - **Net Profit (EBITDA)**: `Formula: Gross Profit - (Revenue × 24% Opex)`
    - **Sales Pipeline**: `Formula: Live Quotes + (Hot × ₹1.2L + Warm × ₹65K)`
    - **Procurement Sourcing**: `Formula: Total Invoiced × 0.52`
    - **Marketing Benchmarks**: Explicitly annotated as `Fabricated Model: Est. CAC ₹1,450 / 5.2x ROI`.
  - Updated `getCEOExecutiveMIS` controller in `backend/controllers/dashboardController.js` with `isFabricated` and `formulaText` properties.

## [0.15.1] - CEO Unified Command Hub & Spacious KPI Cards Layout

- **Unified Command Hub Layout** (`CEODashboardOverview.jsx`):
  - Removed sub-filter pill tabs (`domainTabs` / `activeDomainFilter`) so all 10 domain command sections render sequentially in a single, executive flow.
  - Upgraded **Core Executive Financial & Commercial KPIs** grid from cramped 7-column layout to a spacious `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5` with bold `text-2xl sm:text-3xl` fonts and unclipped subtexts.
  - Removed the static "Product Categories & Price Points" card in Section 4 (Inventory), giving full width to the "Field Demand Frequency by Product" distribution.
  - Added resilient fallback synthesis in `mockApi.getCEODashboardHubData()` computing telemetry directly from active entity stores when backend endpoints are offline.

## [0.15.0] - CEO 11-Domain Command Center Activation & Data Integrity Transparency

- **CEO Executive Command Center Activated** (`CEODashboardOverview.jsx` & `CEODashboard.jsx`):
  - Replaced the "Under Construction" placeholder on the CEO Dashboard tab with the live, full-scale executive command center spanning all 11 business domains.
  - **11 Domain Command Hubs Connected**:
    1. **Executive KPIs**: Billed Revenue, Gross Profit, Gross Margin, Net Profit (EBITDA), Cash Inflow Collections, Accounts Receivable Aging, Orders Won, and Sales Pipeline.
    2. **Sales Engine**: Pipeline value, customer penetration, average deal size, highest single deal, and quarterly target progress.
    3. **Finance & Treasury**: Inflow, receivables aging (0-30, 31-60, 61-90, 90+ days), and canvasser commission liabilities.
    4. **Operations & Delays**: Sample packs in evaluation, formal quotes issued, executed orders, and overdue canvasser follow-up visits with direct call links.
    5. **Inventory & Products**: Standard SKU catalog, category velocity, and real-time field inquiry demand distribution.
    6. **Customers & Accounts**: Master Directory coverage, visited accounts, converted client accounts, and top revenue-contributing institutions.
    7. **Procurement Economics**: Modeled 52% sourcing COGS, unit economics, and 48% blended wholesale margins.
    8. **Marketing & Outreach**: Lead qualification mix (Hot, Warm, Cold), campaign tracking, and benchmark CAC model.
    9. **People & Team Leaderboard**: Live canvasser headcount, visit productivity, revenue converted, and applied commission slabs (1%–5%).
    10. **Management Governance & Alerts**: Pending CEO approval actions and critical overdue debt escalation alerts.
    11. **Reporting & MIS Trends**: Monthly trend visualizer (Billed vs Collections vs Visits) and 1-click RFC 4180 CSV MIS Export.
  - **Data Source Truthfulness & Transparency**: Added visual indicator badges across all domains explicitly distinguishing **`Verified Live Database`** telemetry from **`Modeled Operational Estimates`** (e.g. standard 52% COGS, lead conversion benchmark, CAC model).
  - Registered `/api/ceo/mis` endpoint alias in `backend/server.js` and added `mockApi.getCEODashboardHubData()` in `frontend/src/mockApi.js`.

## [0.14.0] - Master DB School Portfolio, Live Canvasser Search Sync & Priority Follow-ups Pipeline

- **Master Schools Institutional Portfolio Modal & Backend Aggregator**:
  - Added `GET /api/master-schools/:id/portfolio` endpoint in `backend/controllers/masterSchoolsController.js` and registered in `backend/server.js`.
  - Aggregates all visits, quotations, invoices, payments, and financial metrics (total visits, unique canvassers involved, quotes value, invoiced value, balance outstanding).
  - Created `frontend/src/components/SchoolPortfolioModal.jsx` featuring tabbed history for field visits (with canvasser attribution, photos, specs, notes), commercial quotations, and billing invoices with receipt logs.
  - Linked directly in `MasterSchoolsDirectoryModule.jsx`: clicking any school name or the dedicated **"Portfolio"** action button opens the institutional modal.
  - Built-in visit record inspector enabling executives to drill into any specific visit directly from the portfolio.
- **Live Database Integration for Canvasser School Search Picker**:
  - Upgraded `frontend/src/components/SchoolSearchPicker.jsx` to fetch live database records from `mockApi.getMasterSchools` with 200ms debounce.
  - Merges newly verified and newly added schools ahead of static catalog entries, ensuring canvassers can immediately select newly verified institutions.
  - Fixed case-sensitive `'All'` / `'all'` district parameter handling in `backend/controllers/masterSchoolsController.js` and `frontend/src/mockApi.js`.
- **Executive Priority Follow-ups Section for CEO & Admin Dashboards**:
  - Created `frontend/src/components/FollowUpsPipelineModule.jsx` providing a high-priority chronological queue sorted by `follow_up_date ASC`.
  - Added dedicated quick-action urgency buckets: **"Due Tomorrow / Next Day"** (highlighted primary focus), **"Due Today"**, **"Overdue"**, **"Upcoming (Next 7 Days)"**, and **"All Open"**.
  - Displays decision maker contact info, 1-click phone dialer (`tel:`), canvasser ownership, funnel status, interest level, products discussed, and meeting notes.
  - Integrated into top desktop navigation and mobile navigation bars across both `CEODashboard.jsx` and `ManagerDashboard.jsx`.

## [0.13.0] - Comprehensive Documentation Audit & Codebase Synchronization

- **Comprehensive Documentation Alignment across All 11 Knowledge Specifications**:
  - `docs/ARCHITECTURE.md`: Synchronized 5-role RBAC architecture (CEO, CFO, CCO, Admin Executive, Canvasser), component registry (`CEODashboard`, `CFODashboard`, `CCODashboard`, `ManagerDashboard`, `CanvasserDashboard`, `MasterSchoolsDirectoryModule`, `UserManagementModule`, `InvoicingModule`, `PendingApprovalsDrawer`, `InvoiceDocumentModal`), and dual SQLite (WAL) / PostgreSQL Neon backend.
  - `docs/TRD.md`: Replaced outdated "TBD" placeholders with confirmed technical architecture (React 18 + Vite, Node.js / Express REST API, SQLite native `DatabaseSync` / PostgreSQL Neon adapter, bcrypt password hashing, 7-day stateless JWT authentication).
  - `docs/API.md`: Updated complete catalog of all 28+ active REST endpoints, including user lifecycle management, CEO approval queues, statewide master school catalog with RFC 4180 CSV export, visit audit logs with field diffs, multi-criteria leaderboard sorting, and dynamic line-item invoicing.
  - `docs/DATABASE.md`: Documented full relational database schema for all 9 tables (`users`, `pending_user_actions`, `visits`, `audit_logs`, `master_schools`, `products`, `quotations`, `invoices`, `payments`) with exact columns, constraints, foreign keys, and data types.
  - `docs/SECURITY.md`: Aligned security threat model and mitigation policies with the 5-tier role hierarchy, immutable visit audit trails, password hashing (10 rounds), forced reset prompt modals, and CEO approval queues for administrative mutations.
  - `docs/ROADMAP.md`: Updated roadmap to mark foundational Phases 1–5 as completed and established active Phase 6 production deployment & scaling milestones.
  - `docs/RISKS.md`: Synchronized operational risk mitigations with the active field audit trail diffing, CEO approval queue governance, and SQLite WAL persistence.
  - `docs/PRD.md` & `docs/REQUIREMENTS.md`: Standardized user specifications with 5-tier role model, username standard `<name>@<role>`, 8-slab standard monthly commission matrix (2.00% to 5.50%), performance volume incentives, new school acquisition bonus, and custom dynamic line-item quotations.

## [0.12.0] - Team Leaderboard Multi-Criteria Sorting, Itemized Per-Invoice Pay Calculation & Executive Development Overlays

- **Non-Technical UI Phrasing & Plain-Language Copy Overhaul**:
  - **Login Page Simplification** (`Login.jsx`): Removed all occurrences of the word "Email" from the login form and demo cards. Standardized to "Username" with format hint `<name>@<role>`. Replaced "Executive OS" with "School Uniforms & Institutional Canvassing Portal".
  - **Removed Database & Backend Jargon**: Replaced technical terminology such as "SQLite synchronized", "telemetry", "terminal", "MIS dataset", "cloud database sync", and "role governance" with simple, natural business terminology ("School Directory", "Saved and Up to Date", "Summary Report", "Team Directory & User Roles").
  - **Under Construction Overlay Plain English**: Simplified technical status checklists across CEO, CFO, and CCO overlays to plain-language milestones ("Commercial Reports Layout", "Financial Statements & Summary", "Executive Summary Cards").
- **Executive Dashboards Under Active Construction Veils (CEO, CFO, CCO)**:
  - **Above-The-Fold Compact Positioning**: Clamped the locked container height (`max-h-[560px]`) across CEO, CFO, and CCO dashboards so the entire **Under Active Construction** badge, title, status checklist, and dev preview buttons are visible immediately at the top without any page scrolling.
  - **CEO Executive Command Center** (`CEODashboard.jsx`): Masked executive KPIs, MIS analytics, and financial summaries with quick Dev Preview toggle.
  - **CFO Financial Strategy & Treasury** (`CFODashboard.jsx`): Masked 8-report financial models, P&L, GP%, and Receivables aging with quick Dev Preview toggle.
  - **CCO Commercial Strategy & Pipeline** (`CCODashboard.jsx`): Masked commercial overview, funnel conversion, and territory market share modules.
- **Per-Invoice Pay Calculation Engine**:
  - For every invoice converted by a canvasser, their earned payout is computed as `invoice_grand_total * applied_slab_rate / 100`.
  - Applied slab rate is determined by the canvasser's cumulative invoiced volume:
    - ₹0 to ₹5,00,000: **1%**
    - ₹5,00,001 to ₹10,00,000: **2%**
    - ₹10,00,001 to ₹15,00,000: **3%**
    - ₹15,00,001 to ₹20,00,000: **4%**
    - Over ₹20,00,000: **5% (Max Cap)**
  - Total pay earned is the exact sum of individual converted invoice payouts.
- **Multi-Criteria Dynamic Leaderboard Sorting**:
  - Added full ascending / descending sorting support across 6 key sales and operational metrics:
    - **Pay Earned (₹)** (`pay`)
    - **Schools Canvassed** (`visits`)
    - **Invoices Converted** (`invoices`)
    - **Total Invoiced Value (₹)** (`invoiced`)
    - **Conversion Rate (%)** (`conversion`)
    - **Average Deal Size (₹)** (`avg_deal`)
  - Integrated quick-filter sort pills, click-to-sort column headers with directional sort arrows (`↑` / `↓`), and ascending/descending toggle.
- **Itemized Converted Invoice Drawer**:
  - Expanded canvasser rows in `<CanvasserLeaderboard.jsx>` with an animated breakdown drawer (`AnimatePresence`).
  - Itemizes every converted invoice with School Name, District, Issue Date, Invoice Grand Total, Applied Slab Rate (%), and Exact Pay Earned (₹).
- **Backend API & Multi-Criteria Query Support (`GET /api/dashboard/leaderboard`)**:
  - Supports query parameters `?sort_by=pay|visits|invoices|invoiced|conversion|avg_deal` and `?order=desc|asc`.
  - Returns calculated `convertedInvoices` array alongside aggregate metrics for high-speed client rendering.
- **Automated Backend Test Suite (`backend/tests/leaderboard_and_pay_sorting.test.js`)**:
  - 7 test scenarios validating default pay sorting, itemized invoice calculation mathematics, schools canvassed sorting, invoices converted sorting, revenue sorting, and conversion rate sorting.



### Added & Enhanced
- **Canvasser Field Contact Details & Strength Auto-Sync**:
  - Automatically synchronizes and updates `contact_person`, `phone`, and `student_strength` into the `master_schools` database whenever a field canvasser logs a new visit or edits an existing visit.
  - Matches institutions by `master_school_id` with fallback matching by `school_name` and `district`.
- **Dedicated Student Strength Column & Dash Formatting**:
  - Implemented a dedicated separate column for `Student Strength` in the Master Schools directory table.
  - Formatted unrecorded / unknown student strength, contact person, and phone records with a clean dash `—` in the UI and `-` in CSV exports.
  - Added explicit `Student Strength` input in Add/Edit School modals allowing empty inputs for unknowns.
- **SQLite Relational Master Schools Backend (`master_schools` table)**:
  - Backed statewide school catalog with persistent SQLite storage and complete field schema (`id`, `code`, `school_name`, `district`, `block_cluster`, `zone`, `board`, `area`, `contact_person`, `phone`, `email`, `student_strength`, `created_at`, `updated_at`).
- **CEO & Admin Unified Access**:
  - Embedded dedicated **Master Schools DB** workspace tab inside both CEO (`CEODashboard.jsx`) and Admin Executive (`ManagerDashboard.jsx`) portals.
- **CEO Approval Workflow for School Mutations**:
  - CEO creates, edits, and deletes schools directly and immediately in the database.
  - Admin creates, edits, and deletes schools via queued requests (`SCHOOL_CREATE`, `SCHOOL_EDIT`, `SCHOOL_DELETE`) in `pending_user_actions` table, awaiting CEO approval.
  - CEO receives requests in `PendingApprovalsDrawer.jsx` and approving immediately executes SQLite database mutations.
- **Standard RFC 4180 CSV Export (`GET /api/master-schools/export`)**:
  - Implemented streaming endpoint producing clean CSV with properly escaped commas/quotes, standard headers, and automatic browser download (`master_schools_catalog.csv`).
  - Added "Export Database (CSV)" button directly in the Master Schools management table header with instant download.
- **Automated Backend Test Suites**:
  - `backend/tests/master_schools_governance.test.js`: 10 test cases for CEO/Admin governance, CRUD, approval queue, and CSV streaming.
  - `backend/tests/school_strength_sync.test.js`: 9 test cases verifying unknown dash formatting, field canvasser visit creation sync, visit edit sync, and CSV export reflection.

## [0.10.0] - User Directory & Role Governance, CEO Approval Queue, Account Lifecycle (Active/Paused/Deleted), and Mandatory Password Reset

### Added & Enhanced
- **User Directory Exclusive Scope**:
  - Granted dedicated User Directory & Roles tab to **CEO** (`CEODashboard.jsx`) and **Admin Executive** (`ManagerDashboard.jsx`). Strictly blocked for other roles.
- **Account State Lifecycle Management**:
  - Supported `ACTIVE`, `PAUSED` (temporarily pauses login access, all progress preserved, resumable), and `DELETED` (permanently disables login, all past visits, invoices, and progress fully preserved in dataset).
- **CEO Approval Workflow for Admin**:
  - All Admin user actions (User Provisioning, Role Modification, Account Pause, Account Resume, Account Deletion) are routed to CEO Approval Queue (`pending_user_actions` table / `PendingApprovalsDrawer.jsx`).
  - CEO commands execute immediately.
  - Protected CEO account from being paused, deleted, or role-edited by non-CEO actors.
- **Instant Password Reset Flow**:
  - Allowed Admin and CEO to trigger instant Password Resets without approval delays.
  - Added `ForcePasswordResetModal.jsx` prompting flagged users to enter and confirm their new password upon login.
- **Strict Username Formatting**:
  - Standardized username generation to strict `<name>@<role>` format (e.g. `murugan@cvs`, `sudhan@ceo`, `admin@admin`, `abhishek@cfo`, `varshini@cco`).
  - Automatically updates login identifier when user role changes.
- **Test Suite**:
  - Created and validated comprehensive automated backend test suite (`backend/tests/user_lifecycle.test.js`) verifying all 13 lifecycle and governance scenarios.

## [0.9.0] - Removed Fixed Product Catalog, Flexible Client Line Items, Murugan Watermark Printing, and Fixed Document View Button

### Removed & Streamlined
- **Fixed Product Catalog Master**: Removed the "Product Master" tab and hardcoded SKU catalog restrictions in `InvoicingModule.jsx` as per CEO requirements for complete client flexibility.
- **Dynamic Line Items**: Implemented custom item builder allowing user-defined product names, HSN codes, sizes, units (prs, pcs, box, sets), quantities, unit rates, and GST rates for every individual Quotation and Tax Invoice.

### Enhanced & Fixed
- **Official Printable Format with Watermark (`InvoiceDocumentModal.jsx`)**:
  - Implemented exact Murugan Enterprises corporate invoice & quotation layout.
  - Added centered Murugan Enterprises watermark logo (`/assets/murugan_logo.png`) behind printable document content with `-webkit-print-color-adjust: exact` and A4 page optimization.
  - Added official GSTIN (33KRQPS6169P1ZE), PAN (KRQPS6169P), Bank Details (SBI Current A/C 44909857955), and 5-point Terms & Conditions for Quotations.
- **Fixed Document View & Action Buttons**:
  - Resolved prop and data normalization issues (`initialData`, `documentData`, `visitData`) across `InvoicingModule.jsx` and `FieldVisitRegistry.jsx`.
  - "View", "New Quotation", "New Tax Invoice", and "Convert" actions now work instantaneously across all tabs.

## [0.8.0] - Professional Enterprise Branding, Clean User Personas, Fixed Invoicing & Quotation UI, and Mobile/Desktop Number Visibility

### Changed & Refined
- **Professional User Personas & Accounts**:
  - Replaced all informal/quirky placeholder names with professional team identities:
    - **Admin**: **Sudhan** (`sudhan@murugan.com` / `manager@murugan.com`, General Manager)
    - **Canvassers**: **Gokul** (Senior Canvasser), **Murugan** (Field Sales Lead), **Suhas** (Field Canvasser).
  - Cleaned all demo login buttons on `<Login />` and sanitized all mock visits, quotes, invoices, payments, and audit histories.
  - Bumped storage cache keys (`murugan_visits_v3`, `murugan_quotations_v2`, `murugan_invoices_v2`, `murugan_payments_v2`) for instant clean state.
- **Invoicing & Quotation Workspace UI Overhaul (`InvoicingModule.jsx`)**:
  - Fixed responsive sub-navigation with Lucide icons and sleek active pill styling.
  - Added live search filter and status filtering across quotations and invoices.
  - Fixed table layout clipping on mobile and smaller desktop screens using responsive `overflow-x-auto min-w-[...]` wrappers.
  - Fixed number visibility glitches: formatted all monetary amounts with `font-mono whitespace-nowrap` to prevent awkward line breaks or truncation.
- **Enterprise Commercial Document System (`InvoiceDocumentModal.jsx`)**:
  - Replaced external branding references with **Murugan Commercial Document Suite**.
  - Improved line items table responsiveness, tax calculations, and crisp printable high-resolution invoice/quote layout.
- **Global Number Visibility & Responsiveness**:
  - Updated `<DynamicKPISection />` with `font-mono whitespace-nowrap truncate` and responsive scaling.
  - Updated Team Leaderboard tables in `<ManagerDashboard />` and `<CanvasserLeaderboard />`.

## [0.7.0] - Revised Exact Client Workflow, Restricted Canvasser Statuses, Product Specs & Sample Photos, and Tiered Commission Slabs (1% - 5%)

### Added
- **Product Specifications & Principal Requirements Capture**:
  - Added `product_specifications` field on `mockVisits` and `<CanvasserDashboard />` form to capture specific yarn, fabric GSM, custom crest embossing, socks ribbing, and buckle designs.
  - Rendered highlighted specification cards across Canvasser feeds and Admin Central Visit Registry.
- **Sample Photos & Reference Images Attachment**:
  - Added sample image attachment uploader with thumbnail gallery on visit logging form and edit modals.
  - Implemented interactive full-screen Lightbox image preview modal on both Canvasser and Admin dashboards.
- **Flexible Next Action Follow-Up**:
  - Added "No Follow-up Needed / None" toggle alongside date picker.
- **5-Tier Progressive Commission Slab System (1% to 5%)**:
  - Built `calculateCommissionSlab(amount)` utility in `mockApi.js`:
    - ₹0 - ₹5L: **1%**
    - ₹5L - ₹10L: **2%**
    - ₹10L - ₹15L: **3%**
    - ₹15L - ₹20L: **4%**
    - > ₹20L: **5% (Capped Maximum)**
  - Calculated and rendered Commission Slab Badge (`1% - 5% Slab Tier`), Commission Earned (₹), and remaining upgrade distance on Canvasser Leaderboards and Admin Team overview.
  - Added dynamic upgrade progress bar for active canvasser tier leveling.
- **Canvasser KPI Upgrades (`DynamicKPISection.jsx`)**:
  - Added `Commission Earned (₹)` and `Active Slab Tier (%)` KPI metric cards.

### Changed & Refined
- **Restricted Outcome Status Options for Canvassers**:
  - Canvassers can only choose between `Open`, `Sample Sent`, and `Not Interested`.
  - `Quote Given`, `Won`, and `Lost` statuses are restricted to Admin control upon commercial conversion.
- **Complete Removal of Marketing Hub**:
  - Removed Marketing Hub tabs, modules, and icons from both Canvasser and Admin portals.
- **Streamlined Admin Commercial Actions**:
  - Generating an invoice automatically flips the visit status to `Won` and computes commission slab attribution for the originating field canvasser.

---

## [0.6.0] - Institutional Master School Database & Search-First School Picker

### Added
- **Institutional Master School Database (`frontend/src/data/masterSchools.js`)**:
  - Seeded comprehensive catalog of verified schools across all Tamil Nadu districts (Tenkasi, Tirunelveli, Chennai, Coimbatore, Madurai, Salem, Erode, Tiruppur, Vellore, Theni, Dindigul, Ramanathapuram, Thoothukudi, Kanyakumari, Trichy, Dharmapuri, Krishnagiri, Pudukkottai, etc.).
  - Standardized school metadata including `id`, `school_name`, `district`, `block_or_cluster`, `zone`, `board`, and `area`.
- **Search-First Canvasser School Picker (`frontend/src/components/SchoolSearchPicker.jsx`)**:
  - Real-time search/autocomplete by school name, district, or block/cluster with instant match highlighting.
  - One-tap selection that automatically auto-fills School Name, District, and Board/Institution Type.
  - Linked status banner displaying `🏛️ Verified Master DB School (#ID)` with easy change/clear controls.
  - Seamless manual fallback allowing canvassers to type unlisted custom school and district details.
- **Database Origin Tracking**:
  - Added `is_from_master_db: true/false`, `master_school_id`, and `cluster_or_block` to visit data schema in `mockApi.js`.
  - Added visual origin badges (`🏛️ Master DB` vs `🆕 Newly Discovered`) across all Canvasser visit feeds and Admin registries.
- **Admin Discovery Audit Filter**:
  - Added "Source: All / Master DB Schools / Newly Discovered" filter in `ManagerDashboard.jsx` so leadership can review and onboard new uncataloged institutions discovered in the field.

---

## [0.5.0] - Canvasser Invoicing/Marketing Removal & Competitive Field Leaderboard

### Changed & Refined
- **Canvasser Interface Simplification**:
  - Completely removed the Invoicing and Marketing tabs/actions from the Field Canvasser dashboard.
  - Canvassers now operate across 4 focused tabs: `Dashboard`, `New Visit`, `Visits`, and `Leaderboard`.
  - Removed direct quotation and invoice creation buttons from Canvasser cards.
- **Admin-Centric Invoicing & Quotations Management**:
  - Direct Quotation generation, pricing follow-up with school principals, order confirmation, and Tax Invoice creation are centralized exclusively with Admin.
  - Added direct `+ Issue Quote` and `+ Tax Invoice` action buttons on visit logs within the Admin Central Field Visit Registry.
  - Added a "Credited Field Canvasser" selector in the Invoice/Quotation creation modal (`InvoiceDocumentModal.jsx`) so that confirmed orders and billing amounts are automatically credited to the canvasser who generated the lead.

### Added
- **Competitive Canvasser Leaderboard (`CanvasserLeaderboard.jsx`)**:
  - Live competitive rankings displaying Total Invoiced Value Generated (₹), Total School Visits Logged, Won Deals, and Team Rank.
  - "Your Rank" hero banner with motivational progress indicators (Gap to #1 Leader, Position Badge).
  - Metric summary cards (Total Revenue Generated, Deals Closed, Active Canvassers, Average Order Value).
  - Privacy-preserving architecture: Numbers only without revealing confidential school names or line-item pricing of other canvassers.
- **Canvasser Performance KPIs (`DynamicKPISection.jsx`)**:
  - Added `Invoices Credited (₹)` and `Team Rank` KPI cards with dedicated icons (`Receipt`, `Trophy`) for Canvassers.

---

## [0.4.1] - UI Polish: Dedicated Canvasser Dashboard Tab, Clean Role Naming & Aesthetic Overhaul

### Changed
- **Removed All Internal Taxonomy Labels**:
  - Removed all internal layer jargon (`L1`, `L2`, `L3`, `L4`, `L5`, `L1-L3`, `L3-L4`) from all user-facing UI labels, headers, badges, login screens, and modals.
  - Replaced with clean, professional real-world titles (`Executive Management` / `Executive Director` for Admin, `Field Sales & Operations` / `Field Sales Executive` for Canvassers).
- **Dedicated Field Canvasser Dashboard Screen**:
  - Separated the Canvasser Dashboard into its own clean tab in the bottom navigation bar (`Dashboard`, `New Visit`, `Visits`, `Invoicing`, `Marketing`).
  - Form screen (`New Visit`) is now dedicated, distraction-free, and uncluttered.
- **Removed All Negative Access/Restriction Banners**:
  - Removed messages like "Top-Level Financials Masked" or "Restricted Access" to maintain a seamless, positive, and natural user experience.
- **Visual Design & Contrast Overhaul**:
  - Upgraded card styling with sleek glassmorphism, rich dark tones, ambient glowing accents, vibrant status indicators, and modern typography.
  - Redesigned Login screen with instant 1-click demo accounts and elegant presentation.

---

## [0.4.0] - Two-Role Architecture with Layer Access Scoping

### Added
- **Two-Role RBAC Model (`src/lib/rbac.js`)**:
  - Admin (Executive Management, Invoicing, Analytics, Marketing Hub) & Field Canvassers (Visit Logging, Quotations, Marketing Collateral).
  - Dynamic Primary KPI rendering.

---

## [0.3.1] - Added Visit Record Audit Logging & Interactive Edit History Viewer
- Automatic editor tracking (`last_edited_by_name`, `last_edited_at`) and interactive revision timeline modal (`EditHistoryModal.jsx`).

---

## [0.3.0] - Refrens-Style Invoicing, Quotations, and Payment Tracking Integration
- Integrated Canvassing → Quotation → Tax Invoice → Payment Tracking workflow.

---

## [0.2.0] - Added Full Visit Logs View & CRUD for Managers and Canvassers
- Added Manager Command Center with All Canvass Logs, filters, Edit/Delete modals, Team Leaderboard, and CSV Export.

---

## [0.1.0] - Initialized Project Foundation & Frontend MVP
- Synthesized client requirements into project knowledge base and built mobile-first React frontend.
