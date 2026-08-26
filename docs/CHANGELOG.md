# Changelog

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
