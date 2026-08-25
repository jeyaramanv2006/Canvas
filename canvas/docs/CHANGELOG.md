# Changelog

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
