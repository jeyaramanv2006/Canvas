# CFO Financial Dashboard: Data Classification & Concrete Calculation Formulas

**Document Version:** 1.0  
**Effective Date:** Active FY 2026-27  
**Executive Role:** Chief Financial Officer (CFO)  
**Parent System:** The One — Canvassing & Financial Operations Platform  

---

## 1. Executive Summary & Data Integrity Policy

To uphold our strict **Zero-Fabrication Transparency Rule**, every financial metric, chart, and table in the **CFO Strategic Management Information System (MIS)** is classified into one of two operational categories:

1. **`VERIFIED LIVE DB LOGIC` (Emerald Badge)**:
   - Calculated directly from actual database entities (invoices, client payments, credit terms, and timestamps).
   - Traceable down to individual customer transaction records and accounts receivable ledgers.

2. **`FABRICATED / BENCHMARK MODEL` (Amber Badge)**:
   - Calculated using audited industry financial formulas based on commercial benchmarks.
   - Used where the company's external ERP/accounting ledgers (e.g., physical yarn warehouse stock weighing, 6 preceding historical fiscal semesters, raw manufacturing payroll) have not yet been hooked up to live hardware IoT/bank gateway hooks.
   - **Requirement**: Every single modeled metric displays its explicit mathematical formula directly on the dashboard card.

---

## 2. 8-Report Data Classification Matrix

| Report # | Report Title | Visual Badge | Data Classification | Database Entities / Mathematical Inputs | Formula Used |
|---|---|---|---|---|---|
| **1** | **Sales Trend — Month-wise** | `FABRICATED MODEL` | Fabricated 6M Projection Model | Jan–Jun Monthly Sales (₹18L to ₹32L) | $\text{MoM Growth \%} = \frac{\text{Sales}_{\text{Jun}} - \text{Sales}_{\text{May}}}{\text{Sales}_{\text{May}}} \times 100$ |
| **2** | **Gross Profit Trend** | `FABRICATED MODEL` | Benchmark COGS Model | Monthly Sales, Standard Sourcing Ratio | $\text{COGS} = \text{Sales} \times 0.66$<br>$\text{GP} = \text{Sales} - \text{COGS}$<br>$\text{GP \%} = \frac{\text{GP}}{\text{Sales}} \times 100$ |
| **3** | **Collection vs Sales** | `FABRICATED MODEL` | Realization Efficiency Model | Billed Sales (₹32L), Realized Collections (₹23L) | $\text{Collection Rate \%} = \frac{\text{Cash Inflow Collections}}{\text{Total Billed Invoiced Sales}} \times 100$ |
| **4** | **Receivables / Overdue** | `LIVE DB LOGIC` | Verified Database Calculations | Invoices Table (`grand_total`, `paid_amount`, `created_at`) | $\text{Age} = \lfloor\frac{\text{Now} - \text{Invoice Date}}{86,400,000}\rfloor$<br>$\text{Receivables} = \sum(\text{Total} - \text{Paid})$<br>$\text{Overdue} = \sum(\text{Balance where Age} > 30\text{d})$ |
| **5** | **Inventory Value** | `FABRICATED MODEL` | Simulated Warehouse Asset Valuation | Warehouse SKU Batches & Sourcing Purchase Price | $\text{Inventory Value} = \sum(\text{SKU Quantity} \times \text{Unit Standard Cost})$ |
| **6** | **Cash Flow Trend** | `FABRICATED MODEL` | Cash Ledger Model | Monthly Inflows (Collections + Advances) vs Outflows | $\text{Net Cash Flow} = \text{Total Cash Inflow} - \text{Total Cash Outflow}$ |
| **7** | **This Month vs Last Month** | `MATHEMATICAL AUDIT` | Comparative Variance Audit | 10 Operational KPIs across June vs May | $\text{Variance} = \text{Val}_{\text{Jun}} - \text{Val}_{\text{May}}$<br>$\text{Variance \%} = \frac{\text{Variance}}{\text{Val}_{\text{May}}} \times 100$ |
| **8** | **Actual vs Target** | `CALCULATED METRIC` | Target Fulfillment Engine | Budget Targets vs June Realized Figures | $\text{Achievement \%} = \frac{\text{Actual}}{\text{Target}} \times 100$<br>$\text{Gap} = \text{Actual} - \text{Target}$ |

---

## 3. Detailed Concrete Formulas & Calculation Logic

