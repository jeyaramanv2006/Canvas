# API Documentation

## 1. Authentication & Session API

### POST `/api/login` (or `/api/auth/login`)
- **Access**: Public
- **Description**: Authenticates user via username (`<name>@<role>`) or email, and password.
- **Request Body**:
  ```json
  {
    "username": "murugan@cvs",
    "password": "password"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 2,
      "username": "murugan@cvs",
      "email": "murugan@murugan.com",
      "name": "Murugan",
      "role": "cvs",
      "role_title": "Field Sales Lead",
      "status": "ACTIVE",
      "requires_password_reset": 0
    }
  }
  ```

### GET `/api/auth/me`
- **Access**: Authenticated (`authenticateToken`)
- **Description**: Returns profile details for the currently logged-in user.

### POST `/api/auth/reset-password`
- **Access**: Authenticated
- **Description**: Allows a user (especially one flagged with `requires_password_reset`) to update their own password.

### GET `/api/health`
- **Access**: Public
- **Description**: Health check endpoint returning service status and timestamp.

---

## 2. User Management & Governance API

### GET `/api/users`
- **Access**: Authenticated
- **Description**: Lists all user accounts with status (`ACTIVE`, `PAUSED`, `DELETED`), role, and activity metadata.

### POST `/api/users`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Creates a new user. If called by Admin, routes a `CREATE` request to the CEO approval queue. If called by CEO, creates user immediately.

### PUT `/api/users/:id/role`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Updates user role and role title. Routes to CEO approval queue for Admin actors.

### DELETE `/api/users/:id`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Deletes user (sets status to `DELETED`, preserving historical data). Routes to CEO approval queue for Admin.

### POST `/api/users/:id/pause`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Temporarily suspends user login (status `PAUSED`).

### POST `/api/users/:id/resume`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Re-activates suspended user (status `ACTIVE`).

### POST `/api/users/:id/reset-password`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Directly triggers mandatory password reset on next login without CEO queue approval.

---

## 3. CEO Approval Queue API

### GET `/api/approvals`
- **Access**: CEO (`requireCEO`)
- **Description**: Retrieves list of all pending user and master school action requests.

### POST `/api/approvals/:id/decide` (or `/api/approvals/:id/decision`)
- **Access**: CEO (`requireCEO`)
- **Description**: Approves or rejects a pending action request. If approved, executes database mutation.
- **Request Body**:
  ```json
  {
    "decision": "APPROVED", // "APPROVED" or "REJECTED"
    "notes": "Approved by CEO"
  }
  ```

---

## 4. Visits & Field Canvassing API

### GET `/api/visits` (Alias: `GET /api/admin/visits`)
- **Access**: Authenticated
- **Description**: Returns visits. Canvassers receive their own visits; Admins/Executives receive all visits across the company with filtering parameters.

### GET `/api/visits/:id`
- **Access**: Authenticated
- **Description**: Returns detailed single visit record including edit history and sample photo attachments.

### POST `/api/visits`
- **Access**: Authenticated (Canvassers & Admins)
- **Description**: Logs a new school visit. Automatically syncs contact details and student strength to `master_schools` if linked or matched.

### PUT/PATCH `/api/visits/:id` (Alias: `PUT /api/admin/visits/:id`)
- **Access**: Canvasser (own visit) / Admin Executive / CEO
- **Description**: Updates visit details, specifications, follow-up, or outcome status. Automatically creates an entry in `audit_logs`.

### DELETE `/api/visits/:id` (Alias: `DELETE /api/admin/visits/:id`)
- **Access**: Canvasser (own visit) / Admin Executive / CEO
- **Description**: Deletes a specific visit log and records audit log.

### POST `/api/visits/:id/verify-discovery` (Alias: `POST /api/admin/visits/:id/verify-discovery`)
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Verifies a newly discovered school lead and awards field discovery bonus.

---

## 5. Audit Logs API

