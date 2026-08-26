# Product Requirements Document (PRD)

## Product Vision
Murugan Canvass is a mobile-first web application designed for Murugan Enterprises to digitize and streamline school apparel expansion field sales (socks, belts, ties, shoes, uniforms, bags, track pants, etc.). It connects field canvassing, sample tracking, specifications capture, administrative quotations & invoicing, and gamified commission tracking into a seamless pipeline.

## Exact Client Workflow Architecture

### 1. Canvasser Field Step
- **Step 1**: Canvasser opens mobile web app upon visiting a school.
- **Step 2**: Canvasser searches for the school in the Master School Database; if not found, enters the custom name and district (flagged as `🆕 Newly Discovered`).
- **Step 3**: Inputs principal / contact person details, phone number, and estimated student strength.
- **Step 4**: Selects product interests (Socks, Belts, Ties, Shoes, Uniforms, Bags, Track Pants).
- **Step 5**: Enters **Product Specifications & Custom Requirements** (e.g. 100% combed cotton, 220 GSM uniform fabric, double-ribbed socks with school crest, customized buckles).
- **Step 6**: Attaches **Sample / Reference Photos** (photos of previous uniforms/socks shown by the school principal).
- **Step 7**: Selects **Interest Level** (`Hot`, `Warm`, `Cold`, `Not Interested`).
- **Step 8**: Selects **Visit Outcome** strictly from restricted options: `Open`, `Sample Sent`, or `Not Interested`. (`Quote Given`, `Won`, and `Lost` are managed exclusively by Admin).
- **Step 9**: Sets Next Action Follow-up Date (or toggles "No Follow-up Needed / None").
- **Step 10**: Submits visit log to central database.

### 2. Admin Review & Commercial Conversion Step
- **Step 1**: Admin views all field visit logs in Central Visit Registry with full audit history tracking (who made changes and when).
- **Step 2**: Admin contacts school principals using collected details and specifications.
- **Step 3**: Admin edits records as negotiations progress, recorded with immutable audit history.
- **Step 4**: Admin generates formal **Quotations** directly from the product catalog with GST calculation.
- **Step 5**: Upon school confirmation, Admin generates the official **Tax Invoice**.
- **Step 6**: Invoicing automatically marks the visit as `Won` and credits the total invoiced amount to the originating Canvasser's account.

### 3. Commission Slab & Gamified Leaderboard Step
- **Tiered Incentive Structure**: Canvassers earn a percentage of invoiced sales based on a progressive slab tier system:
  - **₹0 – ₹5,00,000 (1 - 5L)**: **1% Commission**
  - **₹5,00,001 – ₹10,00,000 (5 - 10L)**: **2% Commission**
  - **₹10,00,001 – ₹15,00,000 (10 - 15L)**: **3% Commission**
  - **₹15,00,001 – ₹20,00,000 (15 - 20L)**: **4% Commission**
  - **> ₹20,00,000 (> 20L)**: **5% Commission (Capped Maximum)**
- **Competitive Leaderboard**:
  - Live ranking of all canvassers showing Total Invoiced Value, Active Slab Tier %, Commission Earned (₹), Total School Visits, and Won Deals.
  - Progress bar showing the remaining sales required to unlock the next commission tier.
- **Marketing Hub Removal**: The Marketing Hub section is completely removed from both Canvasser and Admin interfaces.

## User Roles & Layer Access Scoping

### 1. Admin / Leadership (`admin`)
- **Layers Covered**: **L1 (Executive) down through L3 (Commercial & Finance Management)**.
- Full executive analytics (Revenue, Gross Profit, EBITDA, Cash Flow, Receivables, Collection Rate).
- Central authority for creating Sales Quotations, following up with school principals, generating Tax Invoices, recording payments, and maintaining product catalog rates.
- Order & Commission Attribution: Credits invoices to field canvassers and monitors commission payouts.
- Global oversight: All Canvasser visit logs, audit trails, and team leaderboard.

### 2. Canvassers / Field Sales (`canvasser`)
- **Layers Covered**: **L4 (Sales / Field Canvassing & Execution)**.
- Master School Database Search & auto-population with custom entry fallback.
- Field visit logging with specifications notes, sample photo attachments, flexible follow-up, and restricted outcome stages (`Open`, `Sample Sent`, `Not Interested`).
- Scoped "My Visits" feed with audit history indicators and photo preview lightboxes.
- Competitive Leaderboard & Commission Tracker with tier progress.

## Goals
- Single source of truth for all field canvassing activity, specifications capture, and order fulfillment.
- Pre-populated Tamil Nadu Master School Database.
- Seamless conversion pipeline from field visit to quotation to verified invoice.
- Transparent tiered commission incentives (1% to 5%) driving healthy field competition.