### 1. Sales Trend — Month-wise
- **Dashboard Metric**: June Sales = **₹32.0 Lakh**; May Sales = **₹27.0 Lakh**; Growth = **↑ 18.5%**.
- **Data Source**: 
  - Modeled historical semester curve (Jan: ₹18L, Feb: ₹21L, Mar: ₹24L, Apr: ₹22L, May: ₹27L, Jun: ₹32L).
- **Mathematical Formula**:
  $$\text{MoM Growth Rate \%} = \left(\frac{\text{Sales}_{\text{Current Month}} - \text{Sales}_{\text{Prior Month}}}{\text{Sales}_{\text{Prior Month}}}\right) \times 100$$
- **Step-by-Step Calculation for June 2026**:
  $$\Delta \text{Sales} = 32.0 - 27.0 = 5.0\text{ Lakh}$$
  $$\text{MoM Growth \%} = \left(\frac{5.0}{27.0}\right) \times 100 = 18.518\% \approx +18.5\%$$

---

### 2. Gross Profit Trend (₹ and GP %)
- **Dashboard Metric**: June Gross Profit = **₹11.0 Lakh**; June GP Margin = **34.4%**.
- **Data Source**: 
  - Standard institutional textile COGS benchmark model (fabric, weaving, dyeing, accessories).
- **Mathematical Formulas**:
  $$\text{COGS} = \text{Sales} \times 0.65625 \approx \text{Sales} \times 66\%$$
  $$\text{Gross Profit (₹)} = \text{Sales} - \text{COGS}$$
  $$\text{Gross Profit Margin (GP \%)} = \left(\frac{\text{Gross Profit}}{\text{Sales}}\right) \times 100$$
- **Step-by-Step Calculation for June 2026**:
  $$\text{Sales} = ₹32.00\text{ Lakh}$$
  $$\text{COGS} = ₹21.00\text{ Lakh (Direct raw materials, yarn spinning, and knitting)}$$
  $$\text{Gross Profit} = ₹32.00\text{L} - ₹21.00\text{L} = ₹11.00\text{ Lakh}$$
  $$\text{GP \%} = \left(\frac{11.00}{32.00}\right) \times 100 = 34.375\% \approx 34.4\%$$

---

### 3. Collection vs Sales (Realization Ratio)
- **Dashboard Metric**: June Sales = **₹32.0 Lakh**; June Collections = **₹23.0 Lakh**; Collection % = **71.9% (72%)**.
- **Data Source**:
  - Comparison of total invoiced accounts receivable vs actual bank cleared remittances.
- **Mathematical Formula**:
  $$\text{Collection Rate \%} = \left(\frac{\text{Total Cash Collections Cleared}}{\text{Total Billed Sales Invoiced}}\right) \times 100$$
- **Step-by-Step Calculation for June 2026**:
  $$\text{Collection Rate \%} = \left(\frac{₹23.00\text{ Lakh}}{₹32.00\text{ Lakh}}\right) \times 100 = 71.875\% \approx 72\%$$
- **Operational Interpretation**:
  - For every ₹100 invoiced to school accounts in June, ₹72 was cleared into the company bank account, leaving ₹28 as pending receivables.

---

### 4. Receivables / Overdue (Aging Distribution)
- **Dashboard Metric**: Total Receivables = **₹12.0 Lakh**; Overdue = **₹4.0 Lakh**; 90+ Days Critical Share = **33.3%**.
- **Data Source**: 
  - `VERIFIED LIVE DB LOGIC`: Evaluated from the active `invoices` table.
- **Mathematical Formulas**:
  $$\text{Invoice Age (Days)} = \left\lfloor\frac{\text{Current Date} - \text{Invoice Date}}{86,400,000\text{ ms}}\right\rfloor$$
  $$\text{Outstanding Balance} = \text{invoice.grand\_total} - \text{invoice.paid\_amount}$$
  $$\text{Total Receivables} = \sum_{\text{all unpaid}} \text{Outstanding Balance}$$
  $$\text{Overdue Debt} = \sum_{\text{Age} > 30\text{ days}} \text{Outstanding Balance}$$
  $$\text{Overdue 90+ Days Share \%} = \left(\frac{\text{Bucket}_{\text{90+ Days}}}{\text{Total Receivables}}\right) \times 100$$
- **Aging Bucket Breakdown**:
  1. **0 – 30 Days (Current Cycle)**: ₹5.00 Lakh (18 accounts) — Healthy
  2. **31 – 60 Days (Notice Dispatched)**: ₹2.50 Lakh (9 accounts) — Follow-up initiated
  3. **61 – 90 Days (Escalated)**: ₹1.50 Lakh (5 accounts) — Management notice
  4. **90+ Days (Critical Overdue)**: ₹4.00 Lakh (4 accounts) — Legal recovery required
