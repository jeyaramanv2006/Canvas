# Architectural and Technical Decisions

## Approved Decisions

### DEC-001: Client-Server Architecture with React & Tailwind CSS
- **Status**: CONFIRMED
- **Context**: Mobile-first field canvassing requires a fast, responsive UI for field workers and clear dashboard visualizations for managers.
- **Decision**: Build frontend using HTML, Tailwind CSS, and React, backed by a REST API server.
- **Rationale**: React enables dynamic single-screen form state and chart rendering; Tailwind provides rapid, mobile-friendly responsive design.

### DEC-002: Relational Two-Table Database Schema
- **Status**: CONFIRMED
- **Context**: System needs clear relationships between field staff and their school visits.
- **Decision**: Implement two relational tables (`Users` and `Visits`) linked by `canvasser_id` foreign key.
- **Rationale**: Simple, clean, and easily queryable for aggregate manager analytics.

### DEC-003: JWT Authentication with Role-Based Scoping & Full CRUD
- **Status**: CONFIRMED
- **Context**: Canvassers manage their own field records (create, read, edit, delete). Managers require a high-level command center with full visibility, analytics, editing authority, and CSV export over all field records.
- **Decision**: Issue signed JWT tokens on login. Canvassers are scoped to their own logs with edit/delete rights; Managers have global view and edit/delete permissions over all records.
- **Rationale**: Empowers canvassers to maintain accurate logs while granting management full operational oversight.

### DEC-004: Two-Role RBAC Model with Layer-Based Access Scoping (Admin: L1–L3, Canvasser: L3–L4)
- **Status**: CONFIRMED
- **Context**: The client established a 2-role architecture where:
  1. **Admin / Leadership Role**: Covers **L1 through L3 (Executive, Commercial, Finance, Marketing Manager)**. Sees full management financials, strategy metrics, revenue, EBITDA, cash flow, receivables/payables, and campaign ROI.
  2. **Field Canvasser Role**: Covers **L3 (Marketing) + L4 (Sales / Canvassing & Execution)**. Sees field leads, school visits, quotations, orders won, conversion %, and marketing campaign collateral. Top-level corporate financials (EBITDA, Gross Profit %, Cash Position) are strictly masked.
- **Decision**: Enforce this 2-role model with layer scoping in `src/lib/rbac.js`.
- **Rationale**: Keeps user management simple with 2 concrete roles while enforcing the client's exact data visibility and financial masking rules.

---

## Decisions Required / Unresolved Questions

### DEC-REQ-001: Backend Runtime & API Framework Choice
- **Status**: DECISION REQUIRED
- **Options**: Node.js (Express / Fastify), Python (FastAPI / Flask), or Go.
- **Action**: Awaiting user selection on preferred backend tech stack.

### DEC-REQ-002: Relational Database Engine Choice
- **Status**: DECISION REQUIRED
- **Options**: PostgreSQL, SQLite, or MySQL.
- **Action**: Awaiting user selection on preferred database engine.
