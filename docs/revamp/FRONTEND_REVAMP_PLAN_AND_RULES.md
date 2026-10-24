# Frontend UI/UX Revamp Plan and Rules

## 1. Purpose

This document is the working charter for the frontend revamp of Murugan Groups “The One” application. The goal is to make the existing product feel cleaner, clearer, more polished, and more comfortable to use while preserving its current features, permissions, data, and user journeys.

The revamp is a **presentation and usability improvement**. It is not a product redesign that changes how the application works.

## 2. Supreme goal

> Enhance the aesthetic for users so the application looks and feels cleaner and neater, while keeping its existing functionality and user flows intact.

The visual system should feel consistent across screens, work on phones and desktops, and make existing actions easier to find. Every existing feature must remain available to the same authorized users and continue to produce the same result.

## 3. Design reference

Use the aesthetic guide added by the project owner to this `docs/revamp/` folder as the visual reference for each phase. The guide currently supplied is named **Aesthetic Web Design 403f9bfd34e480bf8b74df7c240eba49.md**; the owner may add or rename the copy in this folder.

Apply its visual direction—Vivid Void, Kroma Arch, Axis Prism, Modulo Vivid, Lucid Block, True Accent, Neon Metric, and Abstract Element—where it fits the screen. Adapt the intensity and layout to the task and device. The guide controls visual treatment; this charter controls functional preservation. A visual idea must not hide a feature, change access, or alter a workflow.

## 4. Non-negotiable rules

### 4.1 Frontend-only scope

- Do not edit backend files, database schemas, API routes, API authorization, server-side validation, server calculations, seed data, or deployment configuration as part of a UI phase.
- Do not change API request or response contracts, token handling, persistence, or the existing frontend API integration.
- The frontend calls the existing API through `mockApi.js` and `api/client.js`; preserve those connections and their behavior.
- If a frontend limitation appears to require a backend change, document the specific limitation and stop that dependent change for an explicit project decision. Do not silently work around it by changing the contract or substituting fake data.

### 4.2 Preserve every existing feature and flow

- Never remove, hide, replace with a placeholder, or make unreachable an existing feature, action, field, tab, route, modal, drawer, filter, export, document action, or status.
- Never change who can see or use a feature. Preserve the existing role-specific permissions and data boundaries.
- Never change business rules, calculations, status transitions, required fields, validation, API behavior, record ownership, or data meaning.
- Preserve complete journeys, including their intermediate states: open, edit, confirm, cancel, success, failure, loading, empty, and retry states where applicable.
- Preserve existing keyboard behavior, form submission, browser autofill, and mobile access to controls.
- Keep existing behavior even when redesigning its visual hierarchy. Improving discoverability is allowed; removing or weakening access is not.

### 4.3 Text and copy

- Text may be rewritten to improve clarity, consistency, grammar, tone, and visual fit.
- Copy edits must preserve the original meaning, urgency, warnings, permissions, requirements, and consequences.
- Do not turn a label into a different promise or imply that a planned, unavailable, sample, or placeholder capability is live.
- Keep legal, financial, security, approval, and operational meaning intact. Flag unclear copy rather than guessing.

### 4.4 Analysis before implementation

At the start of **every phase**, first perform a complete, clean analysis of the relevant frontend, not just the visible page or primary component. Identify all connected routes, shared components, role variants, actions, states, API calls, dependent modals, responsive navigation, and existing quirks. Use that analysis to create a feature-preservation checklist before editing.

The analysis must answer:

1. What can each affected role see and do before the change?
2. What complete workflows and alternate states are connected to the screen?
3. Which data fields, API calls, permissions, and business rules does the UI depend on?
4. Which shared components or other roles could be affected by the edit?
5. How will every existing action remain reachable on desktop and mobile?

Only after this inventory is clear should visual implementation begin. Preserve all existing behavior and change the UI around it without altering user flow.

### 4.5 Project decisions and uncertainty

- Do not invent requirements or silently treat assumptions as confirmed decisions.
- Distinguish confirmed behavior from proposals and unresolved questions.
- Do not make major access, navigation, product, or architectural decisions without explicit approval.
- Keep project documentation synchronized with confirmed implementation changes. Record important product or architectural decisions in `docs/DECISIONS.md`.
- Treat `notes/THOUGHTS.md` as raw notes, not as a substitute for a confirmed decision.

## 5. Definition of done for each phase

A phase is complete only when:

- Its analysis and feature-preservation checklist are complete.
- The intended visual changes match the design reference and work at mobile and desktop sizes.
- Every prior feature, action, role boundary, state, and path in the affected scope remains available and behaves as before.
- All connected modals, drawers, confirmation flows, loading states, errors, empty states, and successful outcomes have been accounted for.
- No backend or API contract was changed.
- The frontend build succeeds and the changed screens have been reviewed against the checklist.
- Any unresolved discrepancy or limitation is recorded clearly; it is not hidden by a design change.

## 6. Agreed revamp phases

The sequence below is the agreed order. Complete and review each phase before moving to the next. If analysis finds a dependency that makes the sequence unsafe, explain it and propose an adjustment without silently expanding scope.

### Phase 1 — Login screen

Revamp the login experience and its responsive presentation.

Preserve username/password authentication, required-field behavior, autofill, Enter-to-submit, loading and error states, token/session handling, role-based destination, session restoration, and the mandatory post-login password-reset flow. Do not add registration, password recovery, role selection, or new authentication behavior.

### Phase 2 — Shared app shell

Revamp the shared dashboard frame: brand/header placement, role and user identity, desktop navigation, mobile navigation, page width and spacing, background, and shared shell-level controls and feedback presentation.

