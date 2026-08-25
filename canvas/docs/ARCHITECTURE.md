# Architecture

## System Architecture
```
[ Field Canvasser (Mobile) ] \
                              ==> [ React + Tailwind CSS Web Client ] ==> [ REST API Backend ] ==> [ Relational DB ]
[ Admin / Manager (Desktop)  ] /         || (2-Role Layer Scoping)                 ||
                                         ||                                (JWT Auth & Role Scoping)
                                         v
                         [ Dynamic KPI Engine & Data Masking ]
```

## System Components

### 1. Frontend Web Client (React + Tailwind CSS)
- **RBAC Engine (`src/lib/rbac.js`)**: Defines the two core roles and their layer coverage:
  - **Admin**: Covers **L1 (Executive) through L3 (Commercial, Finance, Marketing)**.
  - **Canvasser**: Covers **L3 (Marketing) + L4 (Sales / Canvassing & Execution)**.
- **Dynamic KPI Section (`DynamicKPISection.jsx`)**: Context-aware metrics component rendering leadership financials for Admin (Revenue, Profit, EBITDA, Cash Flow, Marketing ROI) and operational metrics for Canvassers (Visits, Leads, Quotes, Orders Won, Value, Conversion %).
- **Manager Command Center (`ManagerDashboard.jsx`)**: High-level command room with Leadership KPIs, aggregate charts, complete visit logs CRUD, team leaderboard, Refrens Invoicing workspace, and L3 Marketing Hub.
- **Field Canvasser Interface (`CanvasserDashboard.jsx`)**: Mobile-first field app with Field KPIs, single-screen visit logging, visit history, quote generator, and direct access to L3 Marketing campaign assets & lookbooks.
- **Invoicing Module (`InvoicingModule.jsx`)**: Financial overview, quotations table, tax invoices table, payment transaction audit tracker, and product master pricing.
- **Marketing Hub (`MarketingCampaignsModule.jsx`)**: Campaign tracking, channel metrics, ROI, and digital/print sales collateral repository.

### 2. Backend REST API
- Handles authentication, issues signed JWTs with role identifier, enforces permissions, executes validation, computes analytics, and handles transactions.

### 3. Relational Database
- Persists user accounts, visits, products, quotations, tax invoices, and payment logs with relational integrity.

## Security & Data Scoping Flow
1. User logs in (`POST /api/login`).
2. Backend verifies credentials and returns JWT token with user role (`admin` or `canvasser`).
3. For **Admin**: Global access to all visits, full management financials, and marketing/operations controls.
4. For **Canvasser**: Scoped access to own visits, direct quotation creation, and L3 marketing collateral. Sensitive top-level company financials (EBITDA, Gross Profit %, Cash Position) are strictly masked.
