# Security Policy & Architecture

## Security Objectives
- Protect authentication credentials and prevent unauthorized access.
- Strictly enforce role-based access boundaries between field canvassers and managers.
- Prevent data tampering across user accounts.

## Threat Model & Controls

| Threat | Risk Level | Mitigation Strategy |
|---|---|---|
| Credential Theft / Leaks | High | Scramble passwords using standard hashing algorithms (bcrypt/argon2); never store plain text. |
| Unauthorized Data Access | High | Require JWT signature validation on all protected routes. |
| Canvasser Cross-Access | Medium | Enforce `canvasser_id = req.user.id` SQL filtering at API controller level. |
| Manager Overreach | Low | Restrict manager accounts from creating/modifying visit entries directly to preserve data authenticity. |
| Token Spoofing | High | Sign JWT tokens with a secret key stored in environment variables. |

## Role Scoping Summary
- **Canvasser**: Read/Write own visit entries only.
- **Manager**: Read-only global access + aggregate metrics + CSV export.
