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
