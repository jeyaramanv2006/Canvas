# Production-Readiness Implementation Handoff

## 1. Purpose and outcome

Implement this repository so it can be deployed as a real, small-scale production application for recording canvassing visits and creating/printing invoices. The frontend must use the Express API and persistent SQLite database as its single source of truth. It must no longer use browser-local mock data for any live workflow.

The intended production topology is:

```text
Users' browsers
    |
    | HTTPS
    v
Vercel: React/Vite frontend
    |
    | HTTPS + Bearer JWT
    v
Railway: Express API, exactly one application replica
    |
    v
Railway persistent volume: SQLite database and its WAL files
```

The owner needs the application urgently for real canvassing. Treat visit records, quotations, invoices, payments, user access, and audit trails as business data. Do not deploy a build that silently falls back to mock data, localStorage, fabricated KPI figures, or browser-only persistence.

## 2. Confirmed decisions and scope

### Confirmed

1. Deploy the React frontend to Vercel.
2. Deploy the Express backend to Railway.
3. Use the existing SQLite implementation as an interim production database.
4. Railway must run one backend instance only while SQLite is in use.
5. Store SQLite data on a Railway persistent volume, not in the repository/application filesystem.
6. Integrate the frontend with the backend before deploying.
7. The immediate live scope is authentication, field visits, master-school lookup, quotations/invoices, payments, audit history, and the role-based dashboards that rely on those records.
8. Invoice delivery by email/WhatsApp is **not** part of the existing implementation. Preserve browser print/download behavior; do not claim that an invoice has been sent electronically.

### Explicitly out of scope unless separately approved

1. Migrating from SQLite to PostgreSQL.
2. Multiple API replicas, load balancing, or distributed SQLite replication.
3. Email, WhatsApp, SMS, payment-gateway, or file-upload integrations.
4. New dashboard features, new data models, or a redesign.
5. Changing product/business policy except where required to make existing frontend/backend behavior agree.

If implementing a task requires an out-of-scope architectural choice, stop, document the reason and options, and request approval. Do not silently choose one.

## 3. Current repository assessment (must be understood before edits)

### Backend: implemented but not connected to the UI

The backend is an Express API in `backend/`, using `node:sqlite` and a file database currently resolved as `backend/data/canvas.db`. It exposes real endpoints for:

- login / current-user / password reset;
- users and CEO approval actions;
- visit CRUD and audit trail;
- analytics and leaderboard;
- master-school directory and CSV export;
- product, quotation, invoice, payment, and CFO analytics.

Routes are declared in `backend/server.js`. The SQLite schema and seed data are in `backend/database/db.js`. Controllers are in `backend/controllers/`.

### Frontend: currently mock-driven

The frontend imports `frontend/src/mockApi.js` throughout the application. This file simulates response delays, uses hard-coded demo data, calculates many dashboard values in the browser, and persists changes to browser `localStorage`.

The login screen calls `mockApi.login`. Most components and dashboard pages call `mockApi` directly. There is no Vite proxy and no production API base URL. The one optional password-reset `fetch` is not a reliable integration because login does not currently persist the actual token.

This means the existing deployed frontend would not write real visits/invoices to the backend database.

### Important current mismatches to reconcile

Do not assume matching names mean matching behavior. Create a written endpoint/field mapping before converting each workflow.

Known examples:

1. Frontend roles use `canvasser` and `admin_exec`; backend seeded users use `cvs` and `admin` in some places. Normalize these safely at the API boundary or standardize the backend and frontend consistently. Do not weaken authorization to hide a mismatch.
2. The mock API returns fields in camel/mixed formats and calculates UI-specific values; backend rows commonly use snake_case. Normalize deliberately.
3. The mock master-school API may return an array, whereas the backend list endpoint returns a paginated object containing `schools`, `total`, and page metadata.
4. The mock dashboards use fabricated estimates for portions of revenue, margins, marketing, campaigns, dispatch, and inventory. Do not present these as persisted facts. Either derive them from actual backend records with clearly defined calculation rules, or retain an explicitly labelled unavailable/empty state for out-of-scope areas.
5. Invoice/quotation ownership must credit the originating canvasser when an admin creates the document. Verify this end-to-end. The current backend creation path derives `canvasser_id` from the authenticated user, which can wrongly credit an admin. Fix this with authorization and validation, not by trusting arbitrary client IDs.
6. The frontend has a user/approval experience stored in localStorage while the backend has a real `pending_user_actions` workflow. Connect the UI to the backend workflow rather than maintaining two approval queues.
7. The existing invoice modal supports printing through the browser. It does not send invoice emails or messages.

