# Database Design

## Schema Overview
The relational database supports dual engines (SQLite with WAL mode / PostgreSQL Neon) with foreign key relationships.

```
+-------------------+             +-----------------------+             +----------------------+
|       users       | 1         * |        visits         | 1         * |      audit_logs      |
+-------------------+<------------+-----------------------+<------------+----------------------+
| id (PK)           |             | id (PK)               |             | id (PK)              |
| username (UNIQUE) |             | canvasser_id (FK)     |             | visit_id (FK)        |
| email             |             | master_school_id (FK) |             | actor_id (FK)        |
| password_hash     |             | school_name           |             | actor_name           |
| name              |             | district              |             | actor_role           |
| role              |             | institution_type      |             | action               |
| role_title        |             | contact_person        |             | changed_fields       |
| status            |             | phone                 |             | timestamp            |
| req_pwd_reset     |             | student_strength      |             +----------------------+
+-------------------+             | product_interests     |
        | 1                       | product_specifications|
        |                         | attachments           |
        | *                       | interest_level        |
+----------------------+          | outcome_status        |
| pending_user_actions |          | discovery_status      |
+----------------------+          | follow_up_date        |
| id (PK)              |          | notes                 |
| action_type          |          | last_edited_by_name   |
| target_user_id (FK)  |          | last_edited_by_role   |
| target_user_data     |          | created_at            |
| requested_by_id (FK) |          | updated_at            |
| status               |          +-----------------------+
| reviewed_by_id (FK)  |
+----------------------+
```

## Table Specifications

### Table 1: `users`
Stores employee and executive accounts with strict role-based governance.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user ID |
| `username` | TEXT | NOT NULL, UNIQUE | Format: `<name>@<role>` (e.g. `murugan@cvs`, `sudhan@ceo`, `admin@admin`) |
| `email` | TEXT | NULLABLE | User email address |
| `password_hash` | TEXT | NOT NULL | bcrypt password hash |
| `name` | TEXT | NOT NULL | Full name |
| `role` | TEXT | NOT NULL | `ceo`, `cfo`, `cco`, `admin` / `admin_exec`, `cvs` / `canvasser` |
| `role_title` | TEXT | NULLABLE | Display title (e.g., "Chief Executive Officer", "Field Sales Lead") |
| `status` | TEXT | DEFAULT 'ACTIVE' | `ACTIVE`, `PAUSED` (temporarily disabled), `DELETED` (permanently disabled, history kept) |
| `requires_password_reset` | INTEGER | DEFAULT 0 | 1 if user is forced to reset password on next login |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last profile update timestamp |

---

### Table 2: `pending_user_actions`
Stores action requests submitted by Admin for CEO approval queue.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique request ID |
| `action_type` | TEXT | NOT NULL | `CREATE`, `ROLE_CHANGE`, `DELETE`, `PAUSE`, `RESUME`, `SCHOOL_CREATE`, `SCHOOL_EDIT`, `SCHOOL_DELETE` |
| `target_user_id` | INTEGER | NULLABLE | Target user ID (or NULL for new creations) |
| `target_user_data` | TEXT (JSON) | NOT NULL | Serialized request payload / changes |
| `requested_by_id` | INTEGER | NOT NULL | Admin user ID who initiated the request |
| `requested_by_name` | TEXT | NOT NULL | Admin user name |
| `requested_by_role` | TEXT | NOT NULL | Admin user role |
| `status` | TEXT | DEFAULT 'PENDING' | `PENDING`, `APPROVED`, `REJECTED` |
| `reviewed_by_id` | INTEGER | NULLABLE | CEO user ID who reviewed |
| `reviewed_by_name` | TEXT | NULLABLE | CEO name |
| `reviewed_at` | DATETIME | NULLABLE | Review timestamp |
| `notes` | TEXT | NULLABLE | CEO approval or rejection notes |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Submission timestamp |

---

