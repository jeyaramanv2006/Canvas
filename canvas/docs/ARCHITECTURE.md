# Architecture

## System Architecture
```
[ Field Canvasser (Mobile) ] \
                              ==> [ React + Tailwind CSS Web Client ] ==> [ REST API Backend ] ==> [ Relational DB ]
[ Manager (Laptop/Desktop)  ] /                                                  ||
                                                                          (JWT Auth & RBAC)
```

## System Components

### 1. Frontend Web Client (React + Tailwind CSS)
- **Canvasser Interface**: Single-screen visit entry form, product selector chips, follow-up calendar, filtered visits feed.
- **Manager Interface**: Executive metrics header, Doughnut/Bar analytics charts, team performance table, CSV export trigger.

### 2. Backend REST API
- Handles authentication, issues JWTs, enforces role permissions, executes validation, and computes aggregate metrics for manager charts.

### 3. Relational Database
- Persists user accounts and visit details with relational integrity (`canvasser_id` foreign key).

## Security & Data Flow
1. User submits login credentials (`POST /api/login`).
2. Backend verifies `password_hash` and generates signed JWT with embedded `userId` and `role`.
3. Client stores JWT token and attaches `Authorization: Bearer <token>` to all HTTP requests.
4. Backend middleware validates token, extracts role, and restricts query scope:
   - For `canvasser`: Queries automatically append `WHERE canvasser_id = userId`.
   - For `manager`: Global queries allowed for analytics endpoints.