Preserve each role’s existing navigation items and order unless the owner explicitly approves a change. Keep CEO approvals, CFO alerts, Canvasser follow-up indicators, sign-out, role labels, and the current responsive access to every tab. Do not redesign the business content of dashboard modules in this phase.

### Phase 3 — Canvasser: Log Visit and My Visits

Revamp the field canvasser’s visit-entry and visit-history journeys.

Include existing school search and master-database selection, manual entry/discovery, contact and strength fields, product interests and specifications, attachment/photo handling, follow-up choice, allowed status selection, validation, save feedback, visit list, edit/delete permissions, and edit history. Preserve all existing data capture and status restrictions.

### Phase 4 — Canvasser: Overview, Follow-ups, and Leaderboard

Revamp the Canvasser overview, Canvasser-scoped follow-up experience, and personal/team leaderboard presentation.

Preserve existing KPI meanings, follow-up date groupings and actions, personal data scoping, aggregate leaderboard visibility, rank/commission information, and all navigation from summary cards into the relevant screen. Do not expose competitor school-level or invoice detail.

### Phase 5 — Priority Follow-ups for Admin and CEO

Revamp the management follow-up workflow for the roles that currently have access.

Preserve the existing prioritization, due/overdue states, filters, search, record context, actions, and ability to reach the underlying visit or school record. Keep Admin and CEO capabilities consistent with their current permissions; do not assume their actions are identical.

### Phase 6 — CEO Dashboard Overview

Revamp the CEO overview and its links to other CEO sections.

Preserve the source and meaning of each metric, any drill-down behavior, approval entry points, navigation shortcuts, and all existing loading/error states. Do not present illustrative or placeholder figures as live data.

### Phase 7 — Master Schools Directory

Revamp the Master Schools directory and its existing management workflows, including search, filters, statistics, create/edit/delete flows, CSV export, and approval-request behavior where applicable.

**Role access must be confirmed before implementation.** The planning discussion referred to this screen as shared across Admin, CEO, CFO, and CCO, while the inspected current dashboard navigation exposes it to Admin Executive and CEO. A UI-only revamp must preserve the currently implemented access. Adding or removing role access is a product decision and must not happen silently.

### Phase 8 — Central Visit Logs

Revamp the central visit registry for roles that currently have access.

Preserve filters, search, visit details, school-origin markers, editing permissions, audit/history access, exports if present, and any role-specific view or action differences. Ensure the mobile layout still exposes every current operation.

### Phase 9 — User Directory and Roles

Revamp user administration and its connected approval/reset flows.

Preserve current access restrictions, user creation and role display, account lifecycle states, CEO approval queue behavior, Admin request behavior, password-reset flow, and historical-data preservation expectations. Keep approval and rejection outcomes, confirmation steps, and error states visible and clear. Do not alter governance rules.

### Phase 10 — Team Leaderboard

Revamp the team leaderboard for each role that currently sees it.

Preserve rankings, metric definitions, commission/incentive displays, privacy boundaries, filtering, time period behavior, and role-specific detail levels. The shared visual treatment must not make read-only data appear editable or reveal restricted records.

### Phase 11 — Invoicing and Records

Revamp the existing financial-document suite as a dedicated phase.

Cover Quotations & Estimates, Proforma Invoices, Invoices, and Payment Receipts; include analytics/graphs, filters, expandable details, line items, tags, statuses, create/edit/view/convert/delete actions, permanent document numbering, attribution, receipt/payment details, document preview, and print layout. Preserve financial calculations, source data, tax details, audit rules, and all role restrictions. Do not change document numbers, calculations, or backend behavior for visual convenience.

## 7. Role and access preservation checklist

The frontend currently has five role dashboards. Before changing a shared component, check all five:

- **Canvasser:** personal visit workflows, scoped follow-ups, and permitted aggregate leaderboard information.
- **Admin Executive:** operational follow-ups, Master Schools access as currently implemented, user/approval restrictions as currently implemented, invoicing, central visits, and team leaderboard.
- **CEO:** overview, follow-ups, Master Schools, invoicing, central visits, leaderboard, user directory, and approval controls.
- **CFO:** financial overview, invoicing, central visits, leaderboard, and financial alerts.
- **CCO:** existing overview/under-construction state, invoicing, central visits, and leaderboard.

This list describes inspected current UI surfaces, not permission to add new access. Backend authorization remains authoritative; frontend navigation must accurately reflect the current product access and must never be treated as the security boundary.

## 8. Known discrepancies to resolve without silently changing scope

- Some project documentation describes a two-role model, while the current frontend has five roles. Preserve current role behavior during the UI revamp until the owner confirms a change.
- The Master Schools role scope in the planning discussion differs from the current dashboard navigation. Resolve before expanding access in Phase 7.
- The CCO overview currently has an under-construction overlay. Preserve that current state during shell work; do not expose the underlying placeholder metrics as live.
- The CFO overview currently contains active financial functionality. Replacing it with an under-construction screen would hide existing features, which conflicts with this charter. Treat any such request as a product-scope decision requiring explicit confirmation before implementation.
- Commission and incentive documentation has multiple versions. Preserve the current frontend behavior and flag the documentation conflict before changing commission presentation or explanatory copy.

## 9. Change log for phase work

For every phase, record a short entry in the project’s work notes or the relevant phase handoff containing:

- The phase and screens/components covered.
- The analysis checklist and roles reviewed.
- The presentation changes made.
- Confirmation that user flow, feature access, data, and API behavior were preserved.
- Build/review result and any known limitation.
- Any unresolved question or decision needed for the next phase.

Do not mark a feature as removed, completed, or newly available unless the implementation and an approved product decision support that statement.
