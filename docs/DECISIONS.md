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

### DEC-004: Two-Role RBAC Model with Layer-Based Access Scoping
- **Status**: CONFIRMED
- **Context**: The client established a 2-role architecture where:
  1. **Admin / Leadership Role**: Covers **L1 through L3 (Executive, Commercial, Finance, Marketing Manager)**. Sees full management financials, strategy metrics, revenue, EBITDA, cash flow, receivables/payables, and campaign ROI.
  2. **Field Canvasser Role**: Covers **L4 (Sales / Field Canvassing & Execution)**. Sees field leads, school visits, orders won, conversion %, and competitive field leaderboard. Top-level corporate financials (EBITDA, Gross Profit %, Cash Position) are strictly masked.
- **Decision**: Enforce this 2-role model with layer scoping in `src/lib/rbac.js`.
- **Rationale**: Keeps user management simple with 2 concrete roles while enforcing the client's exact data visibility and financial masking rules.

### DEC-005: Canvasser Scope Refinement & Competitive Field Leaderboard
- **Status**: CONFIRMED
- **Context**: Client clarified that field canvassers should not have access to Invoicing or Marketing tabs. Invoicing, price negotiation with school principals, and quotation dispatch are centralized with the Admin. Canvassers need a competitive motivator to see team performance and invoiced value generated.
- **Decision**:
  1. Remove Invoicing and Marketing tabs/actions completely from the Canvasser dashboard.
  2. Implement a dedicated, read-only **Canvasser Leaderboard** (`CanvasserLeaderboard.jsx`) that displays all canvassers ranked by Total Invoiced Value Generated (₹), Total School Visits, and Won Deals.
  3. Ensure aggregate numbers are rendered without exposing confidential school-specific pricing or competitor client data.
  4. Attribute all Admin-generated quotations and invoices to the originating field canvasser (`canvasser_id`), automatically updating the leaderboard.
- **Rationale**: Preserves administrative control over company billing and margins while fueling field team competition and gamification.

### DEC-006: Institutional Master School Database & Search-First Canvasser Entry with Discovery Tracking
- **Status**: CONFIRMED
- **Context**: Canvassers need rapid access to verified school information across all target districts in Tamil Nadu to avoid manual typos and duplicate records, while retaining the flexibility to log visits to new, uncataloged institutions discovered in the field. Admin needs to monitor which visits come from pre-cataloged institutions vs newly discovered leads for master database maintenance.
- **Decision**:
  1. Create a curated Institutional Master Database (`masterSchools.js` / `MasterSchools` table) seeded with verified school records across all Tamil Nadu districts.
  2. Implement `<SchoolSearchPicker.jsx>` enabling instant fuzzy search across School Name, District, and Block/Cluster with auto-fill of institution metadata.
  3. Support seamless fallback to manual custom entry for unlisted schools.
  4. Track database origin (`is_from_master_db: true/false`, `master_school_id`) on all visit records.
  5. Provide visual origin badges (`🏛️ Master DB School` vs `🆕 Newly Discovered`) and origin filtering in both Canvasser feeds and Admin Central Visit Registry.
### DEC-007: Canvasser Workflow Simplification, Restricted Statuses, Specifications/Photo Logging, and Tiered Commission Slabs (1% - 5%)
- **Status**: CONFIRMED
- **Context**: Client established the exact field-to-invoice workflow:
  1. Canvasser visits school, selects from master DB (or enters unlisted), inputs contact/strength, selects product interests, types custom product specifications notes (GSM, material, sample requests), attaches sample photos/images, sets follow-up (or None), and selects outcome strictly from `[Open, Sample Sent, Not Interested]`.
  2. Admin views all visit logs with full audit trail history (who changed what and when), contacts principals, and generates Quotations/Tax Invoices directly from the catalog.
  3. Once order is confirmed, Admin generates invoice and credits canvasser sales (visit outcome updates to `Won`), automatically applying tiered commission slabs (1% to 5%).
  4. Real-time Leaderboard with commission tier badges, commission earnings, and progress bars.
  5. Complete removal of Marketing Hub section for both canvassers and admins.
- **Decision**:
  1. Restrict canvasser status selection to `Open`, `Sample Sent`, `Not Interested`. `Quote Given`, `Won`, and `Lost` are managed exclusively by Admin.
  2. Add `product_specifications` and `attachments` to visit schema and forms.
  3. Support flexible follow-up (date picker or "No Follow-up Needed").
  4. Implement commission slab tiers in `mockApi.js`:
     - 1-5L: 1%
     - 5-10L: 2%
     - 10-15L: 3%
     - 15-20L: 4%
     - >20L: 5% Max
  5. Display commission slab badges, commission earned (₹), and slab progress bar on the Leaderboard and Canvasser KPI cards.
  6. Remove Marketing Hub section completely from Canvasser and Admin interfaces.
- **Rationale**: Exactly aligns with the client's operational hierarchy, incentivizes field sales through transparent tier upgrades, and streamlines CRM data entry.

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
