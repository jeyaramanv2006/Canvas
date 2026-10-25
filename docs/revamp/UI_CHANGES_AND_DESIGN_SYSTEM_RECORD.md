# Murugan Groups “The One” — UI/UX Revamp Record & Unified Design System

> **Persistent Project Knowledge Document**  
> **Location:** `docs/revamp/UI_CHANGES_AND_DESIGN_SYSTEM_RECORD.md`  
> **Target Audience:** All developers, AI agents, and designers working on subsequent revamp phases.  
> **Status:** Active & Mandatory Reference  

---

## 1. Purpose & Core Philosophy

This document serves as the **single source of truth** for all visual, architectural, and component enhancements implemented across the UI revamp of **Murugan Groups “The One”**. 

Many upcoming phases share identical component structures—including:
- **Priority & Field Follow-ups** (`FollowUpsPipelineModule.jsx`)
- **Central Visit Registry & Logs** (`FieldVisitRegistry.jsx`)
- **Team Performance Leaderboard** (`CanvasserLeaderboard.jsx`)
- **Master Schools Directory** (`MasterSchoolsDirectoryModule.jsx`)
- **User Management & Approval Queues** (`UserManagementModule.jsx`, `PendingApprovalsDrawer.jsx`)
- **Executive Command Dashboards** (CEO, CFO, CCO, Operations Admin)
- **Financial & Commercial Document Suite** (`InvoicingModule.jsx`, `InvoiceDocumentModal.jsx`)

To ensure a cohesive, unified, and luxury application experience, **every subsequent phase must strictly adhere to the themes, tokens, and components codified below**. No new phase should re-invent UI patterns or introduce conflicting visual styles.

---

## 2. Core Design Pillars & Brand Theme

### 2.1 Corporate Brand Identity: Warm Gold / Amber Accent
Earlier experimental phases explored high-saturation neon/lime-green palettes (`#bef264`, `lime-300`). **This was completely rejected and replaced.**  
The official, confirmed brand identity is **Warm Luxury Gold & Amber**, reflecting prestige, trust, and commercial precision.

| Color Token | Hex / Value | Usage & Application |
| :--- | :--- | :--- |
| **Primary Brand Gold** | `#f59e0b` (`amber-500` / `amber-400`) | Primary action buttons, active tab indicators, selected calendar days, primary KPI metrics. |
| **Luminous Gold Core** | `#fbbf24` (`amber-300` / `yellow-400`) | High-intensity highlights, active focus rings, gradient stops, beacon cores. |
| **Warm Sand Gold** | `#d9b763` / `#e8cc83` | Subtitles, secondary brand tags ("THE ONE"), subtle borders, logo framing. |
| **Deep Amber Glow** | `rgba(245, 158, 11, 0.22)` | Button drop shadows, ambient radial flares, ridge glows. |
| **Subtle Gold Glass Fill** | `rgba(245, 158, 11, 0.08)` to `0.04` | Active select items, icon containers, hover pill backgrounds. |

### 2.2 Dark Void Base Canvas
The canvas utilizes deep obsidian tones rather than flat gray, creating depth and high contrast for crisp foreground text:

| Canvas Token | Hex Value | Application |
| :--- | :--- | :--- |
| **Deep Obsidian Base** | `#050a08` / `#08090d` | Global HTML/Body background, canvas backdrops. |
| **Lucid Block Surface** | `#0c0d15` (85% opacity) | Primary dashboard cards, KPI containers, filter bars. |
| **Elevated Glass Container** | `#101117` (75%–85% opacity) | Modals, login hero container, dropdown popovers. |
| **Header / Navigation Surface**| `#14151f` (90% opacity) | Top brand header, modal header bars, drawer headers. |
| **Input / Inset Field Surface**| `rgba(0, 0, 0, 0.40)` to `#0f1118` | Form text inputs, search fields, date picker triggers. |

### 2.3 Micro-Borders & Highlights
Never use heavy, flat borders. Depth is achieved via translucent white micro-strokes:
- **Default Card Border:** `border border-white/[0.08]`
- **Interactive Container Border:** `border border-white/[0.12]`
- **Modal / Popover Border:** `border border-white/[0.15]`
- **Hover Transition:** `hover:border-amber-400/40` or `hover:border-amber-500/30`
- **Focus Rings:** `focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 outline-none`

### 2.4 Typography System
Monospace fonts (`Courier`, `Space Grotesk`) have been **purged from all page headers, titles, and body copy**. They are strictly reserved for tabular numbers, currency amounts, and codes.

