# Database Design

## Schema Overview
The database uses a simple relational model consisting of two core tables: `Users` and `Visits`.

```
+-------------------+             +-----------------------+
|       Users       |             |        Visits         |
+-------------------+             +-----------------------+
| id (PK)           | 1         * | id (PK)               |
| name              |<------------| canvasser_id (FK)     |
| email (UNIQUE)    |             | school_name           |
| password_hash     |             | district              |
| role              |             | institution_type      |
+-------------------+             | contact_person        |
                                  | phone                 |
                                  | student_strength      |
                                  | product_interests     |
                                  | interest_level        |
                                  | outcome_status        |
                                  | follow_up_date        |
                                  | notes                 |
                                  | created_at            |
                                  +-----------------------+
```

## Table Specifications

### Table 1: `Users`
Stores account and role details.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER / UUID | Primary Key, Auto Increment | Unique user ID |
| `name` | VARCHAR(255) | NOT NULL | Full name of employee |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Used for login |
| `password_hash` | VARCHAR(255) | NOT NULL | Scrambled password hash |
| `role` | VARCHAR(50) | NOT NULL | `"canvasser"` or `"manager"` |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |

### Table 2: `Visits`
Stores field canvassing data linked to the canvasser.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER / UUID | Primary Key, Auto Increment | Unique visit record ID |
| `canvasser_id` | INTEGER / UUID | Foreign Key -> `Users(id)` | Canvasser who logged visit |
| `school_name` | VARCHAR(255) | NOT NULL | Name of institution |
| `district` | VARCHAR(255) | NOT NULL | District / area name |
| `institution_type` | VARCHAR(100) | NOT NULL | School, College, Distributor, etc. |
| `contact_person` | VARCHAR(255) | NOT NULL | Lead contact person |
| `phone` | VARCHAR(50) | NOT NULL | Contact phone number |
| `student_strength` | INTEGER | NULLABLE | Estimated student capacity |
| `product_interests` | TEXT | NOT NULL | Comma-separated or JSON list of products |
| `interest_level` | VARCHAR(50) | NOT NULL | Hot, Warm, Cold, Not Interested |
| `outcome_status` | VARCHAR(50) | NOT NULL | Open, Sample Sent, Quote Given, Won, Lost |
| `follow_up_date` | DATE | NULLABLE | Next action follow-up date |
| `notes` | TEXT | NULLABLE | Field notes & requirements |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Logging timestamp |

### Table 3: `Products`
Catalog of school apparel and accessories with base prices.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER / UUID | Primary Key | Unique product ID |
| `name` | VARCHAR(255) | NOT NULL | Apparel name (Socks, Uniforms, etc.) |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Base selling rate |
| `unit` | VARCHAR(50) | NOT NULL | Unit measure (pairs, sets, pcs) |
| `hsn` | VARCHAR(50) | NOT NULL | HSN Code for GST billing |
| `gst_rate` | DECIMAL(5,2) | DEFAULT 18.00 | GST percentage |

### Table 4: `Quotations`
Stores formal sales quotes issued to schools.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(50) | Primary Key | Format: `QTN-2026-XXX` |
| `visit_id` | INTEGER | FK -> `Visits(id)` | Linked canvass visit |
| `canvasser_id` | INTEGER | FK -> `Users(id)` | Creating canvasser |
| `school_name` | VARCHAR(255) | NOT NULL | Customer name |
| `items` | JSON | NOT NULL | Line items list with rates & quantities |
| `subtotal` | DECIMAL(12,2) | NOT NULL | Pre-tax total |
| `tax_amount` | DECIMAL(12,2) | NOT NULL | GST tax calculated |
| `grand_total` | DECIMAL(12,2) | NOT NULL | Total quote amount |
| `status` | VARCHAR(50) | NOT NULL | `Draft`, `Sent`, `Converted to Invoice` |

### Table 5: `Invoices`
Stores tax invoices and balance tracking.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(50) | Primary Key | Format: `INV-2026-XXX` |
| `quotation_id` | VARCHAR(50) | FK -> `Quotations(id)` | Source quotation |
| `visit_id` | INTEGER | FK -> `Visits(id)` | Source visit |
| `school_name` | VARCHAR(255) | NOT NULL | Customer name |
| `grand_total` | DECIMAL(12,2) | NOT NULL | Total invoice bill |
| `paid_amount` | DECIMAL(12,2) | DEFAULT 0.00 | Cumulative paid amount |
| `pending_balance` | DECIMAL(12,2) | NOT NULL | Outstanding balance |
| `status` | VARCHAR(50) | NOT NULL | `Unpaid`, `Partially Paid`, `Paid` |
| `due_date` | DATE | NOT NULL | Payment deadline |

### Table 6: `Payments`
Audit log of payment transactions received.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(50) | Primary Key | Format: `PAY-XXXX` |
| `invoice_id` | VARCHAR(50) | FK -> `Invoices(id)` | Target invoice |
| `amount` | DECIMAL(12,2) | NOT NULL | Collected installment |
| `mode` | VARCHAR(100) | NOT NULL | NEFT, UPI, Cheque, Cash |
| `reference_id` | VARCHAR(255) | NULLABLE | Bank reference / transaction ID |
| `date` | DATE | NOT NULL | Payment date |