## 4. Non-negotiable data and security rules

1. Never use `mockApi`, localStorage mock records, or hard-coded demo numbers as a fallback after production API integration is complete.
2. `localStorage` may contain only the authentication session (JWT and minimal user/session state), never authoritative visits, invoices, payments, approvals, products, or schools.
3. All API requests except public login/health must send `Authorization: Bearer <JWT>`.
4. Authentication must persist across browser refreshes and restore the user only after token validation with `/api/auth/me` (or an equivalent secure, existing endpoint).
5. On HTTP 401/403, clear the expired/invalid session, return the user to login, and show a useful error. Do not use a fake token or fake user as recovery.
6. Do not expose JWT secrets, database paths, Railway tokens, or private values to the Vite bundle.
7. Replace the insecure development-default JWT secret requirement with a mandatory production environment variable. The API must fail fast at production startup if `JWT_SECRET` is absent or clearly insecure.
8. Restrict CORS to the configured Vercel production domain and explicitly allowed preview/development origins. Do not leave `origin: '*'` in the production configuration.
9. Preserve backend RBAC: field canvassers may access only their own records; privileged roles may access the scopes defined by the product. Verify authorization server-side, not only by hiding UI controls.
10. Do not log passwords, JWTs, Authorization headers, or personally sensitive data in browser/server logs.

## 5. Required implementation work

### Phase A — establish configuration and persistence

#### A1. Backend configuration

Implement typed/validated environment configuration in the backend. At minimum support:

```text
NODE_ENV=development|production|test
PORT=<provided by Railway>
JWT_SECRET=<secret; never committed>
DATABASE_PATH=<absolute SQLite path>
ALLOWED_ORIGINS=<comma-separated frontend origins>
```

Requirements:

- Default database path may remain suitable for local development.
- In production, `DATABASE_PATH` must be required and must resolve to the Railway mounted volume, e.g. `/data/canvas.db`.
- Create the database parent directory when appropriate.
- Keep SQLite WAL mode, busy timeout, and foreign keys enabled.
- Ensure `canvas.db`, `canvas.db-wal`, and `canvas.db-shm` all reside in the same mounted persistent directory.
- Do not seed destructive demo data into a non-empty production database. Existing initialization mostly guards against empty tables; review every seed routine and make it deterministic/safe.
- Add a `/api/health` response that verifies the process is alive and reports database connectivity without leaking secrets or internal paths. A database failure should produce a non-healthy response.

#### A2. Railway deployment configuration

Add the project files/instructions needed for Railway to deploy this monorepo reliably. The implementation must support:

- backend service root directory: `backend`;
- install command: production dependencies for the backend;
- start command that supports the Node version required by `node:sqlite`;
- binding to Railway's supplied `PORT` on all interfaces;
- persistent volume mounted at `/data`;
- one application replica only;
- health-check path `/api/health`;
- a clearly documented supported Node version in `backend/package.json` or deployment configuration.

Do not rely on root `start:backend` if it bypasses the `node:sqlite` runtime requirements. Make the documented Railway command match the command actually tested locally.

#### A3. Frontend configuration

Create frontend environment configuration with:

```text
VITE_API_BASE_URL=http://localhost:5000   # local only example
VITE_API_BASE_URL=https://<Railway public domain>  # Vercel production value
```

Requirements:

- Never hard-code a Railway, Vercel, localhost, or preview URL in source code.
- Validate the base URL at startup/build time and remove trailing slashes before composing API paths.
- Use the same client for all frontend API calls.
- Document `.env.example` files without real credentials.
- Add Vercel SPA rewrite configuration so direct navigation to `/canvasser`, `/manager`, `/ceo`, `/cfo`, and `/cco` serves the React app rather than a 404.

### Phase B — build a real frontend API client and session handling

#### B1. API client

Create a focused module, for example `frontend/src/lib/apiClient.js`, that:

