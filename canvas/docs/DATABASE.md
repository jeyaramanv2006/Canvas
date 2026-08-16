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