- **Primary Headings & Body:** `'Google Sans Flex'`, `'Google Sans'`, `'Google Sans Text'`, `Inter`, `sans-serif`.
- **Numerical & Financial Readouts:** `font-mono` (e.g., invoice amounts, percentage conversions, record IDs).
- **Heading Colors:** `#f4f0e7` (luxury off-white) or `#ffffff` with tight tracking (`tracking-tight` or `tracking-[-0.03em]`).
- **Body & Secondary Copy:** `text-white/75` (high-readability labels) and `text-white/45` to `text-white/55` (hints, metadata).

---

## 3. Background Architecture (Dual-Layer System)

The application utilizes a clean separation between unauthenticated and authenticated viewports:

```
App.jsx (Root Isolation)
 ├── !user  ──> <TopographicBackground /> (Login Screen Canvas)
 └──  user  ──> <DynamicDotGridBackground /> (All Authenticated Role Dashboards)
```

### 3.1 Login Screen Canvas: `TopographicBackground.jsx`
- **Visual Style:** Luxury procedural topographic contour lines covering 360° of the viewport.
- **Coloration:** Golden contour lines (`rgba(217, 180, 99, 0.32)`), amber ridge glows (`rgba(245, 158, 11, 0.28)`), sharp luminous gold core lines (`rgba(251, 191, 36, 0.88)`), and pulsing beacon nodes (`#fbbf24`).
- **Performance:** Two-pass hardware-accelerated drawing eliminating CPU-heavy `shadowBlur`; DPR clamped to 1x/1.25x for locked 60fps.
- **Interactions:** Localized elevation warping and flashlight illumination that smoothly tracks the cursor.

### 3.2 Authenticated Dashboard Canvas: `DynamicDotGridBackground.jsx`
- **Visual Style:** Uniform, clean white micro-dots (`rgba(255, 255, 255, 0.18)` / radius 1.15px) arranged in an ambient matrix.
- **Fluid Sheet Wave:** Continuous undulating harmonic wave with `8.5px` amplitude (`6.5px` mobile) and dual phase multipliers (`0.22`, `0.14`), creating an organic living sheet.
- **Hover Interaction:** Smooth liquid radial parting as the cursor moves through the field. Dots physically displace away from the cursor and smoothly return to their wave paths. **No color shifts or opacity changes** on hover to keep the background subtle and non-distracting.
- **Ambient Bleeds:** Very subtle dark radial gradients (purple in top-left, teal in bottom-right, amber in center) at low opacity (<13%) beneath the dots.

---

## 4. Reusable Component Design Standards

### 4.1 Custom Dropdown: `<AestheticSelect />`
> **File:** `frontend/src/components/AestheticSelect.jsx`  
> **Rule:** Never use standard HTML `<select>` elements anywhere in the revamped views. Always replace them with `AestheticSelect`.

**Key Capabilities & Standards:**
- **Lucid Glass Popover:** `bg-[#0f1118] border border-white/[0.15] rounded-2xl shadow-2xl backdrop-blur-2xl`.
- **Searchable Mode:** Supports `searchable={true}` with an instant inline search input for long lists (e.g., canvassers, districts, categories).
- **Fluid Selection State:** Selected items highlighted with an amber gradient pill (`bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/30`) and a checkmark icon.
- **Layer Stacking:** Rendered with `z-[9999]` to guarantee dropdown menus never clip behind cards or tables.
- **Keyboard & Click Accessibility:** Full click-outside dismissal and `Escape` key listeners.

### 4.2 Custom Date Picker: `<AestheticDatePicker />`
> **File:** `frontend/src/components/AestheticDatePicker.jsx`  
> **Rule:** Never use standard HTML `<input type="date">` controls. Always replace them with `AestheticDatePicker`.

**Key Capabilities & Standards:**
- **Trigger Button:** Displays formatted readable date with calendar icon, clear button (`allowClear`), and "Pick Date" action label.
- **Opaque Glass Calendar:** `bg-[#0f1118] border border-white/[0.15] rounded-2xl shadow-2xl ring-1 ring-black/90`.
- **Month Stepper & Week Grid:** Smooth navigation across months and years with localized Sunday–Saturday day labels.
- **Active Date Highlight:** Selected date rendered with `bg-amber-400 text-black font-extrabold shadow-md`.
- **One-Click Quick Presets:** Includes rapid selection pills: `Today`, `+3 Days`, `+1 Week`, `+2 Weeks` with `text-amber-300 bg-amber-400/10`.
- **Form Integration:** Returns clean standard `"YYYY-MM-DD"` string compatible with backend API parameters.