- reads `VITE_API_BASE_URL`;
- builds request URLs as `${baseUrl}/api/...`;
- sends JSON headers;
- attaches the JWT for protected routes;
- parses success/error response bodies consistently;
- throws actionable errors for failed responses;
- has a testable request layer;
- never silently returns mock data if an API request fails.

Use a domain API layer (for example `frontend/src/lib/api.js` or small modules by domain) over that client. Components must not construct raw URLs or manually duplicate authentication headers.

#### B2. Session/authentication

Replace mock login with:

1. `POST /api/login` using username and password.
2. Store only the returned JWT in a clearly named session key.
3. Store the returned user only as non-authoritative rendering state.
4. On app bootstrap, call `GET /api/auth/me` using the stored token before considering the user signed in.
5. Provide a logout control that clears the session.
6. Use the authenticated backend user role for routing and UI permissions.
7. Connect password reset to `POST /api/auth/reset-password`; remove its mock-first update behavior.

No code path may manufacture `mock-jwt-token-*` values.

### Phase C — replace mock API workflows in priority order

Remove/import-isolate `mockApi.js` only after all consumers have a real equivalent. It may remain temporarily as an unused development fixture during conversion, but must not be imported by the production application on completion.

#### C1. Must work before real users are invited

1. Authentication and logout.
2. Master-school search/picker, including pagination/query adaptation.
3. Visit list, details, create, update, and delete.
4. Server-provided visit audit history.
5. Role-scoped visit visibility.
6. Quotations: list and create.
7. Invoices: list and create.
8. Payment recording and refreshed invoice status/balance.
9. Printable invoice/quotation output using persisted API data.
10. Dashboards/leaderboard: use backend-provided data or clearly defined calculations based only on fetched records.

#### C2. Required correctness rules for financial records

- An invoice or quotation created for a canvasser's lead must retain the originating `canvasser_id` and `canvasser_name` from the linked visit/approved lead, while the audit log should record the actual executive who created it.
- The backend, not the client, must validate that the selected source visit exists and that the actor is authorized to use it.
- Prevent arbitrary users from setting another canvasser's credit by posting an unchecked ID.
- Validate all required invoice/quotation fields and totals server-side. Choose one clear source of truth for arithmetic and test it; do not accept mismatched client totals without validation.
- Preserve audit trails and do not overwrite prior invoices/payments.
- Payment recording must not permit negative payments, overpayments unless explicitly supported, or updates to nonexistent invoices.
- Use collision-resistant IDs or reliable database sequencing for quotations, invoices, and payments. Do not rely on a small random numeric suffix that can collide in real use.

#### C3. Governance workflows

Connect user management and CEO approval UI to real endpoints only if it can be fully tested within this release. If not, remove or visibly disable the unfinished controls instead of allowing them to appear functional while only changing localStorage.

The same rule applies to marketing, dispatch, inventory, and any other mock-only feature: hide/label as unavailable until there is a real persisted backend capability. Do not ship a control that pretends to save business data.

### Phase D — data migration and seed policy

1. Do not depend on current frontend localStorage as production data. It is browser-specific and not authoritative.
2. Ask the owner whether any browser-local mock records need preserving. If yes, provide a reviewed, one-time export/import process with validation and a backup. Do not run a bulk import automatically.
3. Keep seeded demo accounts/data only for local development/test environments. Production should start with deliberate authorized accounts and approved initial data.
4. If demonstration data is required in production for a client walkthrough, mark it clearly and isolate it from genuine business records. Obtain explicit approval before inserting it.
5. Before launch, create the production database on the mounted volume, record its schema version, and take a backup.

### Phase E — backups and operational readiness

Implement/document a safe SQLite backup process. Do not merely copy a live `canvas.db` file while WAL mode is active without handling its WAL state.

Minimum operational deliverables:

- a documented command or endpoint-free admin procedure to create a consistent SQLite backup;
- an encrypted/private off-platform backup location or a clearly documented manual backup process;
- a restore test in a non-production environment;
- deployment/restart persistence verification;
- a short runbook for checking Railway logs and `/api/health`;
- a rollback procedure that does not overwrite the live database accidentally.

## 6. Deployment setup values (owner supplies separately)

Do not commit these values. Use deployment-platform environment variable settings.

### Values required from the owner

