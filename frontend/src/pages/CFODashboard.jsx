import React, { useState, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, AlertTriangle, TrendingUp, TrendingDown, IndianRupee,
  Wallet, CreditCard, Package, Users, BarChart3, Landmark,
  Receipt, History, Trophy, Bell, ChevronDown, CheckCircle2,
  Calendar, Layers, Sparkles, Filter, X
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
  ComposedChart, Area
} from 'recharts';
import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import { cn } from '../lib/utils';

// ─── Thresholds ───────────────────────────────────────────────────────────────
const THRESHOLDS = {
  GP_PCT_MIN: 30,       // Alert if GP% falls below 30%
  GP_DROP_MAX_PCT: 15,  // Alert if GP drops >15% vs last month
  TARGET_ACH_MIN: 85,   // Alert if achievement% < 85%
};

// ─── Mock Financial Data ─────────────────────────────────────────────────────
const MONTHLY = [
  { month: 'Jan', sales: 18, cogs: 10.8, gp: 7.2,  gp_pct: 40, collection: 16, receivables: 8,  overdue: 2, inventory: 22, payables: 5,  cash_in: 16, cash_out: 14, net_cf: 2  },
  { month: 'Feb', sales: 20, cogs: 12.4, gp: 7.6,  gp_pct: 38, collection: 17, receivables: 9,  overdue: 2, inventory: 23, payables: 5,  cash_in: 18, cash_out: 16, net_cf: 2  },
  { month: 'Mar', sales: 22, cogs: 13.9, gp: 8.1,  gp_pct: 37, collection: 18, receivables: 10, overdue: 3, inventory: 25, payables: 6,  cash_in: 20, cash_out: 18, net_cf: 2  },
  { month: 'Apr', sales: 19, cogs: 11.8, gp: 7.0,  gp_pct: 37, collection: 16, receivables: 10, overdue: 3, inventory: 27, payables: 6,  cash_in: 19, cash_out: 21, net_cf: -2 },
  { month: 'May', sales: 27, cogs: 17.8, gp: 9.2,  gp_pct: 34, collection: 20, receivables: 10, overdue: 3, inventory: 28, payables: 7,  cash_in: 21, cash_out: 18, net_cf: 3  },
  { month: 'Jun', sales: 32, cogs: 21.0, gp: 11.0, gp_pct: 34, collection: 23, receivables: 12, overdue: 4, inventory: 30, payables: 8,  cash_in: 24, cash_out: 21, net_cf: 3  },
];

const THIS_MONTH = MONTHLY[5];
const LAST_MONTH = MONTHLY[4];

const KPI_TARGETS = {
  sales: 35, gross_profit: 12, gp_pct: 34, collection: 25,
  receivables: 10, overdue: 3, inventory: 28, payables: 7,
  cash_balance: 1.5, bank_balance: 8,
};

const AGEING = [
  { bucket: '0–30 Days',  amount: 5.0, fill: '#10b981' },
  { bucket: '31–60 Days', amount: 2.5, fill: '#3b82f6' },
  { bucket: '61–90 Days', amount: 1.5, fill: '#f59e0b' },
  { bucket: '90+ Days',   amount: 4.0, fill: '#ef4444' },
];

const CATEGORY_SALES = [
  { cat: 'Socks', sales: 14.2, gp: 5.1, gp_pct: 36, color: '#f59e0b' },
  { cat: 'Belts', sales: 10.8, gp: 3.8, gp_pct: 35, color: '#10b981' },
  { cat: 'Ties',  sales: 7.0,  gp: 2.1, gp_pct: 30, color: '#3b82f6' },
];

const AVT_ROWS = [
  { kpi: 'Sales (L)',          actual: THIS_MONTH.sales,       target: KPI_TARGETS.sales,         unit: 'L' },
  { kpi: 'Gross Profit (L)',   actual: THIS_MONTH.gp,          target: KPI_TARGETS.gross_profit,  unit: 'L' },
  { kpi: 'GP %',               actual: THIS_MONTH.gp_pct,      target: KPI_TARGETS.gp_pct,        unit: '%' },
  { kpi: 'Collection (L)',     actual: THIS_MONTH.collection,  target: KPI_TARGETS.collection,    unit: 'L' },
  { kpi: 'Inventory (L)',      actual: THIS_MONTH.inventory,   target: KPI_TARGETS.inventory,     unit: 'L' },
  { kpi: 'Overdue (L)',        actual: THIS_MONTH.overdue,     target: KPI_TARGETS.overdue,       unit: 'L', lowerIsBetter: true },
  { kpi: 'Payables (L)',       actual: THIS_MONTH.payables,    target: KPI_TARGETS.payables,      unit: 'L', lowerIsBetter: true },
  { kpi: 'Cash Balance (L)',   actual: 1.0,                    target: KPI_TARGETS.cash_balance,  unit: 'L' },
  { kpi: 'Bank Balance (L)',   actual: 9.0,                    target: KPI_TARGETS.bank_balance,  unit: 'L' },
];

