# CEO Executive Command Hub - Metric Formulas & Database Field Mapping

This document provides the complete mathematical specifications, database source fields, aggregation queries, and transformation logic for every metric in the CEO Executive Command Hub (`CEODashboardOverview.jsx` / `GET /api/ceo/mis`).

---

## 1. Core Executive Financial & Commercial KPIs (8 Hero Cards)

### 1.1 Total Revenue (Billed)
- **Source Database Table**: `invoices`
- **Fields Used**: `grand_total`
- **Aggregation Formula**:
  ```
  Total Invoiced = SUM(invoices.grand_total)
  ```
- **UI Transformation**:
  ```
  Formatted Value = "₹" + (Total Invoiced / 100000).toFixed(2) + "L"
  Target Progress = Math.round((Total Invoiced / 3500000) * 100) + "%"
  ```
- **Data Classification**: **Live Database Telemetry**

---

### 1.2 Gross Profit & Margin
- **Source Database Table**: `invoices`
- **Fields Used**: `grand_total`
- **Aggregation Formula**:
  ```
  Estimated COGS = Total Invoiced * 0.52
  Gross Profit   = Total Invoiced - Estimated COGS
  Gross Margin % = (Gross Profit / Total Invoiced) * 100
  ```
- **UI Transformation**:
  ```
  Formatted Value = "₹" + (Gross Profit / 100000).toFixed(2) + "L"
  Change Badge    = Gross Margin.toFixed(1) + "% Gross Margin"
  Subtext         = "₹" + (Estimated COGS / 100000).toFixed(2) + "L Production COGS (52%)"
  ```
- **Data Classification**: **Live DB Revenue x 52% Production COGS Standard Benchmark**

---

### 1.3 Net Profit (EBITDA)
- **Source Database Table**: `invoices`
- **Fields Used**: `grand_total`
- **Aggregation Formula**:
  ```
  Operating Expenses (Opex) = Total Invoiced * 0.24
  Net Profit                = Gross Profit - Opex
  Net Margin %              = (Net Profit / Total Invoiced) * 100
  ```
- **UI Transformation**:
  ```
  Formatted Value = "₹" + (Net Profit / 100000).toFixed(2) + "L"
  Change Badge    = Net Margin.toFixed(1) + "% Net Margin"
  ```
- **Data Classification**: **Standard Operating Model**

---

### 1.4 Cash Inflow (Collections)
- **Source Database Table**: `invoices` / `payments`
- **Fields Used**: `invoices.paid_amount`, `payments.amount`
- **Aggregation Formula**:
  ```
  Total Collected = SUM(invoices.paid_amount)
  Collection Rate = (Total Collected / Total Invoiced) * 100
  ```
- **UI Transformation**:
  ```
  Formatted Value = "₹" + (Total Collected / 100000).toFixed(2) + "L"
  Change Badge    = Collection Rate.toFixed(1) + "% Cleared"
  Subtext         = payments.length + " Payments Logged (Live DB)"
  ```
- **Data Classification**: **Live Database Telemetry**

---

### 1.5 Accounts Receivable
- **Source Database Table**: `invoices`
- **Fields Used**: `outstanding_balance`, `due_date`, `created_at`
- **Aggregation Formula**:
  ```
  Total Receivables = SUM(invoices.outstanding_balance)
  Overdue Amount    = SUM(invoices.outstanding_balance WHERE due_date < NOW() AND outstanding_balance > 0)
  Overdue Count     = COUNT(invoices WHERE due_date < NOW() AND outstanding_balance > 0)
  ```
- **UI Transformation**:
  ```
  Formatted Value = "₹" + (Total Receivables / 100000).toFixed(2) + "L"
  Status          = Overdue Count > 0 ? "Warning" : "Success"
  Subtext         = "Overdue: ₹" + (Overdue Amount / 100000).toFixed(2) + "L"
  ```
- **Data Classification**: **Live Database Telemetry**

---

### 1.6 Orders Won & Invoiced
- **Source Database Table**: `visits`, `invoices`
- **Fields Used**: `visits.outcome_status`, `invoices.id`
- **Aggregation Formula**:
  ```
  Visits Won Count = COUNT(visits WHERE outcome_status = 'Won')
  Orders Won       = Visits Won Count + COUNT(invoices)
  Win Rate %       = (Orders Won / COUNT(visits)) * 100
  ```
