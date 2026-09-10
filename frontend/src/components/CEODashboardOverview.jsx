import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Target,
  Briefcase,
  Sparkles,
  Award,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileCheck,
  Trophy,
  Receipt,
  Truck,
  Package,
  Users,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Download,
  RefreshCw,
  Phone,
  Building2,
  Clock,
  ChevronRight,
  AlertTriangle,
  PieChart,
  Megaphone,
  ShoppingBag,
  Sliders,
  Check,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { mockApi } from '../mockApi';

export default function CEODashboardOverview({ currentUser, onOpenApprovals, onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDomainFilter, setActiveDomainFilter] = useState('all');
  const [timeScope, setTimeScope] = useState('Q3'); // 'All' | 'Q3' | 'Month'
  const [exportNotice, setExportNotice] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Try backend first, fallback to mockApi helper
      const hubData = await mockApi.getCEODashboardHubData();
      setData(hubData);
    } catch (err) {
      console.error('Failed to load CEO dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleExportMIS = () => {
    if (!data) return;
    const rows = [
      ['Murugan Canvass - CEO Executive MIS Report'],
      ['Generated On', new Date().toLocaleString()],
      ['Time Scope', timeScope],
      [],
      ['EXECUTIVE KPIS'],
      ['KPI', 'Value', 'Status', 'Benchmark / Target'],
      ['Total Revenue (Billed)', data.executiveKPIs[0]?.value, 'On Track', 'Target: ₹35.00L'],
      ['Gross Profit & Margin', data.executiveKPIs[1]?.value, 'Healthy', data.executiveKPIs[1]?.change],
      ['Net Profit (EBITDA)', data.executiveKPIs[2]?.value, 'Profitable', data.executiveKPIs[2]?.change],
      ['Cash Inflow (Collections)', data.executiveKPIs[3]?.value, 'Cleared', `${data.finance?.collectionRate}% Rate`],
      ['Accounts Receivable', data.executiveKPIs[4]?.value, data.finance?.overdueCount > 0 ? 'Action Required' : 'Current', `Overdue: ₹${(data.finance?.overdueAmount / 100000).toFixed(2)}L`],
      ['Orders Won & Invoiced', data.executiveKPIs[5]?.value, 'Active', `Win Rate: ${data.sales?.winRate}%`],
      ['Live Sales Pipeline', data.executiveKPIs[6]?.value, 'Strong', `${data.sales?.quotationsCount} Active Quotes`],
      [],
      ['SALES & DEAL METRICS'],
      ['Metric', 'Value'],
      ['Total Visited Institutions', data.sales?.visitedCustomers],
      ['Converted Paying Accounts', data.sales?.convertedCustomers],
      ['Average Deal Size', `₹${(data.sales?.avgDealValue || 0).toLocaleString('en-IN')}`],
      ['Highest Single Deal', `₹${(data.sales?.highestDealValue || 0).toLocaleString('en-IN')}`],
      ['Quarterly Target Progress', `${data.sales?.targetProgress}% of ₹35.00L`],
      [],
      ['FINANCE & RECEIVABLES AGING'],
      ['Bucket', 'Invoices Count', 'Amount (INR)'],
      ['0 - 30 Days (Current)', data.finance?.agingBuckets?.current?.count, data.finance?.agingBuckets?.current?.amount],
      ['31 - 60 Days', data.finance?.agingBuckets?.days31_60?.count, data.finance?.agingBuckets?.days31_60?.amount],
      ['61 - 90 Days', data.finance?.agingBuckets?.days61_90?.count, data.finance?.agingBuckets?.days61_90?.amount],
      ['90+ Days (High Risk)', data.finance?.agingBuckets?.days90Plus?.count, data.finance?.agingBuckets?.days90Plus?.amount],
      ['Commissions Payable Liability', '', data.finance?.commissionsPayable],
      [],
      ['TOP INSTITUTIONAL ACCOUNTS'],
      ['School Name', 'District', 'Total Billed (INR)', 'Total Paid (INR)', 'Outstanding (INR)'],
      ...(data.customers?.topCustomers || []).map(c => [
        c.name,
        c.district,
        c.totalBilled,
        c.totalPaid,
        c.outstanding
      ]),
      [],
      ['FIELD SALES TEAM PERFORMANCE'],
      ['Canvasser Name', 'Role', 'Visits Logged', 'Orders Won', 'Billed Revenue (INR)', 'Commission Slab', 'Commission Earned (INR)'],
      ...(data.people?.canvasserRoster || []).map(r => [
        r.name,
        r.roleTitle,
        r.visits,
        r.won,
        r.invoiced,
        r.slabLabel,
        r.commission
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CEO_Executive_MIS_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3500);
  };

  const domainTabs = [
    { id: 'all', label: 'All Command Hubs', icon: Sliders },
    { id: 'sales', label: 'Sales & Pipeline', icon: TrendingUp },
    { id: 'finance', label: 'Finance & Cash Flow', icon: DollarSign },
    { id: 'operations', label: 'Operations & Delays', icon: Truck },
    { id: 'inventory', label: 'Inventory & Demand', icon: Package },
    { id: 'customers', label: 'Customers & Reach', icon: Building2 },
    { id: 'procurement', label: 'Procurement & COGS', icon: ShoppingBag },
    { id: 'marketing', label: 'Marketing & Outreach', icon: Megaphone },
    { id: 'people', label: 'People & Leaderboard', icon: Users },
    { id: 'management', label: 'CEO Decisions & Alerts', icon: ShieldAlert },
    { id: 'reporting', label: 'Reporting & MIS', icon: BarChart3 }
  ];

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-20 bg-[#14151c] rounded-3xl border border-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-32 bg-[#14151c] rounded-2xl border border-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-[#14151c] rounded-3xl border border-white/5" />
          <div className="h-80 bg-[#14151c] rounded-3xl border border-white/5" />
        </div>
      </div>
    );
  }

  const {
    executiveKPIs,
    sales,
    finance,
    operations,
    inventory,
    customers,
    procurement,
    marketing,
    people,
    management,
    reporting
  } = data;

  const isVisible = (domainId) => activeDomainFilter === 'all' || activeDomainFilter === domainId;

  return (
    <div className="space-y-8 pb-12">
      {/* ── TOP EXECUTIVE CONTROLS & STATUS BAR ────────────────────────── */}
      <div className="bg-gradient-to-r from-[#181924] via-[#151620] to-[#12131a] border border-amber-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-black tracking-widest text-amber-400 uppercase">
                CEO Company Operations
              </span>
              <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-md font-mono">
                FY 2026-27
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Executive Performance & Overview
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Summary of school visits, billing, payments received, and active quotations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Scope Toggle */}
            <div className="bg-black/40 border border-white/10 p-1 rounded-2xl flex items-center gap-1">
              {['Month', 'Q3', 'All'].map(scope => (
                <button
                  key={scope}
                  onClick={() => setTimeScope(scope)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeScope === scope
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {scope === 'Month' ? 'This Month' : scope === 'Q3' ? 'Quarter 3' : 'All-Time'}
                </button>
              ))}
            </div>

            {/* Quick Action: Export MIS */}
            <button
              onClick={handleExportMIS}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Download executive summary report as CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Report</span>
            </button>

            {/* Quick Action: Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-2xl text-xs font-semibold transition"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {exportNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>CEO Executive MIS Report generated and downloaded successfully!</span>
          </motion.div>
        )}
      </div>

      {/* ── 1. EXECUTIVE KPIS STRIP (8 HERO METRICS) ────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Core Executive Financial & Commercial KPIs
          </h3>
          <span className="text-[11px] text-gray-500">Live Real-Time Calculations</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {executiveKPIs.map((kpi, idx) => {
            const isRevenue = kpi.id === 'kpi_rev';
            const isReceivables = kpi.id === 'kpi_ar';
            const isCash = kpi.id === 'kpi_cash';

            return (
              <motion.div
                key={kpi.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${isRevenue
                    ? 'bg-gradient-to-br from-amber-500/15 via-[#1a1b24] to-[#12131a] border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : isReceivables && finance.overdueCount > 0
                      ? 'bg-gradient-to-br from-rose-500/10 via-[#181922] to-[#12131a] border-rose-500/30'
                      : isCash
                        ? 'bg-gradient-to-br from-emerald-500/10 via-[#181922] to-[#12131a] border-emerald-500/30'
                        : 'bg-[#14151d] border-white/10 hover:border-white/20'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-gray-400">
                    <span className="truncate">{kpi.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${kpi.trend === 'up'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : kpi.status === 'warning'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          : 'bg-white/10 text-gray-300'
                      }`}>
                      {kpi.change}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {kpi.value}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] text-gray-400 leading-snug line-clamp-2">
                  {kpi.subtext}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── DOMAIN SWITCHER FILTER PILLS ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-[#14151c] border border-white/10 p-2 rounded-2xl">
        {domainTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeDomainFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDomainFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${isActive
                  ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. DETAILED DOMAIN HUBS (10 DISTINCT SECTIONS) ───────────────── */}

      {/* ── SECTION 1: SALES & PIPELINE ─────────────────────────────────── */}
      {isVisible('sales') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Sales Engine & Pipeline Intelligence</h3>
                <p className="text-xs text-gray-400">Institutional sales pipeline, active quote values, conversion rates & targets</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              Win Rate: {sales.winRate}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Live Pipeline Value</span>
              <div className="text-xl font-black text-white">₹{(sales.totalPipelineValue / 100000).toFixed(2)}L</div>
              <p className="text-[11px] text-gray-500">Active quotes + high-intent leads</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Active Quotations Value</span>
              <div className="text-xl font-black text-amber-400">₹{(sales.activeQuotesValue / 100000).toFixed(2)}L</div>
              <p className="text-[11px] text-gray-500">{sales.quotationsCount} Institutional quotations issued</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Average Deal Size</span>
              <div className="text-xl font-black text-white">₹{(sales.avgDealValue).toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-gray-500">Highest Closed: ₹{(sales.highestDealValue).toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Quarterly Target Progress</span>
              <div className="text-xl font-black text-emerald-400">{sales.targetProgress}%</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${sales.targetProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: FINANCE & CASH FLOW ──────────────────────────────── */}
      {isVisible('finance') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Finance, Cash Flow & Receivables Aging</h3>
                <p className="text-xs text-gray-400">Cash collections, payables, commission liabilities & debt aging brackets</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Collection Rate: {finance.collectionRate}%
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Summary */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Inflow & Liabilities Summary</h4>
              <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total Billed Invoices</span>
                  <span className="font-bold text-white">₹{(finance.totalInvoiced / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Cash Inflow Cleared</span>
                  <span className="font-bold text-emerald-400">₹{(finance.totalCollected / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Pending Receivables</span>
                  <span className="font-bold text-amber-400">₹{(finance.totalReceivables / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <span className="text-gray-400">Canvasser Commission Liability</span>
                  <span className="font-bold text-indigo-400">₹{(finance.commissionsPayable).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Est. COGS (Production Cost)</span>
                  <span className="font-bold text-gray-300">₹{(finance.estimatedCOGS / 100000).toFixed(2)}L</span>
                </div>
              </div>
            </div>

            {/* Receivables Aging Buckets */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Receivables Aging Analysis</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(finance.agingBuckets).map(([key, bucket]) => {
                  const isHighRisk = key === 'days90Plus';
                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-2xl border ${isHighRisk && bucket.amount > 0
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-black/30 border-white/5'
                        }`}
                    >
                      <span className="text-[11px] text-gray-400 block font-medium">{bucket.label}</span>
                      <div className="text-lg font-black text-white mt-1">
                        ₹{(bucket.amount / 100000).toFixed(2)}L
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        {bucket.count} Invoices
                      </span>
                    </div>
                  );
                })}
              </div>

              {finance.overdueCount > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center justify-between text-xs text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span><strong>{finance.overdueCount} Invoices Overdue</strong> totaling ₹{(finance.overdueAmount / 100000).toFixed(2)}L</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('invoicing')}
                    className="text-[11px] font-bold text-rose-400 underline hover:text-white"
                  >
                    View in Invoicing →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: OPERATIONS & FULFILLMENT ──────────────────────────── */}
      {isVisible('operations') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Operations, Samples & Dispatch Tracking</h3>
                <p className="text-xs text-gray-400">Order fulfillment lifecycle, sample pack evaluation & follow-up delays</p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              {operations.totalOrders} Active Orders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Sample Packs Dispatched</span>
              <div className="text-xl font-black text-cyan-400">{operations.sampleSentCount} Schools</div>
              <p className="text-[11px] text-gray-500">Physical socks & fabric swatches in school review</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Formal Quotations Given</span>
              <div className="text-xl font-black text-amber-400">{operations.quoteGivenCount} Accounts</div>
              <p className="text-[11px] text-gray-500">Commercial proposals awaiting committee approval</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Billed & Dispatched Invoices</span>
              <div className="text-xl font-black text-emerald-400">{operations.activeInvoices} Executed</div>
              <p className="text-[11px] text-gray-500">Goods dispatched or delivery in progress</p>
            </div>
          </div>

          {operations.overdueFollowUpsCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Overdue Canvasser Follow-up Visits ({operations.overdueFollowUpsCount})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {operations.overdueFollowUps.map(f => (
                  <div key={f.id} className="bg-black/40 border border-amber-500/20 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{f.school_name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Canvasser: <span className="text-amber-400 font-semibold">{f.canvasser_name}</span> • Due: {f.follow_up_date}
                      </div>
                    </div>
                    <a
                      href={`tel:${f.phone}`}
                      className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition"
                      title="Call Contact"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: INVENTORY & PRODUCT DEMAND ────────────────────────── */}
      {isVisible('inventory') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Inventory Catalog & Product Demand</h3>
                <p className="text-xs text-gray-400">Stock product catalog, category velocity & demand in field visits</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
              {inventory.productsCatalogCount} Standard SKUs
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Demand Products */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Field Demand Frequency by Product</h4>
              <div className="space-y-2.5">
                {inventory.demandDistribution.map(item => {
                  const maxCount = Math.max(...inventory.demandDistribution.map(i => i.count), 1);
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.product} className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-4">
                      <div className="w-44 text-xs font-bold text-white truncate">{item.product}</div>
                      <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-400 to-purple-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-amber-400 w-16 text-right">{item.count} Inquiries</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product Catalog Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Product Categories & Price Points</h4>
              <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2.5">
                {inventory.products.slice(0, 6).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <span className="text-[10px] text-gray-500">{p.category} • HSN {p.hsn || '6115'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400">₹{p.unit_price}</span>
                      <span className="text-[10px] text-gray-400 block">/{p.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 5: CUSTOMERS & INSTITUTIONAL ACCOUNTS ─────────────────── */}
      {isVisible('customers') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Institutional Customer Base & Retention</h3>
                <p className="text-xs text-gray-400">Master School Directory coverage, top billing institutions & account profitability</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('schools')}
              className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition"
            >
              <span>Explore Master Directory (2,480+)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reach Stats */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Territory Coverage</h4>
              <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Master Catalog Directory</span>
                  <span className="font-bold text-white">{customers.masterSchoolsTotal} Schools</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Canvassed / Visited</span>
                  <span className="font-bold text-amber-400">{customers.visitedCount} Schools</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Converted Client Accounts</span>
                  <span className="font-bold text-emerald-400">{customers.topCustomers.length} Accounts</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <span className="text-gray-400">Active Territory Penetration</span>
                  <span className="font-bold text-blue-400">{customers.penetrationRate}%</span>
                </div>
              </div>
            </div>

            {/* Top Revenue Schools */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Top Revenue Contributing Institutions</h4>
              <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 border-b border-white/10">
                      <th className="p-3 font-semibold">School Name</th>
                      <th className="p-3 font-semibold">District</th>
                      <th className="p-3 font-semibold text-right">Total Billed</th>
                      <th className="p-3 font-semibold text-right">Settled</th>
                      <th className="p-3 font-semibold text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customers.topCustomers.map(sc => (
                      <tr key={sc.name} className="hover:bg-white/5 transition">
                        <td className="p-3 font-bold text-white">{sc.name}</td>
                        <td className="p-3 text-gray-400">{sc.district}</td>
                        <td className="p-3 text-right font-black text-amber-400">₹{(sc.totalBilled / 100000).toFixed(2)}L</td>
                        <td className="p-3 text-right text-emerald-400 font-semibold">₹{(sc.totalPaid / 100000).toFixed(2)}L</td>
                        <td className="p-3 text-right text-gray-300">
                          {sc.outstanding > 0 ? `₹${(sc.outstanding / 100000).toFixed(2)}L` : <span className="text-emerald-400 font-bold">Clear</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 6: PROCUREMENT & SOURCING ────────────────────────────── */}
      {isVisible('procurement') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Procurement Economics & Sourcing COGS</h3>
                <p className="text-xs text-gray-400">Material production costs, unit economics & wholesale margins</p>
              </div>
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
              Average Margin: {procurement.avgMarginPerUnit}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Estimated Sourcing COGS</span>
              <div className="text-xl font-black text-white">₹{(procurement.estCOGS / 100000).toFixed(2)}L</div>
              <p className="text-[11px] text-gray-500">Direct fabric & yarn production liability</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">COGS Allocation Ratio</span>
              <div className="text-xl font-black text-orange-400">{procurement.cogsRatio}</div>
              <p className="text-[11px] text-gray-500">Benchmark target: &lt;55% of billed sales</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Blended Gross Margin</span>
              <div className="text-xl font-black text-emerald-400">{finance.grossMarginPct}%</div>
              <p className="text-[11px] text-gray-500">Socks, Apparel & Custom Crest Buckles</p>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-gray-400 font-medium">Key Sourcing Categories</span>
              <div className="text-sm font-bold text-white mt-1">4 Active Product Lines</div>
              <p className="text-[11px] text-gray-400 truncate">Hosiery • Apparel • Footwear • Belts</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 7: MARKETING & FIELD OUTREACH ────────────────────────── */}
      {isVisible('marketing') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Marketing Outreach & Lead Qualification</h3>
                <p className="text-xs text-gray-400">Canvassing campaigns, lead quality segmentation & acquisition efficiency</p>
              </div>
            </div>
            <span className="text-xs font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
              Estimated ROI: {marketing.estROI}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lead Funnel Segmentation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Field Lead Qualification Mix</h4>
              <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-red-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Hot Leads
                  </span>
                  <span className="font-black text-white">{marketing.hotLeads} Schools</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Warm Leads
                  </span>
                  <span className="font-black text-white">{marketing.warmLeads} Schools</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-blue-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Cold Leads
                  </span>
                  <span className="font-black text-white">{marketing.coldLeads} Schools</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <span className="text-gray-400">Total School Visits Logged</span>
                  <span className="font-bold text-white">{marketing.totalVisits}</span>
                </div>
              </div>
            </div>

            {/* Campaign Drives */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Active Institutional Outreach Campaigns</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(marketing.campaigns || []).slice(0, 4).map(c => (
                  <div key={c.id} className="bg-black/30 border border-white/5 p-3.5 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">
                        {c.status || 'Active'}
                      </span>
                      <span className="text-xs font-black text-emerald-400">{c.roi || '5.2x ROI'}</span>
                    </div>
                    <div className="font-bold text-white text-xs leading-snug">{c.name}</div>
                    <div className="text-[11px] text-gray-400">
                      Target: {c.target} • {c.leads} Leads
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 8: PEOPLE & TEAM PERFORMANCE ─────────────────────────── */}
      {isVisible('people') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">People, Team Leaderboard & Commission Slabs</h3>
                <p className="text-xs text-gray-400">Canvasser sales productivity, commission slab tiers (1%–5%) & headcount</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('team')}
              className="text-xs font-bold text-yellow-400 hover:text-white flex items-center gap-1 transition"
            >
              <span>Full Leaderboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-400 border-b border-white/10">
                  <th className="p-3 font-semibold">Rep Name</th>
                  <th className="p-3 font-semibold">Role Title</th>
                  <th className="p-3 font-semibold text-center">Visits</th>
                  <th className="p-3 font-semibold text-center">Won</th>
                  <th className="p-3 font-semibold text-right">Billed Invoiced</th>
                  <th className="p-3 font-semibold text-center">Commission Slab</th>
                  <th className="p-3 font-semibold text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {people.canvasserRoster.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                      <span>{r.name}</span>
                    </td>
                    <td className="p-3 text-gray-400">{r.roleTitle}</td>
                    <td className="p-3 text-center text-white font-bold">{r.visits}</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">{r.won}</td>
                    <td className="p-3 text-right font-black text-amber-400">₹{(r.invoiced / 100000).toFixed(2)}L</td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                        {r.rate}% Slab
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-white">{r.commissionFormatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECTION 9: MANAGEMENT, CEO DECISIONS & ALERTS ────────────────── */}
      {isVisible('management') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Management Oversight, Decisions & Action Alerts</h3>
                <p className="text-xs text-gray-400">Pending CEO governance queue, overdue invoice escalations & priorities</p>
              </div>
            </div>
            <button
              onClick={onOpenApprovals}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <span>{management.pendingApprovalsCount} Approvals Pending</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CEO Decision Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Pending User & School Approvals</h4>
              <div className="space-y-2.5">
                {management.pendingApprovals.map(app => (
                  <div key={app.id} className="bg-black/30 border border-amber-500/20 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{app.title || app.action_type || 'User Action Authorization'}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">ID: {app.id} • Status: PENDING</div>
                    </div>
                    <button
                      onClick={onOpenApprovals}
                      className="px-3 py-1 bg-amber-400 text-black font-black text-[10px] rounded-lg hover:bg-amber-300 transition"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue Debt Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Critical Overdue Invoices Requiring Escalation</h4>
              <div className="space-y-2.5">
                {management.overdueInvoices.length === 0 ? (
                  <div className="bg-black/30 border border-white/5 p-4 rounded-2xl text-xs text-gray-500 text-center">
                    No critical overdue debts at this time.
                  </div>
                ) : (
                  management.overdueInvoices.map(inv => (
                    <div key={inv.id} className="bg-black/30 border border-rose-500/20 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{inv.school_name}</div>
                        <div className="text-[10px] text-rose-400 mt-0.5">Due Date: {inv.due_date} • Rep: {inv.canvasser_name}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-rose-400">
                          ₹{((inv.pending_balance !== undefined ? inv.pending_balance : inv.outstanding_balance) / 100000).toFixed(2)}L
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 10: REPORTING & MONTHLY MIS TRENDS ───────────────────── */}
      {isVisible('reporting') && (
        <div className="bg-[#14151c] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Reporting, Monthly MIS Trends & Velocity</h3>
                <p className="text-xs text-gray-400">Monthly billing vs cash collection trajectories & longitudinal trends</p>
              </div>
            </div>
            <button
              onClick={handleExportMIS}
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MIS Report</span>
            </button>
          </div>

          {/* Monthly Trend Visualizer */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Monthly Performance (Billed Sales vs Collections)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {reporting.monthlyTrend.map(m => (
                <div key={m.month} className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2 text-center">
                  <div className="text-xs font-black text-amber-400">{m.month} 2026</div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400">
                      Billed: <strong className="text-white">₹{(m.billed / 100000).toFixed(2)}L</strong>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Cash: <strong className="text-emerald-400">₹{(m.collected / 100000).toFixed(2)}L</strong>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {m.visits || 0} Visits Logged
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