### Table 3: `visits`
Stores field canvassing activity, specifications, sample photos, and outcome stages.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique visit ID |
| `canvasser_id` | INTEGER | NOT NULL, FK -> `users(id)` | Canvasser who logged the visit |
| `canvasser_name` | TEXT | NOT NULL | Canvasser name at time of logging |
| `is_from_master_db` | INTEGER | DEFAULT 0 | 1 if selected from master school catalog |
| `master_school_id` | TEXT | NULLABLE, FK -> `master_schools(id)` | Linked institutional ID |
| `school_name` | TEXT | NOT NULL | Institution name |
| `district` | TEXT | NOT NULL | District (e.g., Tenkasi, Tirunelveli, Chennai) |
| `cluster_or_block` | TEXT | NULLABLE | Educational block / cluster |
| `institution_type` | TEXT | NOT NULL | Board / category (CBSE, Matriculation, ICSE, etc.) |
| `contact_person` | TEXT | NOT NULL | Lead contact / Principal |
| `phone` | TEXT | NOT NULL | Contact phone number |
| `student_strength` | INTEGER | NULLABLE | Estimated student strength |
| `product_interests` | TEXT (JSON) | NOT NULL | JSON array of product categories |
| `product_specifications`| TEXT | NULLABLE | Detailed fabric GSM, yarn, embroidery crest notes |
| `attachments` | TEXT (JSON) | DEFAULT '[]' | JSON array of sample photo attachments |
| `interest_level` | TEXT | NOT NULL | `Hot`, `Warm`, `Cold`, `Not Interested` |
| `outcome_status` | TEXT | NOT NULL | `Open`, `Sample Sent`, `Quote Given`, `Won`, `Lost`, `Not Interested` |
| `follow_up_date` | TEXT | NULLABLE | Follow-up date string (or NULL / None) |
| `notes` | TEXT | NULLABLE | Field observations and meeting notes |
| `discovery_status` | TEXT | DEFAULT 'NOT_APPLICABLE' | `PENDING_VERIFICATION`, `VERIFIED_NEW`, `LINKED_EXISTING`, `NOT_APPLICABLE` |
| `discovery_bonus_awarded` | INTEGER | DEFAULT 0 | 1 if discovery bonus was awarded |
| `discovery_bonus_amount` | REAL | DEFAULT 0 | Bonus amount (e.g. ₹1,000) |
| `verified_by_id` | INTEGER | NULLABLE | Verifier ID |
| `verified_by_name` | TEXT | NULLABLE | Verifier name |
| `verified_at` | DATETIME | NULLABLE | Verification timestamp |
| `verification_notes` | TEXT | NULLABLE | Verification remarks |
| `last_edited_by_name` | TEXT | NULLABLE | Name of last user who edited record |
| `last_edited_by_role` | TEXT | NULLABLE | Role of last editor |
| `last_edited_at` | DATETIME | NULLABLE | Last edit timestamp |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

---

### Table 4: `audit_logs`
Immutable change log recording field-level diffs on visit modifications.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log ID |
| `visit_id` | INTEGER | NULLABLE | Target visit record ID |
| `actor_id` | INTEGER | NOT NULL, FK -> `users(id)` | User who made the change |
| `actor_name` | TEXT | NOT NULL | Name of user |
| `actor_role` | TEXT | NOT NULL | Role of user |
| `action` | TEXT | NOT NULL | `CREATE`, `UPDATE`, `DELETE`, `VERIFY_DISCOVERY` |
| `changed_fields` | TEXT (JSON) | NOT NULL | JSON array: `[{ field, from, to }]` |
| `timestamp` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Action timestamp |

---

### Table 5: `master_schools`
Curated catalog of statewide verified schools across Tamil Nadu.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Format: `SCH-TKS-001`, `SCH-TNV-005` |
| `school_name` | TEXT | NOT NULL | Official name of school |
| `district` | TEXT | NOT NULL | District |
| `block_or_cluster` | TEXT | NULLABLE | Block or cluster |
| `zone` | TEXT | NULLABLE | Zone (South, North, Central, West TN) |
| `board` | TEXT | NULLABLE | CBSE, Matriculation, ICSE, State Board |
| `area` | TEXT | NULLABLE | Street / town locality address |
| `student_strength` | INTEGER | NULLABLE | Recorded student strength |
| `contact_person` | TEXT | NULLABLE | Principal / Administrator name |
| `phone` | TEXT | NULLABLE | Official contact phone |
| `priority` | TEXT | DEFAULT 'Medium' | Account priority |
| `status` | TEXT | DEFAULT 'ACTIVE' | `ACTIVE`, `INACTIVE` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last sync/update timestamp |