### GET `/api/audit-logs`
- **Access**: Admin Executive / CEO (`authenticateToken`)
- **Description**: Returns immutable audit trail of all record modifications with actor name, role, timestamp, and field-level change diffs.

---

## 6. Master Schools Directory API

### GET `/api/master-schools`
- **Access**: Authenticated
- **Description**: Returns verified statewide master school catalog with search, district, zone, and board filters.

### GET `/api/master-schools/export`
- **Access**: Authenticated
- **Description**: Generates and streams clean RFC 4180 CSV export of the full master school directory (`master_schools_catalog.csv`).

### GET `/api/master-schools/districts`
- **Access**: Authenticated
- **Description**: Returns list of all available districts in the master school database.

### GET `/api/master-schools/:id`
- **Access**: Authenticated
- **Description**: Returns single master school record details.

### POST `/api/master-schools`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Adds a new institution. CEO creates directly; Admin routes `SCHOOL_CREATE` to CEO approval queue.

### PUT `/api/master-schools/:id`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Edits institution metadata. CEO updates directly; Admin routes `SCHOOL_EDIT` to CEO approval queue.

### DELETE `/api/master-schools/:id`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Deletes institution. CEO deletes directly; Admin routes `SCHOOL_DELETE` to CEO approval queue.

---

## 7. Analytics & Leaderboard API

### GET `/api/dashboard/stats` (Alias: `GET /api/admin/dashboard`)
- **Access**: Authenticated
- **Description**: Computes aggregate operational & leadership metrics (Total Visits, Open Leads, Orders Won, Win Rate, Product Demand).

### GET `/api/leaderboard` (Alias: `GET /api/admin/team`)
- **Access**: Authenticated
- **Description**: Returns dynamic multi-criteria leaderboard ranking all field canvassers with active commission slab rates, total pay earned, and itemized converted invoices breakdown.
- **Query Parameters**:
  - `sort_by`: `pay` | `visits` | `invoices` | `invoiced` | `conversion` | `avg_deal` (Default: `pay`)
  - `order`: `desc` | `asc` (Default: `desc`)

### GET `/api/ceo/executive-mis`
- **Access**: CEO (`requireCEO`)
- **Description**: Returns high-level executive strategic MIS data.

### GET `/api/cfo/analytics`
- **Access**: CFO / CEO
- **Description**: Returns detailed financial metrics (P&L breakdown, receivables aging, cash flow, gross margin %).

---

## 8. Financials & Commercial Invoicing API

### GET `/api/products`
- **Access**: Authenticated
- **Description**: Returns base product references.

### POST `/api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- **Access**: Admin Executive / CEO (`requireAdmin`)
- **Description**: Management endpoints for product reference catalog.

### GET `/api/quotations`
- **Access**: Canvasser (scoped), Manager / Executive (global)
- **Description**: Lists sales quotations with itemized line items, GST breakdown, and status.

### POST `/api/quotations`
- **Access**: Admin Executive / CEO / Canvasser
- **Description**: Creates a new Sales Quotation with custom dynamic line items. Auto-updates visit outcome to `Quote Given` when linked.

### GET `/api/invoices`
- **Access**: Canvasser (scoped), Manager / Executive (global)
- **Description**: Lists tax invoices with billing breakdown, paid amount, and outstanding balances.

### POST `/api/invoices`
- **Access**: Admin Executive / CEO
- **Description**: Generates an official Tax Invoice (`INV-2026-XXX`), calculates GST, marks linked visit as `Won`, and attributes sales to the originating Canvasser.

### POST `/api/invoices/:id/payment`
- **Access**: Admin Executive / CEO
- **Description**: Records a payment transaction against an invoice, updating `paid_amount`, `outstanding_balance`, and `payment_status`.

### GET `/api/payments`
- **Access**: Admin Executive / CEO
- **Description**: Returns audit log of all recorded payment transactions.