### 4.3 Lucid Block Cards & KPI Section: `<DynamicKPISection />`
> **File:** `frontend/src/components/DynamicKPISection.jsx`  
> **Rule:** All metrics, totals, and KPI tiles must use the generous-spacing Lucid Block structure.

**Key Layout Specs:**
- **Container Styling:** `bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl`.
- **Hover Micro-interaction:** `hover:border-amber-400/30 hover:scale-[1.01] transition-all duration-200`.
- **Metric Readout:** Oversized, bold numerical values (`text-2xl sm:text-3xl font-black font-mono tracking-tight text-white` or `text-amber-400`).
- **Pill Tag / Indicator:** Top-right status pill with micro-icon and subtle border (e.g., `bg-amber-400/15 text-amber-300 border border-amber-400/25`).

### 4.4 Modals, Drawers & Lightboxes
> **Examples:** `InvoiceDocumentModal.jsx`, `EditVisitModal.jsx`, `SchoolPortfolioModal.jsx`, `VerifySchoolDiscoveryModal.jsx`

**Universal Modal Rules:**
1. **Portal Rendering:** Must always mount via `createPortal(modalContent, document.body)` to avoid container clipping.
2. **Backdrop Veil:** `fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4`.
3. **Scroll Lock:** Component must lock document body scroll on mount:
   ```javascript
   useEffect(() => {
     const orig = document.body.style.overflow;
     document.body.style.overflow = 'hidden';
     return () => { document.body.style.overflow = orig; };
   }, []);
   ```
4. **Header Architecture:** Clean top navigation bar (`bg-[#14151f] border-b border-white/10`) featuring an icon badge, title, record status, and an explicit close button with `X` icon.
5. **Dismissal:** Must support both click-outside dismissal and `Escape` key handling.

### 4.5 Commercial Print Engine & A4 Document Optimization
> **File:** `frontend/src/components/InvoiceDocumentModal.jsx`, `frontend/src/index.css`

**Print Standards:**
- **Isolated iFrame Printing:** Uses a dedicated, hidden `<iframe>` to inject isolated HTML and print styles without affecting the active application DOM.
- **Pure White Print Override:** `@media print` explicitly resets background to pure `#ffffff` and text to `#1e293b`.
- **Zero Black Pages:** Purges dark background CSS during print execution, ensuring clean commercial paper invoices, estimates, and receipts.
- **Indian Number to Words:** Uses `numberToWordsIndian()` helper for formal legal invoice compliance (e.g., *"Five Thousand Four Hundred Rupees Only"*).

---

## 5. Chronological Record of Revamp Milestones

### 5.1 Phase 1 — Login Screen Revamp
- **Hero & Identity:** Rebuilt `frontend/src/pages/Login.jsx` using split-panel layout:
  - Left hero panel with architectural circular geometry, oversized typography (*"One team. One view."* with clean breathable letter-spacing `tracking-[-0.035em]`), and official Murugan Groups brand emblem.
  - Specular perimeter shine animation running along a 45° diamond border via SVG `stroke-dashoffset` (`strokeDasharray="4.8 95.2"`, `strokeWidth="1.1"`).
  - Background contours powered by `TopographicBackground.jsx`.
- **Theme Shift:** Transformed all elements from lime/neon to warm gold/amber:
  - Ambient glow: `bg-amber-400/[0.09]` blur spheres.
  - Inputs: `focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20`.
  - Button: `bg-amber-400 hover:bg-amber-300 text-black font-extrabold shadow-[0_8px_28px_rgba(245,158,11,0.22)]`.
  - Badge & Icons: Fingerprint and ShieldCheck icons highlighted in `text-amber-300` and `text-amber-400/85`.

### 5.2 Phase 2 — Shared App Shell & Fluid Spring Navigation
- **Shell Styling:** Unified dashboard navigation header with `backdrop-blur-xl` and `border-b border-white/10`.
- **Apple-grade Fluid Nav Tabs:** Integrated Framer Motion spring physics with `layoutId` pill highlighting for active navigation items across all role views.
- **Responsive Layout:** Added touch-friendly mobile bottom/drawer navigation for mobile field canvassers while maintaining top bar for desktop executive management.
- **Background Integration:** Connected `DynamicDotGridBackground` to all authenticated role views in `App.jsx`.

### 5.3 Phase 3 & 4 — Canvasser Experience & Logging Suite
- **Form Modernization:** Overhauled `CanvasserDashboard.jsx` visit logging flow:
  - Replaced native inputs with `SchoolSearchPicker` and `CompanyProductSelector`.
  - Added `AestheticDatePicker` for target visit and follow-up date selection.
  - Replaced status dropdowns with `AestheticSelect`.
