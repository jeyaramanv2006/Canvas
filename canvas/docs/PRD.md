# Product Requirements Document (PRD)

## Product Vision
Murugan Canvass is a mobile-first web application designed for Murugan Enterprises to digitize and streamline school apparel expansion field sales (socks, belts, ties, shoes, uniforms, bags, track pants, etc.). It converts field visits into structured, actionable data for faster district expansion and school tie-ups.

## Problem Statement
- **Scattered Notes**: Field visit details currently live in paper notebooks, WhatsApp chats, or memory, making follow-ups inconsistent.
- **No Shared View**: Managers lack real-time visibility into district performance, product demand, and canvasser activity.
- **Lost Follow-ups**: Hot leads cool down because next-action dates are not tracked centrally.
- **Slow Decisions**: Leadership lacks aggregate pipeline data to prioritize market expansion.

## Target Users
1. **Field Canvassers**: Sales team members visiting schools, colleges, and distributors.
2. **Managers / Leadership**: Administrators evaluating team performance, district win rates, and product demand.

## User Needs
- **Canvassers**: Fast single-screen visit logging, multi-select product chips, clear interest level tagging, overdue follow-up alerts, and easy status updates (Won/Lost).
- **Managers**: Centralized live dashboard with metrics (Total Visits, Hot Leads, Orders Won, Win Rate %), aggregate charts, team performance rankings, and one-click CSV data exports.

## Goals
- Provide a single source of truth for all field canvassing activity.
- Enable secure multi-user access with real-time cloud sync.
- Improve sample-to-purchase-order conversion rates.

## Use Cases
- Canvasser logs a school visit with institution type, strength, product interests, interest level, and follow-up date.
- Canvasser filters their visits to review upcoming and overdue follow-ups.
- Canvasser updates a visit status from "Warm" to "Won" or "Lost".
- Manager views live aggregate analytics (Win Rate %, Product Demand, Top Districts) to guide strategy.
- Manager exports field data to CSV for leadership reporting.

## Product Scope
- **Frontend**: Mobile-first Web Application built with HTML, Tailwind CSS, and React.
- **Backend**: Secure REST API.
- **Database**: Relational Database with Users and Visits entities.
- **Security**: Email/password login with JWT-based Role-Based Access Control (RBAC).

## Out-of-Scope Items (Proposed / Future Upgrades)
- GPS check-in / auto-location verification.
- School gate & sample photo upload.
- One-tap WhatsApp visit summary sharing.
- Automated live sync to external CRM or Google Sheets.
