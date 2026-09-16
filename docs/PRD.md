# Product Requirements Document (PRD)

## Product Vision
Murugan Canvass is a mobile-first institutional sales platform designed for Murugan Enterprises to digitize and streamline school apparel expansion field sales (socks, belts, ties, shoes, uniforms, bags, track pants, etc.). It connects field canvassing, sample tracking, specifications capture, administrative quotations & invoicing, and gamified commission tracking into a unified pipeline.

## Exact Client Workflow Architecture

### 1. Canvasser Field Step
- **Step 1**: Canvasser opens mobile web app upon visiting a school.
- **Step 2**: Canvasser searches for the school in the Master School Database; if not found, enters the custom name and district (flagged as `🆕 Newly Discovered`).
- **Step 3**: Inputs principal / contact person details, phone number, and estimated student strength (which auto-synchronizes back to the Master School database).
- **Step 4**: Selects product interests (Socks, Belts, Ties, Shoes, Uniforms, Bags, Track Pants).
- **Step 5**: Enters **Product Specifications & Custom Requirements** (e.g. 100% combed cotton, 220 GSM uniform fabric, double-ribbed socks with school crest, customized buckles).
- **Step 6**: Attaches **Sample / Reference Photos** (photos of previous uniforms/socks shown by the school principal).
- **Step 7**: Selects **Interest Level** (`Hot`, `Warm`, `Cold`, `Not Interested`).
- **Step 8**: Selects **Visit Outcome** strictly from restricted options: `Open`, `Sample Sent`, or `Not Interested`. (`Quote Given`, `Won`, and `Lost` are managed exclusively by Admin).
- **Step 9**: Sets Next Action Follow-up Date (or toggles "No Follow-up Needed / None").
- **Step 10**: Submits visit log to central database.

### 2. Admin Review & Commercial Conversion Step
- **Step 1**: Admin views all field visit logs in Central Visit Registry with full audit history tracking (who made changes, when, and field-level diffs).
- **Step 2**: Admin contacts school principals using collected details and specifications.
- **Step 3**: Admin edits records as negotiations progress, recorded with immutable audit history.
- **Step 4**: Admin generates formal **Quotations** with custom tailored line items, sizes, rates, and GST calculations.
- **Step 5**: Upon school confirmation, Admin generates the official **Tax Invoice** (`INV-2026-XXX`).
- **Step 6**: Invoicing automatically marks the visit as `Won` and credits the total invoiced amount to the originating Canvasser's account.

### 3. Commission Slab & Gamified Leaderboard Step
- **Standard Monthly Commission Slabs**:
  - **₹0 – ₹99,999**: **2.00%**
  - **₹1,00,000 – ₹2,49,999**: **2.50%**
  - **₹2,50,000 – ₹4,99,999**: **3.00%**
  - **₹5,00,000 – ₹7,49,999**: **3.50%**
  - **₹7,50,000 – ₹9,99,999**: **4.00%**
  - **₹10,00,000 – ₹14,99,999**: **4.50%**
  - **₹15,00,000 – ₹24,99,999**: **5.00%**
  - **₹25,00,000 and above**: **5.50%**
- **Monthly Performance Volume Bonus Tiers**:
  - ₹5L+: **+₹2,000** | ₹7.5L+: **+₹4,000** | ₹10L+: **+₹7,500** | ₹15L+: **+₹12,500** | ₹20L+: **+₹20,000** | ₹25L+: **+₹30,000**
- **New School Acquisition Incentive**:
  - **₹1,000** bonus per converted newly acquired school account.
- **Monthly Settlement Cycle**:
  - Finalized and credited on the **1st of every month**.
- **Competitive Multi-Criteria Leaderboard**:
  - Interactive sorting by Pay Earned (₹), Schools Canvassed, Invoices Converted, Total Invoiced Value (₹), Conversion Rate %, and Average Deal Size.
  - Itemized drawer breaking down each converted invoice and exact pay earned.

---

## User Roles & Layer Access Scoping

1. **CEO (`ceo`)**: Global unrestricted access; full authority over executive MIS, financials, user governance, master school directory, and approval queue reviews.
2. **CFO (`cfo`)**: Full financial management; P&L, GP%, collection rate, receivables aging, cash flow, and commercial reports.
3. **CCO (`cco`)**: Operations and field coordination; conversion rates, sales performance, and territory coverage.
4. **Admin Executive (`admin_exec` / `admin`)**: Operational data management, visit review & audit trails, custom quotation and invoice generation; user and school catalog mutations routed to CEO approval queue.
5. **Canvasser (`cvs` / `canvasser`)**: Field school visit logging, unlisted school discovery, specifications and photo capture, scoped visit history, and gamified leaderboard. Sensitive executive financials are strictly masked.

---

## Goals
- Single source of truth for all field canvassing activity, specifications capture, and order fulfillment.
- Curated Tamil Nadu Master School Database with auto-sync and RFC 4180 CSV export.
- Seamless conversion pipeline from field visit to quotation to verified tax invoice.
- Transparent monthly tiered commission incentives (2.00% to 5.50%) and performance bonuses driving healthy field competition.