- **UI Transformation**:
  ```
  Formatted Value = Orders Won + " Accounts"
  Change Badge    = Win Rate + "% Win Rate"
  Subtext         = COUNT(visits) + " Total Visits Logged"
  ```
- **Data Classification**: **Live Database Telemetry**

---

### 1.7 Live Sales Pipeline
- **Source Database Table**: `quotations`, `visits`
- **Fields Used**: `quotations.grand_total`, `quotations.status`, `visits.interest_level`
- **Aggregation Formula**:
  ```
  Active Quotes Value = SUM(quotations.grand_total WHERE status NOT IN ('Rejected', 'Cancelled'))
  Hot Leads Count     = COUNT(visits WHERE interest_level = 'Hot')
  Warm Leads Count    = COUNT(visits WHERE interest_level = 'Warm')
  Weighted Lead Value = (Hot Leads Count * ₹1,20,000) + (Warm Leads Count * ₹65,000)
  
  Total Pipeline Value = Active Quotes Value + Weighted Lead Value
  ```
- **UI Transformation**:
  ```
  Formatted Value = "₹" + (Total Pipeline Value / 100000).toFixed(2) + "L"
  Change Badge    = quotations.length + " Active Quotes"
  Subtext         = Hot Leads Count + " Hot Leads, " + Warm Leads Count + " Warm Leads"
  ```
- **Data Classification**: **Live Quotes + Weighted Lead Valuation Model**

---

## 2. Detailed Domain Hubs

### 2.1 Sales Engine & Pipeline Intelligence
| Metric | Source Table & Fields | Formula |
| :--- | :--- | :--- |
| **Live Pipeline Value** | `quotations.grand_total`, `visits.interest_level` | `Active Quotes Value + (Hot * ₹1.2L) + (Warm * ₹0.65L)` |
| **Active Quotes Value** | `quotations.grand_total`, `status` | `SUM(quotations.grand_total WHERE status != 'Rejected')` |
| **Average Deal Size** | `invoices.grand_total` | `SUM(invoices.grand_total) / COUNT(invoices)` |
| **Highest Single Deal** | `invoices.grand_total` | `MAX(invoices.grand_total)` |
| **Quarterly Target Progress** | `invoices.grand_total` | `MIN(100, Math.round((Total Invoiced / 3500000) * 100))` |

---

### 2.2 Finance & Receivables Aging Brackets
Invoices with `outstanding_balance > 0` are grouped by age in days:
$$\text{Age in Days} = \lfloor(\text{Current Date} - \text{Invoice Created Date}) / 86400000\rfloor$$

| Aging Bracket | Age Condition | Formula |
| :--- | :--- | :--- |
| **0 - 30 Days (Current)** | `0 <= Age <= 30` | `SUM(outstanding_balance)` and `COUNT(*)` |
| **31 - 60 Days** | `31 <= Age <= 60` | `SUM(outstanding_balance)` and `COUNT(*)` |
| **61 - 90 Days** | `61 <= Age <= 90` | `SUM(outstanding_balance)` and `COUNT(*)` |
| **90+ Days (High Risk)** | `Age > 90` | `SUM(outstanding_balance)` and `COUNT(*)` |
| **Collection Rate** | `invoices.paid_amount`, `grand_total` | `(Total Paid / Total Invoiced) * 100` |
| **Commission Liability** | Computed Rep Slabs | `SUM(Canvasser Total Payouts)` |

---

### 2.3 Operations & Fulfillment Tracking
| Metric | Source Table & Fields | Formula |
| :--- | :--- | :--- |
| **Orders In Progress** | `visits.outcome_status` | `COUNT(visits WHERE outcome_status = 'Won')` |
| **Sample Packs Dispatched**| `visits.outcome_status` | `COUNT(visits WHERE outcome_status = 'Sample Sent')` |
| **Quotes Under Review** | `visits.outcome_status` | `COUNT(visits WHERE outcome_status = 'Quote Given')` |
| **Overdue Follow-ups** | `visits.follow_up_date`, `outcome_status` | `visits WHERE follow_up_date < NOW() AND outcome_status NOT IN ('Won', 'Lost')` |