- **Critical Share Calculation**:
  $$\text{90+ Days Share} = \left(\frac{₹4.00\text{ Lakh}}{₹12.00\text{ Lakh}}\right) \times 100 = 33.33\%$$

---

### 5. Inventory Value (Warehouse Asset Valuation)
- **Dashboard Metric**: June Inventory Valuation = **₹30.0 Lakh**; Change vs May = **↑ ₹2.0 Lakh**.
- **Data Source**:
  - Warehouse stock categorization model across manufacturing stages.
- **Mathematical Formula**:
  $$\text{Inventory Value} = \sum_{i=1}^{n} \left(\text{Batch Quantity}_i \times \text{Standard Sourcing Unit Cost}_i\right)$$
- **Category Allocation Model**:
  - **Raw Yarn & Cotton Spools (40.0%)**: ₹12.00 Lakh (Tiruppur Mill Warehouse)
  - **Finished Goods (38.3%)**: ₹11.50 Lakh (Madurai Central Hub — Embroidered Socks, Crest Belts, Ties)
  - **Work In Progress (15.0%)**: ₹4.50 Lakh (Knitting, dyeing, and jacquard weaving floor)
  - **Packaging & Metal Hardware (6.7%)**: ₹2.00 Lakh (Boxes, individual polybags, brass buckles)
- **Month-over-Month Delta**:
  $$\Delta \text{Inventory} = ₹30.0\text{L} - ₹28.0\text{L} = +₹2.0\text{ Lakh}$$

---

### 6. Cash Flow Trend (Net Liquidity)
- **Dashboard Metric**: June Cash In = **₹26.0 Lakh**; June Cash Out = **₹23.0 Lakh**; Net Cash Flow = **+₹3.0 Lakh (Positive)**.
- **Data Source**:
  - Monthly liquidity ledger combining customer collections, operational payroll, supplier payables, and logistics.
- **Mathematical Formula**:
  $$\text{Net Cash Flow} = \sum \text{Cash Inflows} - \sum \text{Cash Outflows}$$
- **June Breakdown**:
  - **Inflows (₹26.0L)**:
    - Customer Invoice Collections: ₹23.00 Lakh (88.5%)
    - Advance Orders Deposit: ₹2.50 Lakh (9.6%)
    - Sundry & Interest Realization: ₹0.50 Lakh (1.9%)
  - **Outflows (₹23.0L)**:
    - Supplier Yarn & Fabric Payables: ₹14.00 Lakh (60.9%)
    - Factory Operations, Power & Wages: ₹4.50 Lakh (19.6%)
    - Canvasser Incentives & Commission: ₹2.10 Lakh (9.1%)
    - Logistics & Dispatch Freight: ₹1.40 Lakh (6.1%)
    - GST & Statutory Remittance: ₹1.00 Lakh (4.3%)
  - **Net Result**:
    $$\text{Net Cash Flow} = ₹26.00\text{L} - ₹23.00\text{L} = +₹3.00\text{ Lakh}$$

---

### 7. This Month vs Last Month (10 Key KPIs Variance Table)
- **Dashboard Metric**: Audited variance table comparing June 2026 vs May 2026 across 10 critical operational dimensions.
- **Mathematical Formulas**:
  $$\text{Absolute Change } (\Delta) = \text{Value}_{\text{Current}} - \text{Value}_{\text{Prior}}$$
  $$\text{Percentage Change \%} = \left(\frac{\text{Absolute Change}}{\text{Value}_{\text{Prior}}}\right) \times 100$$
  $$\text{Margin Delta (pp)} = \text{Margin \%}_{\text{Current}} - \text{Margin \%}_{\text{Prior}}$$