- **Modal Transformations:** Revamped `EditVisitModal.jsx` and `EditHistoryModal.jsx` into Lucid Block glass modals with clear audit logs and difference highlighting.

### 5.4 Phase 5 — Priority Follow-ups Suite (`FollowUpsPipelineModule.jsx`)
- **5-Bucket Rolling Pipeline**:
  - **Due Tomorrow:** Amber focal glow (`bg-amber-500/15 border-amber-400 text-amber-400`), next day priority indicator.
  - **Due Today:** Luminous urgent rose (`bg-rose-500/15 border-rose-500 text-rose-400`), day-end commitment tracker.
  - **Overdue:** Critical red alert (`bg-red-500/15 border-red-500 text-red-400`), overdue elapsed day counter.
  - **Next 7 Days:** Indigo week-planning queue (`bg-indigo-500/15 border-indigo-400 text-indigo-300`).
  - **All Open:** Total active scheduled pipeline queue with quick reset.
- **Multi-Filter Command Bar**:
  - Global text search with instant clear trigger.
  - Role-scoped Canvasser selector (`AestheticSelect` with live counter) for Admin/CEO.
  - District selector (`AestheticSelect`).
  - Interest Level selector (`AestheticSelect` with Hot, Warm, Cold).
  - Active filter count and instant one-click reset.
- **Luxury Lucid Block Queue Cards**:
  - Luminous top catch rim and subtle scale transition on hover.
  - Clickable institutional school name linking directly to `<SchoolPortfolioModal />` (Admin & CEO only; static for Canvasser).
  - Inset dark communication panel with one-tap phone call (`tel:`) and direct WhatsApp launch (`https://wa.me/`).
  - Glowing animated flame badge for Hot leads (`bg-rose-500/20 text-rose-300 border-rose-500/35`).
  - Meeting notes quote box with amber accent bar.
  - Integrated modal drill-downs: **Call**, **WhatsApp**, **Portfolio** (Admin/CEO only), **Edit Visit**, and **Reschedule**.
- **Modals Integration**:
  - `<SchoolPortfolioModal />` connected for Admin and CEO to inspect full institutional history, past visits, and invoices (hidden for Canvasser).
  - `<EditVisitModal />` connected to edit visit notes, stage, and products with auto-refresh.
  - Portal-rendered reschedule modal with `<AestheticDatePicker />` and body scroll lock.

### 5.5 Team Performance Leaderboard: `CanvasserLeaderboard.jsx`
- **Month Navigation Stepper:** Replaced raw dropdown with unified stepper + `AestheticSelect` (`z-[9999]`) and an `All-Time` cumulative toggle.
- **Sorting Control Bar:** Filter pills with fluid spring animation (`layoutId="activeSortPill"`) supporting sort by Pay, Visits, Invoices, Won Orders, and Conversion.
- **Top 3 Podium:** Gold (1st), Silver (2nd), and Bronze (3rd) medal styling with glow accents.
- **Spacious Aggregate Tiles:** Min-height 114px tiles with uppercase category headers and clear metrics.

### 5.6 Phase 6 — CEO Dashboard Overview (`CEODashboardOverview.jsx`)
- **Executive Command Header**:
  - Luminous top catch line and ambient gold background flare.
  - Apple-grade fluid spring Time Scope segmented control (`Month`, `Q3`, `All`) powered by Framer Motion `layoutId="ceoTimeScopePill"`.
  - **Dynamic Time-Scoped Live Database Filtering (`useMemo`)**:
    - Toggling between `This Month`, `Quarter 3`, and `All-Time` is fully active and dynamically recalculates all executive KPIs, sales velocity, finance collections, debt aging, top institutional clients, rep commission slabs, and monthly trends directly from live database entities.
    - `This Month` scopes to the current calendar month (`now.getMonth()`, `now.getFullYear()`).
    - `Quarter 3` scopes to calendar Q3 (July, August, September).
    - `All-Time` evaluates cumulative company lifetime records.
  - Data integrity breakdown banner separating verified live DB aggregations from modeled benchmarks.
  - One-click Executive MIS CSV Report generator (`handleExportMIS`) exporting scope-aware telemetry.
- **Core Executive Financial & Commercial KPIs (8 Hero Cards)**:
  - Lucid Block cards with top catch rims, font-mono numerical readouts, and live DB vs. Fabricated tags.
  - Highlighted card variants for Revenue (Amber), Collections (Emerald), and Overdue Debt (Rose).
  - Explicit mathematical formula annotations (e.g., Gross Profit COGS 52%, EBITDA Opex 24%, Pipeline Lead weights).