---

### Table 6: `products`
Reference catalog of apparel product lines.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Product ID |
| `name` | TEXT | NOT NULL | Product name (Socks, Belts, Ties, Uniforms, etc.) |
| `category` | TEXT | NOT NULL | Category classification |
| `unit_price` | REAL | NOT NULL | Base reference unit price |
| `unit` | TEXT | NOT NULL | Unit of measure (pairs, pcs, sets) |
| `hsn` | TEXT | NOT NULL | HSN Code for GST billing |
| `gst_rate` | REAL | DEFAULT 18.0 | Standard GST percentage |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

---

### Table 7: `quotations`
Stores formal sales quotations issued to institutions.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Format: `QTN-2026-XXX` |
| `visit_id` | INTEGER | NULLABLE | Linked visit ID |
| `canvasser_id` | INTEGER | NOT NULL, FK -> `users(id)` | Attributed canvasser ID |
| `canvasser_name` | TEXT | NOT NULL | Attributed canvasser name |
| `school_name` | TEXT | NOT NULL | Customer institution name |
| `district` | TEXT | NOT NULL | District |
| `contact_person` | TEXT | NOT NULL | Principal / Contact person |
| `phone` | TEXT | NOT NULL | Phone number |
| `items` | TEXT (JSON) | NOT NULL | JSON array of line items (`{ description, hsn, size, qty, rate, gst, amount }`) |
| `subtotal` | REAL | NOT NULL | Taxable amount |
| `tax_amount` | REAL | NOT NULL | Total GST calculated |
| `discount_amount` | REAL | DEFAULT 0 | Applied discount |
| `grand_total` | REAL | NOT NULL | Total quotation value (₹) |
| `status` | TEXT | DEFAULT 'Sent' | `Draft`, `Sent`, `Converted` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Issue timestamp |

---

### Table 8: `invoices`
Stores official tax invoices and accounts receivable tracking.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Format: `INV-2026-XXX` |
| `quotation_id` | TEXT | NULLABLE | Linked source quotation ID |
| `visit_id` | INTEGER | NULLABLE | Linked source visit ID |
| `canvasser_id` | INTEGER | NOT NULL, FK -> `users(id)` | Attributed canvasser ID |
| `canvasser_name` | TEXT | NOT NULL | Attributed canvasser name |
| `school_name` | TEXT | NOT NULL | Customer institution name |
| `district` | TEXT | NOT NULL | District |
| `contact_person` | TEXT | NOT NULL | Principal / Contact person |
| `phone` | TEXT | NOT NULL | Phone number |
| `items` | TEXT (JSON) | NOT NULL | JSON array of itemized invoice line items |
| `subtotal` | REAL | NOT NULL | Taxable amount |
| `tax_amount` | REAL | NOT NULL | Total GST calculated |
| `discount_amount` | REAL | DEFAULT 0 | Applied discount |
| `grand_total` | REAL | NOT NULL | Total invoice bill value (₹) |
| `paid_amount` | REAL | DEFAULT 0 | Cumulative payments collected |
| `outstanding_balance` | REAL | NOT NULL | Pending balance remaining (`grand_total - paid_amount`) |
| `payment_status` | TEXT | DEFAULT 'Unpaid' | `Unpaid`, `Partially Paid`, `Paid` |
| `due_date` | TEXT | NULLABLE | Due date |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Invoice date |

---

### Table 9: `payments`
Audit log of payment installments received against tax invoices.

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Format: `PAY-XXXX` |
| `invoice_id` | TEXT | NOT NULL, FK -> `invoices(id)` | Target invoice ID |
| `school_name` | TEXT | NOT NULL | Institution name |
| `amount` | REAL | NOT NULL | Installment amount collected (₹) |
| `payment_method` | TEXT | NOT NULL | `NEFT`, `UPI`, `Cheque`, `Cash` |
| `reference_number` | TEXT | NULLABLE | Bank UTR / Cheque reference ID |
| `recorded_by_name` | TEXT | NOT NULL | Name of user who logged payment |
| `recorded_by_role` | TEXT | NOT NULL | Role of user |
| `recorded_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Payment timestamp |

