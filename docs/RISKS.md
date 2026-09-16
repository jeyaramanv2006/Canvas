# Risk Assessment & Management

## Risk Log

| Risk ID | Category | Description | Severity | Mitigation Strategy |
|---|---|---|---|---|
| RSK-001 | Technical / UX | Weak mobile network connectivity at rural school campuses causing sync delays. | Medium | Design resilient form state with optimistic local storage caching; prepare offline queue for future phases. |
| RSK-002 | Data Quality | Inaccurate or incomplete field notes logged by canvassers. | Medium | Use Institutional Master School search picker to auto-populate school details, standard dropdowns, and mandatory contact fields. |
| RSK-003 | Security | Password leaks or JWT secret exposure. | High | Hash passwords with bcrypt (10 rounds); store JWT secret securely in environment variables; enforce HTTPS and mandatory password resets. |
| RSK-004 | Operational / Governance | Unauthorized administrative edits or tampering with field records. | Medium | Record all visit updates in immutable `audit_logs` with actor name, role, timestamp, and field diffs; route user and school modifications through CEO approval queue. |
| RSK-005 | Single Datastore Persistence | Concurrent writes or file lock contention during high-volume field canvassing on SQLite. | Low | Configure Write-Ahead Logging (`WAL` mode) and busy timeout in SQLite; retain seamless migration path to PostgreSQL / Neon via `pgAdapter.js`. |