```text
1. Railway production public API domain
   Example: https://canvas-api-production-xxxx.up.railway.app

2. Vercel production frontend domain
   Example: https://canvas-app.vercel.app

3. Production JWT secret
   A newly generated long random value; never use an existing demo/default secret.

4. Railway persistent volume mount path
   Required target for this implementation: /data

5. Chosen initial production administrator/CEO account provisioning method
   Do not expose real passwords in the repository.

6. Optional custom domains, if already owned
   Example: https://app.example.com and https://api.example.com
```

### Required environment-variable placement

| Platform/service | Variable | Value |
| --- | --- | --- |
| Railway backend | `NODE_ENV` | `production` |
| Railway backend | `JWT_SECRET` | owner-provided private random secret |
| Railway backend | `DATABASE_PATH` | `/data/canvas.db` |
| Railway backend | `ALLOWED_ORIGINS` | exact Vercel production origin, plus explicitly approved preview origins if required |
| Vercel frontend | `VITE_API_BASE_URL` | public Railway API origin, e.g. `https://canvas-api-production-xxxx.up.railway.app` |

Do not put `JWT_SECRET`, Railway tokens, or database credentials in Vercel variables. `VITE_*` variables are shipped to browser clients and must be treated as public.

## 7. Required tests and release gates

The agent must implement and run tests proportionate to the risk. Do not report this work complete merely because it builds.

### Backend tests

At minimum test:

- health endpoint and database failure handling;
- login success/failure and token validation;
- authorization for canvasser vs privileged roles;
- a canvasser cannot read/edit/delete another canvasser's visit;
- visit creation/update produces audit records;
- master-school read/search works;
- quotation and invoice creation from an eligible visit preserves originating canvasser credit;
- payment validation and balance/status updates;
- user/approval actions if released;
- persistence behavior using a test database path, never the real production database.

### Frontend tests/manual acceptance test

At minimum prove:

1. Fresh browser with no localStorage mock records can log in through the Railway API.
2. Refreshing the browser preserves a valid session and fetches the real user.
3. A canvasser creates a visit; it is present after browser refresh and from a second browser/session.
4. An executive sees that visit and its audit history.
5. An authorized executive creates a quotation/invoice tied to the visit; canvasser attribution is correct.
6. A payment updates the same persisted invoice accurately.
7. The printable document uses persisted invoice data.
8. A simulated API error shows a useful failure state and does not create browser-local replacement data.
9. Direct-load each protected Vercel route and verify SPA routing works.
10. Redeploy/restart Railway, then verify previously created test records remain in the database.

### Required final verification report

Provide a concise report containing:

- every changed file and why;
- exact local development commands;
- exact Railway root/build/start settings;
- exact Vercel root/build/output settings;
- environment variable names only (never secret values);
- API endpoints mapped from former mock calls;
- test results and manual checks performed;
- remaining intentionally unavailable features;
- deployment/rollback/backup procedure;
- any assumptions or unresolved product decisions.

## 8. Completion definition

The work is complete only when all statements below are true:

- The production frontend contains no active `mockApi` imports or localStorage business-data fallback.
- Login, visit capture, invoice/quotation creation, and payment recording make authenticated requests to the configured Railway API.
- Real data persists across a Railway redeploy because SQLite is on the mounted volume.
- The public Vercel frontend successfully communicates with the Railway backend using HTTPS and approved CORS origins.
- The system has been tested in a staging-like deployment with two separate browser sessions.
- Unfinished mock-only capabilities are unavailable/clearly labelled, not simulated as real saved data.
- No secret is committed to Git or exposed to the browser bundle.
- The owner can follow the final runbook to deploy Vercel and Railway without modifying source URLs manually.

## 9. Instructions to the implementation agent

1. Read `AGENTS.md` and all relevant `docs/` files before making changes.
2. Treat this document's **Confirmed** section as requirements and **Out of scope** section as boundaries.
3. Inspect the actual code and tests before assuming any endpoint schema.
4. Preserve unrelated user changes; do not reset or overwrite the existing database.
5. Use a dedicated test database, not `backend/data/canvas.db`, for automated tests.
6. Update documentation and `docs/DECISIONS.md` whenever a material implementation decision is made.
7. Do not deploy to Railway or Vercel yourself unless the owner explicitly authorizes external deployment actions and supplies the necessary account access/values.
8. Stop and ask for direction if a critical unresolved business rule could compromise record ownership, invoice accuracy, authorization, or production data.
