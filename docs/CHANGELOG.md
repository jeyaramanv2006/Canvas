# Changelog

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