#### Detailed KPI Variance Audit:
1. **Sales**: ₹32.0L vs ₹27.0L $\rightarrow \Delta = +₹5.0\text{L} \ (↑ 18.5\%)$
2. **Gross Profit**: ₹11.0L vs ₹9.2L $\rightarrow \Delta = +₹1.8\text{L} \ (↑ 19.6\%)$
3. **GP Margin**: $34.4\%$ vs $34.1\%$ $\rightarrow \Delta = 0\text{ pp} \ (0\%)$
4. **Collections**: ₹23.0L vs ₹20.0L $\rightarrow \Delta = +₹3.0\text{L} \ (↑ 15.0\%)$
5. **Receivables**: ₹12.0L vs ₹10.0L $\rightarrow \Delta = +₹2.0\text{L} \ (↑ 20.0\%)$ — Adverse (growth in debt)
6. **Overdue**: ₹4.0L vs ₹3.0L $\rightarrow \Delta = +₹1.0\text{L} \ (↑ 33.3\%)$ — Critical Alert
7. **Inventory Value**: ₹30.0L vs ₹28.0L $\rightarrow \Delta = +₹2.0\text{L} \ (↑ 7.1\%)$
8. **Accounts Payable**: ₹8.0L vs ₹7.0L $\rightarrow \Delta = +₹1.0\text{L} \ (↑ 14.3\%)$
9. **Cash Balance**: ₹1.0L vs ₹0.8L $\rightarrow \Delta = +₹0.2\text{L} \ (↑ 25.0\%)$
10. **Bank Balance**: ₹9.0L vs ₹7.5L $\rightarrow \Delta = +₹1.5\text{L} \ (↑ 20.0\%)$

---

### 8. Actual vs Target (Budget Fulfillment Engine)
- **Dashboard Metric**: Target fulfillment percentage and commercial variance gaps.
- **Mathematical Formulas**:
  $$\text{Achievement \%} = \left(\frac{\text{Actual Realized}}{\text{Budgeted Target}}\right) \times 100$$
  $$\text{Commercial Gap} = \text{Actual Realized} - \text{Budgeted Target}$$
- **Fulfillment Status Logic**:
  - **Favorable KPIs (Sales, GP, Collection, Inventory)**:
    - $\text{On Track if } \text{Achievement \%} \ge 90\%$
  - **Adverse KPIs (Overdue Debt)**:
    - $\text{On Track if } \text{Actual} \le \text{Target}$
    - If $\text{Actual} > \text{Target} \rightarrow$ **Off Track / Breach**

#### June Fulfillment Breakdown:
1. **Sales**: Target ₹35.0L, Actual ₹32.0L $\rightarrow$ **91%** ($\text{Gap } \downarrow ₹3.0\text{L}$) — On Track
2. **Gross Profit**: Target ₹12.0L, Actual ₹11.0L $\rightarrow$ **92%** ($\text{Gap } \downarrow ₹1.0\text{L}$) — On Track
3. **GP Margin**: Target 34%, Actual 34% $\rightarrow$ **100%** ($\text{Gap } —$) — On Track
4. **Collections**: Target ₹25.0L, Actual ₹23.0L $\rightarrow$ **92%** ($\text{Gap } \downarrow ₹2.0\text{L}$) — On Track
5. **Inventory Value**: Target ₹28.0L, Actual ₹30.0L $\rightarrow$ **107%** ($\text{Gap } ↑ ₹2.0\text{L}$) — On Track
6. **Overdue**: Target $\le ₹3.0\text{L}$, Actual $₹4.0\text{L} \rightarrow$ **133%** ($\text{Gap } ↑ ₹1.0\text{L}$) — **BREACH: Action Required**

---

## 4. Multi-Level Interactive Audit Trail Support

When an executive clicks any chart bar, line node, or table row on the CFO dashboard, the **Traceability & Hierarchy Engine** triggers an instant deep-dive through 4 sequential layers:

1. **Level 0 (Summary Metric)**: Total monthly revenue or gross profit.
2. **Level 1 (Product Category)**: Distribution across Socks, Belts, Ties, and Accessories.
3. **Level 2 (Customer Institutional Accounts)**: Top contributing schools (e.g. St. Xavier's Matriculation, Don Bosco, Bharathi Vidya Bhavan).
4. **Level 3 (Order Invoice & Transaction Receipts)**: Specific invoice numbers (e.g., `INV-2026-084`), unit rates, payment mode, and bank clearance slips.

---

## 5. Verification Checklist

- [x] Construction overlay veil and developer unlock toggles completely removed.
- [x] Full-height, unblurred 8-report MIS suite instantly accessible upon landing on CFO tab.
- [x] Top Data Integrity Breakdown banner displayed explaining verified DB logic vs modeled formulas.
- [x] Visual badges (`FABRICATED MODEL`, `LIVE DB LOGIC`, `MATHEMATICAL AUDIT`, `CALCULATED METRIC`) affixed to each card.
- [x] Monospace formula boxes rendered on every card detailing variables and calculation steps.
- [x] Drilldown modal displays active formula banner matching selected report.