- **10 Unified Domain Modules**:
  1. *Sales Engine & Pipeline Intelligence*: Live pipeline value, active quote totals, deal sizes, and quarterly goal progress bar.
  2. *Finance, Cash Flow & Receivables Aging*: Real-time inflow, liabilities, 4 debt aging brackets, and payment settlement log.
  3. *Operations, Delivery & Follow-Up Deadlines*: Orders in progress, sample velocity, quote backlog, and priority follow-up cards with direct call links and shortcut to Central Follow-Ups Hub.
  4. *Inventory Catalog & Product Demand*: Category velocity horizontal meter bars with luminous amber-to-yellow gradient fills (`from-amber-500 via-amber-400 to-yellow-300`), amber icon badge, and yellow SKU counter.
  5. *Institutional Customer Base & Retention*: Territory penetration metrics, top revenue schools table with formatted billed/settled/outstanding readouts, and shortcut to Master Schools Directory.
  6. *Procurement Economics & Sourcing COGS*: Production cost models, allocation ratios, and blended margin readouts.
  7. *Marketing Outreach & Lead Qualification*: Hot, warm, and cold lead segmentation and campaign ROI performance.
  8. *People, Team Leaderboard & Commission Slabs*: Complete rep roster table with Gold, Silver, and Bronze medal initial badges, commission tier indicators (1%–5%), and shortcut to Full Leaderboard.
  9. *Management Oversight, Decisions & Action Alerts*: Pending governance approvals list with "Review" triggers into `<PendingApprovalsDrawer />`, and critical overdue debt alerts.
  10. *Reporting, Monthly MIS Trends & Velocity*: Longitudinal monthly billing vs. collection trajectory cards and export trigger.

---

## 6. Implementation Blueprint for Upcoming Modules

When revamping or touching any of the following upcoming screens, adhere to these specific component mappings:

### 6.1 Central Visit Registry (`FieldVisitRegistry.jsx`)
- **Filters Bar:** Replace raw `<select>` elements (`selectedDistrict`, `selectedCanvasser`, `selectedInterest`, `selectedStatus`, `selectedOrigin`, `selectedProduct`) with `<AestheticSelect size="sm" />`.
- **Table / List Rows:** Upgrade visit cards to use Lucid Block styling (`bg-[#0c0d15]/85 border border-white/[0.08] hover:border-amber-400/30 rounded-2xl`).
- **Product & Status Badges:** Use `<ProductBadge />` and rounded-full clone tags with amber/emerald/purple status tints.
- **Action Buttons:** Use icon buttons with `bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white` and amber accent triggers.

### 6.2 Priority Follow-ups (Admin & CEO Views)
- **Bucket Synchronization:** Reuse the exact bucket tab logic and visual hierarchy from `FollowUpsPipelineModule.jsx` (Tomorrow = Amber, Today = Rose, Overdue = Red).
- **Direct Actions:** Ensure Call, Reschedule (`AestheticDatePicker`), and School Portfolio drill-downs use the unified modal styling.

### 6.3 Master Schools Directory (`MasterSchoolsDirectoryModule.jsx`)
- **Filters & Search:** Use `AestheticSelect` for category, district, and syllabus filters. Search bar must match the standard input styling (`min-h-[48px] rounded-xl border border-white/[0.14] bg-black/25 focus:border-amber-400/70`).
- **School Portfolio Modal:** Ensure portfolio drawer uses portal rendering, scroll lock, and amber KPI metrics.

### 6.4 User Directory & Roles (`UserManagementModule.jsx`)
- **Role Badges:** CEO (Amber/Gold), CFO (Purple), CCO (Cyan), Admin (Blue), Canvasser (Emerald).
- **Approval Queue Drawer:** Consistent Lucid Block glass styling with green confirm and rose reject actions.

---

## 7. Strict Developer & Agent Revamp Rules

1. **Never Invent Requirements:** Preserve every existing feature, filter, button, permission, and role boundary.
2. **Frontend-Only Scope:** Do not touch backend models, SQLite/PostgreSQL schemas, or API endpoints.
3. **No Raw Selects or Date Pickers:** Always use `<AestheticSelect />` and `<AestheticDatePicker />`.
4. **Primary Brand Theme:** Always use Warm Gold / Amber (`amber-400`, `#f59e0b`, `#d9b763`). Never introduce neon lime/green for primary buttons or shell elements.
5. **No Monospace in Headers:** Reserve `font-mono` strictly for tabular numbers, amounts, and codes.
6. **Modal Stacking & Scroll Lock:** All modals must render via `createPortal` to `document.body` and lock body overflow.
7. **Commit Constraint:** The AI agent must never run `git commit`. All commits are executed manually by the user.
