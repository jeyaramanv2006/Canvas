# Risk Assessment & Management

## Risk Log

| Risk ID | Category | Description | Severity | Mitigation Strategy |
|---|---|---|---|---|
| RSK-001 | Technical / UX | Weak mobile network connectivity at school campuses causing sync delays. | Medium | Design frontend form state to withstand temporary connection drops; consider offline `localStorage` queue for pilot. |
| RSK-002 | Data Quality | Inaccurate or incomplete field notes logged by canvassers. | Medium | Use quick multi-select product chips and required dropdown fields (Interest Level, Outcome Status) to standardize input. |
| RSK-003 | Security | Password leaks or JWT secret exposure. | High | Hash passwords securely; store JWT secret in server environment variables; enforce HTTPS. |
| RSK-004 | Operational | Managers modifying or logging visits directly, compromising data authenticity. | Low | Enforce API authorization rule disallowing manager roles from creating visit entries. |
