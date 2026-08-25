# Requirements

## Functional Requirements

### Two-Role RBAC Model with Layer Access Scoping
- **Admin Role (`admin`)**:
  - Layers Covered: **L1 through L3 (Executive, Commercial, Finance, Marketing Manager)**.
  - Primary KPIs: Total Revenue, Gross Profit, EBITDA, Net Cash Flow, Marketing ROI, Collection Rate.
  - Capabilities: Full read/write/edit/delete authority across all visits, complete Refrens Invoicing workspace (quotes, invoices, payments, product master pricing), L3 Marketing Hub, and CSV data export.
- **Canvasser Role (`canvasser`)**:
  - Layers Covered: **L3 (Marketing) + L4 (Sales / Canvassing & Marketing Execution)**.
  - Primary KPIs: School Visits Logged, Active Leads, Quotations Created, Orders Won, Direct Order Value (₹), Conversion Rate %.
  - Capabilities: Single-screen visit logging, scoped "My Visits" feed, direct quotation generation from visit cards, and full access to L3 Marketing campaigns & download collateral lookbooks.
  - Data Masking: Sensitive top-level financials (EBITDA, Gross Profit %, Cash Position) are strictly masked.

### Dynamic Role KPI Dashboards
- Render Primary KPIs tailored for the logged-in user:
  - Admin sees management/leadership financials (Revenue, EBITDA, Profit, Cash Flow, ROI, Collections).
  - Canvasser sees operational field performance (Visits, Leads, Quotes, Orders Won, Value, Conversion %).

### Authentication & Authorization
- Every user authenticates with `email` and `password`.
- Passwords stored as secure hashes (`password_hash`).
- Authentication returns signed JWT with user role (`admin` or `canvasser`).
- Demo logins on Login page:
  - Admin: `manager@murugan.com` (password: `password`)
  - Canvassers: `field@murugan.com`, `field2@murugan.com`, `field3@murugan.com` (password: `password`)

### Field Operations & Canvassing
- **Visit Form**: Log `school_name`, `district`, `institution_type`, `contact_person`, `phone`, `student_strength`, `product_interests`, `interest_level`, `follow_up_date`, and `notes` on a single mobile-first screen.
- **Multi-select Product Chips**: Easily tap to select multiple items (Socks, Belts, Ties, Shoes, Uniforms, Bags, Track Pants).
- **Pipeline Interest Levels**: Select Hot (ready to order), Warm (follow-up), Cold, or Not Interested.
- **My Visits List**: Canvassers view, search, and filter only their own visits with search keywords.
- **Direct Quotation Generation**: Convert any school visit directly into a formal Sales Quotation pre-filled with customer contact info and product interests.
- **Edit & Delete Visit**: Canvassers can edit all details and delete their own logged visits.
- **Status Updates**: Mark visits as Won, Lost, Quote Given, or Sample Sent.
- **Follow-up Alerts**: Highlight overdue follow-up dates.

### Invoicing & Payment System Requirements
- **Sales Quotations**: Create, preview, print, and convert Quotations to Tax Invoices. Quotation status tracking (`Draft`, `Sent`, `Converted to Invoice`).
- **Tax Invoices**: Generate itemized Tax Invoices with unique invoice numbering (`INV-2026-XXX`), GST calculation (18% default), HSN codes, and payment due dates.
- **Payment Tracking**: Log partial and full payment collections with payment modes (NEFT, UPI, Cheque, Cash) and reference IDs, updating pending balances dynamically.
- **Product Catalog Management**: Maintain standard selling rates, HSN numbers, and unit measures for all apparel product categories.

### Visit Audit Trail & Change History Requirements
- **Edit Tracking**: Whenever a visit record is updated, record the editor's identity (`last_edited_by_name`, `last_edited_by_role`) and timestamp (`last_edited_at`).
- **Field-Level Diffing**: Automatically calculate specific field changes and store them in an append-only `edit_history` audit array.
- **Audit Timeline Viewer**: Inspect the complete revision timeline of any visit log via an interactive modal (`EditHistoryModal.jsx`).

### Non-Functional Requirements
- **Mobile-First UX**: Optimized touch targets and responsive UI for smartphones and desktop command rooms.
- **Data Security**: Secure token-based validation and role-based permissions scoping.
- **Performance**: Instant data persistence and fast client-side calculations.

## Confirmed Requirements
- Email/Password login with 2-role RBAC (Admin L1–L3, Canvasser L3–L4).
- Dynamic Primary KPI rendering for Admin and Canvasser.
- Strict financial data masking for Canvassers.
- Unified Canvassing → Quotation → Tax Invoice → Payment Tracking Workflow.
- Mobile-first React + Tailwind CSS web client.
