# Requirements

## Functional Requirements

### Two-Role RBAC Model with Layer Access Scoping
- **Admin Role (`admin`)**:
  - Layers Covered: **L1 through L3 (Executive, Commercial, Finance, Marketing Manager)**.
  - Primary KPIs: Total Revenue, Gross Profit, EBITDA, Net Cash Flow, Marketing ROI, Collection Rate.
  - Capabilities: Full read/write/edit/delete authority across all visits, complete Invoicing & Commercial workspace (quotes, invoices, payments, product master pricing), CSV data export, and Canvasser order attribution.
- **Canvasser Role (`canvasser`)**:
  - Layers Covered: **L4 (Sales / Field Canvassing & Relationship Management)**.
  - Primary KPIs: School Visits Logged, Active Leads Generated, Orders Won, Invoices Credited (₹), Team Rank, Conversion Rate %.
  - Capabilities: Single-screen visit logging, scoped "My Visits" feed with audit history, and live **Competitive Field Leaderboard**.
  - Access Restrictions: Invoicing and Marketing tabs/actions are completely removed from Canvassers. Quotation & Invoice creation is handled exclusively by Admin.

### Dynamic Role KPI Dashboards
- Render Primary KPIs tailored for the logged-in user:
  - Admin sees management/leadership financials (Revenue, EBITDA, Profit, Cash Flow, ROI, Collections).
  - Canvasser sees operational field performance (Visits, Leads, Invoices Credited, Team Rank, Orders Won, Conversion %).

### Authentication & Authorization
- Every user authenticates with `email` and `password`.
- Passwords stored as secure hashes (`password_hash`).
- Authentication returns signed JWT with user role (`admin` or `canvasser`).
- Demo logins on Login page:
  - Admin: `manager@murugan.com` (password: `password`)
  - Canvassers: `field@murugan.com`, `field2@murugan.com`, `field3@murugan.com` (password: `password`)

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

### Commission Slab & Competitive Leaderboard Requirements
- **Tiered Incentive Structure**:
  - `₹0 – ₹5,00,000 (1 - 5L)`: **1% Commission**
  - `₹5,00,001 – ₹10,00,000 (5 - 10L)`: **2% Commission**
  - `₹10,00,001 – ₹15,00,000 (10 - 15L)`: **3% Commission**
  - `₹15,00,001 – ₹20,00,000 (15 - 20L)`: **4% Commission**
  - `> ₹20,00,000 (> 20L)`: **5% Commission (Capped Maximum)**
- **Gamified Performance Ranking**: Displays live rankings of all active canvassers sorted by Total Invoiced Value Generated (₹), Active Commission Slab %, and Total Commission Earned (₹).
- **Progress to Next Tier**: Interactive progress bar indicating the exact remaining sales needed to level up to the next commission percentage.
- **Metric Transparency without Confidentiality Breaches**: Renders aggregate numbers (Invoiced ₹, Commission ₹, Total Visits, Orders Won, Rank #) without exposing individual school names or pricing breakdowns.

### Invoicing & Commercial Pipeline (Admin Exclusive Authority)
- **Quotation Generation**: Admin creates formal Sales Quotations from visit records and specifications, tracks negotiation attempts.
- **Tax Invoices & Order Attribution**: Admin generates itemized Tax Invoices (`INV-2026-XXX`), calculates GST (18% default), HSN codes, marks the visit as `Won`, and attributes the invoice to the originating Canvasser (`canvasser_id`), automatically computing their commission slab.
- **Payment Tracking**: Log partial and full payment collections with payment modes (NEFT, UPI, Cheque, Cash) and reference IDs, updating pending balances dynamically.
- **Marketing Hub Removal**: The Marketing Hub section is completely removed from both Canvasser and Admin interfaces.

### Visit Audit Trail & Change History Requirements
- **Edit Tracking**: Whenever a visit record is updated, record the editor's identity (`last_edited_by_name`, `last_edited_by_role`) and timestamp (`last_edited_at`).
- **Field-Level Diffing**: Automatically calculate specific field changes and store them in an append-only `edit_history` audit array.
- **Audit Timeline Viewer**: Inspect the complete revision timeline of any visit log via an interactive modal (`EditHistoryModal.jsx`).

### Non-Functional Requirements
- **Mobile-First UX**: Optimized touch targets and responsive UI for smartphones and desktop command rooms.
- **Data Security**: Secure token-based validation and role-based permissions scoping.
- **Performance**: Instant data persistence and fast client-side calculations.

## Confirmed Requirements
- Email/Password login with 2-role RBAC (Admin L1–L3, Canvasser L4).
- Master School Database search with unlisted custom fallback.
- Product Specifications notes and Sample Photo attachments.
- Canvasser outcome status restricted to `Open`, `Sample Sent`, `Not Interested`.
- Flexible follow-up (Date or None).
- Admin management of Quotes, Invoices, Status updates to `Won`/`Lost`, and Canvasser attribution.
- 5-Tier Commission Slab structure (1% to 5%) with leaderboard earnings and progression.
- Removal of Marketing Hub from both Canvasser and Admin views.
