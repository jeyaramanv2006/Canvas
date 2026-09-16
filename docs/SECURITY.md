# Security Policy & Architecture

## Security Objectives
- Protect authentication credentials and prevent unauthorized access.
- Strictly enforce role-based access boundaries across the 5 enterprise tiers (CEO, CFO, CCO, Admin Executive, Canvasser).
- Maintain immutable audit trail logs of all data modifications and field discoveries.
- Ensure administrative accountability via CEO approval queues for high-impact mutations.

## Threat Model & Controls

| Threat | Risk Level | Mitigation Strategy |
|---|---|---|
| Credential Theft / Leaks | High | Hash passwords securely with `bcrypt` (10 rounds); never log or store plain text passwords. Enforce mandatory password resets on suspicious or provisioned accounts. |
| Unauthorized Data Access | High | Enforce stateless JWT signature validation on all protected endpoints (`authenticateToken` middleware). |
| Cross-Tenant / Canvasser Data Leaks | Medium | Scope canvassers to their own visit records for updates/deletions (`canvasser_id = req.user.id`). Mask top-level executive financials from non-authorized roles. |
| Unauthorized Administrative Mutations | Medium | Route all Admin-initiated user lifecycle actions (Create, Role Change, Pause, Resume, Delete) and Master School modifications to the CEO Approval Queue (`pending_user_actions`). |
| Data Tampering / Unaudited Overwrites | Low | Record all record modifications, verifications, and deletions in `audit_logs` with actor details, timestamps, and field-level diffs. |
| Account Takeover / Terminated Employee Access | High | Instant account suspension (`PAUSED` / `DELETED`) that preserves all historical sales attribution and visit records while immediately revoking login authorization. |
| Token Spoofing / Tampering | High | Sign JWT tokens with HMAC-SHA256 using a server-side secret key from environment variables (`JWT_SECRET`) with a 7-day expiration. |

## Role Scoping Summary
- **CEO (`ceo`)**: Global unrestricted authority; direct execution of user and master school actions; review and approval authority for queued actions.
- **CFO (`cfo`)**: Full financial and accounting visibility; P&L, GP%, receivables aging, and commercial reporting access.
- **CCO (`cco`)**: Operational and field canvassing coordination; conversion funnels and team performance visibility.
- **Admin Executive (`admin_exec` / `admin`)**: Data management, visit review & audit trail inspection, custom quotation & tax invoice generation; user and school catalog mutations routed to CEO approval.
- **Canvasser (`cvs` / `canvasser`)**: Scoped to own field visit entries; discovery of unlisted schools; specifications and photo logging; multi-criteria gamified leaderboard. Sensitive financial metrics strictly masked.

