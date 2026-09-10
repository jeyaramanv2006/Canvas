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

### Commission Slab, Per-Invoice Pay & Competitive Leaderboard Requirements
- **Per-Invoice Pay Calculation**:
  - For every invoice converted from field canvassing, the canvasser receives a pay amount.
  - Pay is calculated based on the canvasser's active percentage slab applied to each converted invoice: `Invoice Payout = (Invoice Grand Total × Active Slab Rate) / 100`.
  - The canvasser's total cumulative invoiced volume determines their active slab tier:
    - `₹0 – ₹5,00,000 (1 - 5L)`: **1% per Invoice**
    - `₹5,00,001 – ₹10,00,000 (5 - 10L)`: **2% per Invoice**
    - `₹10,00,001 – ₹15,00,000 (10 - 15L)`: **3% per Invoice**
    - `₹15,00,001 – ₹20,00,000 (15 - 20L)`: **4% per Invoice**
    - `> ₹20,00,000 (> 20L)`: **5% Max Payout**
  - Total Pay Earned = Sum of payouts across all converted invoices.
- **Multi-Criteria Sorting & Comparisons**:
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

### Invoicing & Commercial Pipeline (Admin Exclusive Authority)
- **Quotation Generation**: Admin creates formal Sales Quotations from visit records and specifications, tracks negotiation attempts.
- **Tax Invoices & Order Attribution**: Admin generates itemized Tax Invoices (`INV-2026-XXX`), calculates GST (18% default), HSN codes, marks the visit as `Won`, and attributes the invoice to the originating Canvasser (`canvasser_id`), automatically computing their commission slab.
- **Payment Tracking**: Log partial and full payment collections with payment modes (NEFT, UPI, Cheque, Cash) and reference IDs, updating pending balances dynamically.
- **Marketing Hub Removal**: The Marketing Hub section is completely removed from both Canvasser and Admin interfaces.

### Visit Audit Trail & Change History Requirements
- **Edit Tracking**: Whenever a visit record is updated, record the editor's identity (`last_edited_by_name`, `last_edited_by_role`) and timestamp (`last_edited_at`).
- **Field-Level Diffing**: Automatically calculate specific field changes and store them in an append-only `edit_history` audit array.
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
  - Full relational persistence in SQLite (`master_schools` table) with fields: `id`, `code`, `school_name`, `district`, `block_cluster`, `zone`, `board`, `area`, `contact_person`, `phone`, `email`, `student_strength`, `created_at`, `updated_at`.
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

### Non-Functional Requirements
- **Mobile-First UX**: Optimized touch targets and responsive UI for smartphones and desktop command rooms.
- **Data Security**: Secure token-based validation and role-based permissions scoping.
- **Performance**: Instant data persistence and fast client-side calculations.

## Confirmed Requirements
- Email/Password login with 2-role RBAC (Admin L1–L3, Canvasser L4).
- Master School Database search with unlisted custom fallback.
- Master School Database management with CEO direct execution, Admin CEO approval queue, and RFC 4180 CSV export.
- Product Specifications notes and Sample Photo attachments.
- Canvasser outcome status restricted to `Open`, `Sample Sent`, `Not Interested`.
- Flexible follow-up (Date or None).
- Admin management of Quotes, Invoices, Status updates to `Won`/`Lost`, and Canvasser attribution.
- 5-Tier Commission Slab structure (1% to 5%) with leaderboard earnings and progression.
- Removal of Marketing Hub from both Canvasser and Admin views.