---

### 2.4 Inventory & Product Demand Frequency
- **Source Database Table**: `visits`
- **Field Used**: `product_interests` (JSON Array column: e.g. `["Cotton Combed Socks", "School Uniform Sets"]`)
- **Aggregation Formula**:
  ```
  For each visit:
    For each product in parsed product_interests:
      productDemandCount[product] = (productDemandCount[product] || 0) + 1
  ```
- **Visual Percentage Bar**:
  ```
  Max Inquiries = MAX(productDemandCount values)
  Bar Width %   = Math.round((productCount / Max Inquiries) * 100)
  ```

---

### 2.5 Institutional Customers & Territory Coverage
| Metric | Source Table & Fields | Formula |
| :--- | :--- | :--- |
| **Master Directory Total**| `master_schools` | `COUNT(*) FROM master_schools` |
| **Visited Schools** | `visits.school_name` | `COUNT(DISTINCT visits.school_name)` |
| **Territory Penetration**| `visits.school_name`, `master_schools` | `(Unique Visited Schools / Master Directory Total) * 100` |
| **Top Revenue Schools** | `invoices.school_name`, `grand_total`, `paid_amount`, `outstanding_balance` | Group by `school_name`, calculate `SUM(grand_total)`, `SUM(paid_amount)`, `SUM(outstanding_balance)`, sorted by `SUM(grand_total) DESC` |

---

### 2.6 Field Sales Team & Tiered Commission Slabs

For each active Canvasser `c`:
1. **Total Billed Invoiced**: `SUM(invoices.grand_total WHERE canvasser_id = c.id)`
2. **New School Conversion Incentive**:
   - `New Schools Converted = COUNT(visits WHERE canvasser_id = c.id AND is_from_master_db = 0 AND outcome_status = 'Won')`
   - `New School Incentive = New Schools Converted * ₹1,000`
3. **Progressive Rate & Performance Bonus Table**:

| Invoiced Sales Range | Commission Rate | Tier Level | Performance Incentive Bonus |
| :--- | :---: | :---: | :---: |
| **Up to ₹1,00,000** | **2.0%** | Tier 1 | ₹0 |
| **₹1,00,000 to ₹2,50,000** | **2.5%** | Tier 2 | ₹0 |
| **₹2,50,000 to ₹5,00,000** | **3.0%** | Tier 3 | ₹0 |
| **₹5,00,000 to ₹7,50,000** | **3.5%** | Tier 4 | +₹2,000 |
| **₹7,50,000 to ₹10,00,000**| **4.0%** | Tier 5 | +₹4,000 |
| **₹10,00,000 to ₹15,00,000**| **4.5%** | Tier 6 | +₹7,500 |
| **₹15,00,000 and Above** | **5.0%** | Tier 7 | +₹12,500 |

4. **Total Rep Payout**:
   $$\text{Total Payout} = (\text{Invoiced} \times \text{Rate}) + \text{Performance Incentive} + \text{New School Incentive}$$

---

### 2.7 Management Governance & Action Alerts
| Alert Type | Source Table & Fields | Condition |
| :--- | :--- | :--- |
| **Pending Approvals Queue** | `pending_user_actions` | `status = 'PENDING'` |
| **Overdue Debts Escalation** | `invoices` | `due_date < NOW() AND outstanding_balance > 0` |
| **Urgent Follow-ups** | `visits` | `follow_up_date < NOW() AND outcome_status NOT IN ('Won', 'Lost')` |

---

### 2.8 Monthly Reporting & Longitudinal MIS Trends
- **Source Tables**: `invoices`, `payments`, `visits`
- **Fields Used**: `invoices.created_at`, `payments.recorded_at`, `visits.created_at`
- **Grouping Logic**:
  ```
  For each month (Jan through Dec):
    Billed Sales   = SUM(invoices.grand_total WHERE invoice.month = current_month)
    Cash Collected = SUM(payments.amount WHERE payment.month = current_month)
    Visits Logged  = COUNT(visits WHERE visit.month = current_month)
  ```
- **CSV MIS Exporter**: Generates a standard RFC 4180 spreadsheet with timestamps, executive KPIs, aging analysis, top client accounts, and sales team commission balances.
