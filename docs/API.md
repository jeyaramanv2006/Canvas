# API Documentation

## Authentication API

### POST `/api/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@muruganenterprises.com",
    "password": "securepassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 1,
      "name": "Rahul Sharma",
      "email": "user@muruganenterprises.com",
      "role": "canvasser"
    }
  }
  ```

---

## Canvasser API (Requires "canvasser" Role)

### POST `/api/visits`
- **Access**: Canvasser
- **Description**: Creates a new school visit log attributed to the authenticated user.

### GET `/api/visits`
- **Access**: Canvasser
- **Description**: Returns all visits created by the authenticated canvasser (`WHERE canvasser_id = token.userId`).

### PUT/PATCH `/api/visits/{id}`
- **Access**: Canvasser (Own visit only)
- **Description**: Updates visit details (school info, contact, products, interest level, outcome status, follow-up, notes).

### DELETE `/api/visits/{id}`
- **Access**: Canvasser (Own visit only)
- **Description**: Deletes a specific visit log owned by the canvasser.

---

## Manager API (Requires "manager" Role)

### GET `/api/admin/visits`
- **Access**: Manager
- **Description**: Returns all visits across all canvassers with full metadata and filters (search, district, canvasser, interest, status).

### PUT/PATCH `/api/admin/visits/{id}`
- **Access**: Manager
- **Description**: Edits any visit record in the database.

### DELETE `/api/admin/visits/{id}`
- **Access**: Manager
- **Description**: Deletes any visit record.

### GET `/api/admin/dashboard`
- **Access**: Manager
- **Description**: Computes aggregate metrics for manager charts (Total Visits, Hot Leads, Orders Won, Win Rate %, District breakdown, Product demand).

### GET `/api/admin/team`
- **Access**: Manager
- **Description**: Returns team performance summary per canvasser.

### GET `/api/admin/export`
- **Access**: Manager
- **Description**: Generates and downloads the full CSV file.

---

## Financials & Invoicing API (Enterprise Invoicing & Commercial Suite)

### GET `/api/products`
- **Access**: Canvasser, Manager
- **Description**: Returns product catalog with standard unit rates, units of measure, and HSN codes.

### POST `/api/products`
- **Access**: Manager
- **Description**: Saves or updates master product pricing catalog.

### GET `/api/quotations`
- **Access**: Canvasser (scoped), Manager (global)
- **Description**: Returns sales quotations.

### POST `/api/quotations`
- **Access**: Canvasser, Manager
- **Description**: Creates a new Sales Quotation. Auto-links to `visit_id` if provided and updates visit outcome to `Quote Given`.

### GET `/api/invoices`
- **Access**: Canvasser (scoped), Manager (global)
- **Description**: Returns tax invoices with billing breakdown, paid amount, and outstanding balances.

### POST `/api/invoices`
- **Access**: Canvasser, Manager
- **Description**: Generates a new Tax Invoice (`INV-2026-XXX`). Auto-links to `quotation_id` or `visit_id` and updates visit outcome to `Won`.

### POST `/api/invoices/{id}/payments`
- **Access**: Manager
- **Description**: Records a payment transaction installment against an invoice, updating `paid_amount`, `pending_balance`, and status (`Paid`, `Partially Paid`).

### GET `/api/payments`
- **Access**: Manager
- **Description**: Audit log of all payment transactions collected.

### GET `/api/financial-stats`
- **Access**: Manager
- **Description**: Computes financial KPIs (Total Invoiced, Total Collected, Outstanding Balance, Overdue Invoices Count).