// ─── Alert Engine ─────────────────────────────────────────────────────────────
function computeAlerts() {
  const alerts = [];
  if (THIS_MONTH.gp_pct < THRESHOLDS.GP_PCT_MIN) {
    alerts.push({ key: 'gp_pct', msg: `GP% is ${THIS_MONTH.gp_pct}% — below threshold of ${THRESHOLDS.GP_PCT_MIN}%`, severity: 'critical' });
  }
  const gpDropPct = ((LAST_MONTH.gp - THIS_MONTH.gp) / LAST_MONTH.gp) * 100;
  if (gpDropPct > THRESHOLDS.GP_DROP_MAX_PCT) {
    alerts.push({ key: 'gp_drop', msg: `Gross Profit dropped ${gpDropPct.toFixed(1)}% vs last month`, severity: 'critical' });
  }
  AVT_ROWS.forEach((r) => {
    const ach = r.lowerIsBetter
      ? r.actual <= r.target ? 100 : Math.round((r.target / r.actual) * 100)
      : Math.round((r.actual / r.target) * 100);
    if (!r.lowerIsBetter && ach < THRESHOLDS.TARGET_ACH_MIN) {
      alerts.push({ key: r.kpi, msg: `${r.kpi}: Achievement ${ach}% — below ${THRESHOLDS.TARGET_ACH_MIN}% target`, severity: 'warning' });
    }
  });
  if (THIS_MONTH.overdue >= 4) {
    alerts.push({ key: 'overdue', msg: `Overdue is ₹${THIS_MONTH.overdue}L — High. Immediate collection action required.`, severity: 'critical' });
  }
  return alerts;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl">
      <p className="text-gray-400 mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? `₹${p.value}L` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function CFODashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('cfo_overview'); // 'cfo_overview', 'invoicing', 'logs', 'team'
  const [cfoSubTab, setCfoSubTab] = useState('summary'); // 'summary', 'trends', 'avt'
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

  const alerts = useMemo(() => computeAlerts(), []);
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  const navTabs = [
    { id: 'cfo_overview', label: 'CFO Financial Strategy', icon: Landmark },
    { id: 'invoicing', label: 'Invoicing & Records', icon: Receipt },
    { id: 'logs', label: 'Central Visit Logs', icon: History },
    { id: 'team', label: 'Team Leaderboard', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-16 selection:bg-murugan-accent selection:text-black">
      {/* Header */}
      <header className="bg-[#14151b]/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-400/20">
                MC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white">Murugan Canvass</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Landmark className="w-3 h-3" /> CFO — Financial Authority
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user?.name} ({user?.roleTitle || 'Chief Financial Officer'})</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">P&L, Margins, Cash Flow & Financial Governance</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {alerts.length > 0 && (
                <button
                  onClick={() => setShowAlertsDrawer(true)}
                  className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl transition text-xs font-bold text-rose-300 flex items-center gap-1.5 shadow-sm"
                >
                  <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                  <span>{alerts.length} Financial Alerts</span>
                </button>
              )}

              <button 
                onClick={() => setUser(null)}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 relative",
                    isActive 
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-xl shadow-amber-400/20 font-black scale-[1.02]" 
                      : "bg-[#1c1d25] text-gray-400 hover:text-white hover:bg-[#252632] border border-white/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {activeTab === 'cfo_overview' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* CFO Sub-navigation Pills */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-3 rounded-2xl border border-white/10 shadow-lg">
              <div className="flex space-x-2">
                {[
                  { id: 'summary', label: 'Executive P&L Summary' },
                  { id: 'trends', label: 'Trend & Cash Flow Analytics' },
                  { id: 'avt', label: 'Actual vs Target Benchmarks' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setCfoSubTab(sub.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                      cfoSubTab === sub.id
                        ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
                    )}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Period: <strong>June 2026 (Live Close)</strong></span>
              </div>
            </div>

            {/* View 1: Summary */}
            {cfoSubTab === 'summary' && (
              <div className="space-y-6">
                {/* 5 Core Financial Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {[
                    { label: 'Revenue (Sales)', val: `₹${THIS_MONTH.sales}L`, sub: '+18.5% MoM', icon: IndianRupee, color: 'text-amber-400' },
                    { label: 'COGS Expense', val: `₹${THIS_MONTH.cogs}L`, sub: '65.6% of Rev', icon: Layers, color: 'text-rose-400' },
                    { label: 'Gross Profit', val: `₹${THIS_MONTH.gp}L`, sub: '+19.6% MoM', icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Gross Margin %', val: `${THIS_MONTH.gp_pct}%`, sub: 'Target: 34%', icon: BarChart3, color: 'text-purple-400' },
                    { label: 'Collections Done', val: `₹${THIS_MONTH.collection}L`, sub: '71.8% Velocity', icon: Wallet, color: 'text-blue-400' },
                  ].map(c => {
                    const Icon = c.icon;
                    return (
                      <div key={c.label} className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-400">{c.label}</span>
                          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                            <Icon className={cn("w-3.5 h-3.5", c.color)} />
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xl sm:text-2xl font-black text-white">{c.val}</p>
                          <span className="text-[10px] text-gray-400 font-semibold">{c.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Working Capital & Balance Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Receivables (AR)', val: `₹${THIS_MONTH.receivables}L`, sub: 'Total outstanding' },
                    { label: 'Overdue (>30d)', val: `₹${THIS_MONTH.overdue}L`, sub: 'Alert: High', alert: true },
                    { label: 'Payables (AP)', val: `₹${THIS_MONTH.payables}L`, sub: 'Vendor dues' },
                    { label: 'Net Cash Flow', val: `+₹${THIS_MONTH.net_cf}L`, sub: 'Surplus generated' },
                  ].map(wc => (
                    <div key={wc.label} className={cn(
                      "p-4 rounded-2xl border shadow-md flex items-center justify-between",
                      wc.alert 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-300" 
                        : "bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border-white/10 text-white"
                    )}>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400">{wc.label}</p>
                        <p className="text-lg font-black mt-0.5">{wc.val}</p>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400">{wc.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Margin Breakdown */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-murugan-accent" />
                      Product Category Sales & Profit Contribution
                    </h3>
                    <div className="space-y-3 pt-2">
                      {CATEGORY_SALES.map(cat => (
                        <div key={cat.cat} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">{cat.cat}</p>
                            <p className="text-[10px] text-gray-400">Sales: ₹{cat.sales}L • GP: ₹{cat.gp}L</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-400">{cat.gp_pct}% Margin</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ageing Breakdown */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-murugan-accent" />
                      Accounts Receivable (AR) Ageing Breakdown
                    </h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={AGEING} layout="vertical">
                          <XAxis type="number" stroke="#9ca3af" fontSize={11} tickFormatter={v => `₹${v}L`} />
                          <YAxis type="category" dataKey="bucket" stroke="#9ca3af" fontSize={11} width={85} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                            {AGEING.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Trends */}
            {cfoSubTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-murugan-accent" />
                    Monthly Revenue, COGS & Gross Margin Trajectory (H1 2026)
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={MONTHLY}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                        <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} tickFormatter={v => `₹${v}L`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickFormatter={v => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="sales" name="Sales Revenue" fill="#eab308" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="cogs" name="COGS" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="gp_pct" name="GP % Margin" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-murugan-accent" />
                    Cash Inflow vs Outflow Dynamics (₹ Lakhs)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={MONTHLY}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => `₹${v}L`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="cash_in" name="Cash In (Collections)" stroke="#10b981" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="cash_out" name="Cash Out (Disbursements)" stroke="#f97316" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="net_cf" name="Net Cash Flow" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Actual vs Target */}
            {cfoSubTab === 'avt' && (
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-murugan-accent" />
                    Financial Benchmarks: Actual vs Target (June 2026)
                  </h3>
                  <p className="text-xs text-gray-400">Tolerance threshold: Minimum 85% achievement required</p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[600px]">
                    <thead className="bg-black/40">
                      <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase">
                        <th className="py-3 px-4">Financial KPI</th>
                        <th className="py-3 px-4">Actual</th>
                        <th className="py-3 px-4">Target Budget</th>
                        <th className="py-3 px-4">Achievement %</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-black/20">
                      {AVT_ROWS.map((row) => {
                        const ach = row.lowerIsBetter
                          ? row.actual <= row.target ? 100 : Math.round((row.target / row.actual) * 100)
                          : Math.round((row.actual / row.target) * 100);
                        const isAlert = !row.lowerIsBetter && ach < THRESHOLDS.TARGET_ACH_MIN;

                        return (
                          <tr key={row.kpi} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">{row.kpi}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-white">{row.actual} {row.unit}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-400">{row.target} {row.unit}</td>
                            <td className="py-3.5 px-4">
                              <span className={cn(
                                "text-[11px] font-extrabold px-2 py-0.5 rounded-full border",
                                ach >= 90 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                ach >= 80 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              )}>
                                {ach}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isAlert ? (
                                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Underperforming
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> On Track
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {activeTab === 'invoicing' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <InvoicingModule currentUser={user} />
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <FieldVisitRegistry currentUser={user} />
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <CanvasserLeaderboard currentUser={user} />
          </motion.div>
        )}

      </main>

      {/* Alerts Drawer Modal */}
      <AnimatePresence>
        {showAlertsDrawer && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAlertsDrawer(false)}
          >
            <div 
              className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-base text-white">Financial Threshold Alerts</h3>
                </div>
                <button 
                  onClick={() => setShowAlertsDrawer(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {alerts.map((a, i) => (
                  <div key={i} className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-200 font-medium">{a.msg}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAlertsDrawer(false)}
                className="w-full py-2.5 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl transition"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
