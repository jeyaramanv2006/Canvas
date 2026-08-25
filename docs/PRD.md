# Product Requirements Document (PRD)

## Product Vision
Murugan Canvass is a mobile-first web application designed for Murugan Enterprises to digitize and streamline school apparel expansion field sales (socks, belts, ties, shoes, uniforms, bags, track pants, etc.). It converts field visits into structured, actionable data for faster district expansion and school tie-ups.

## Problem Statement
- **Scattered Notes**: Field visit details previously lived in paper notebooks, WhatsApp chats, or memory, making follow-ups inconsistent.
- **No Shared View**: Managers lacked real-time visibility into district performance, product demand, and canvasser activity.
- **Lost Follow-ups**: Hot leads cooled down because next-action dates were not tracked centrally.
- **Slow Decisions**: Leadership lacked aggregate pipeline data to prioritize market expansion.

## User Roles & Layer Access Scoping

The system operates with **two primary user roles**:

### 1. Admin / Leadership (`admin`)
- **Layers Covered**: **L1 (Executive) down through L3 (Commercial, Finance, Marketing Manager)**.
- **What They Can Access & See**:
  - Full management dashboards and business metrics.
  - High-level financials: Total Revenue, Gross Profit, EBITDA, Cash Flow, Receivables/Payables, and Collection Rate.
  - Marketing & Growth strategy: Campaign ROI, Inbound Leads, and Customer Acquisition Costs.
  - Global oversight: All Canvasser visit logs, team performance rankings, and Refrens-style Invoicing & Payment tracking.

### 2. Canvassers / Field Sales (`canvasser`)
- **Layers Covered**: **L3 (Marketing) + L4 (Sales / Canvassing & Marketing Execution)**.
- **What They Can Access & See**:
  - Field operations: School Visit logging, lead capture, next-action calendar, and visit status updates.
  - Sales fulfillment: One-click quotation generation, order closures, and direct order values.
  - Marketing assets: Access to L3 campaign targets, school lookbook PDFs, durability test reports, and sales collateral.
- **Data Scoping & Masking**:
  - Sensitive corporate financials (Gross Profit, EBITDA, Balance Sheets, Company Margin %) are strictly hidden and masked.

## Goals
- Provide a single source of truth for all field canvassing activity and school order fulfillment.
- Connect Canvassing → Order Conversion → Sales Quotations → Tax Invoices → Payment Tracking into a unified workflow.
- Render dynamic role-tailored Primary KPI dashboards for Admin and Canvassers.
- Mask sensitive company financials from field sales staff.

## Product Scope
- **Frontend**: Mobile-first Web Application built with HTML, Tailwind CSS, React, and Refrens-integrated Invoicing workspace with 2-role RBAC.
- **Backend**: Secure REST API.
- **Database**: Relational Database with Users, Visits, Products, Quotations, Invoices, and Payments entities.
- **Security**: Email/password login with JWT-based Role-Based Access Control (RBAC).

## Out-of-Scope Items (Proposed / Future Upgrades)
- GPS check-in / auto-location verification.
- School gate & sample photo upload.
- One-tap WhatsApp visit summary sharing.
- Automated live sync to external CRM or Google Sheets.
