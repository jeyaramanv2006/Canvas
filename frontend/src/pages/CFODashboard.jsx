import React, { useState, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, AlertTriangle, TrendingUp, TrendingDown, IndianRupee,
  Wallet, CreditCard, Package, Users, BarChart3, Landmark,
  Receipt, History, Trophy, Bell, ChevronDown, CheckCircle2,
  Calendar, Layers, Sparkles, Filter, X, ArrowUpRight, ArrowDownRight,
  Info, HelpCircle, BookOpen, AlertCircle, Eye
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
import FinancialDrilldownModal from '../components/FinancialDrilldownModal';
import { CFO_REPORTS_DATA } from '../data/cfoDrilldownData';
import { cn } from '../lib/utils';

// Thresholds for Red Alert Notification
const THRESHOLDS = {
  GP_PCT_MIN: 30,
  GP_DROP_MAX_PCT: 15,
  TARGET_ACH_MIN: 85,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl z-50">
      <p className="text-gray-400 mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold flex items-center justify-between gap-3">
          <span>{p.name}:</span>
          <span>{typeof p.value === 'number' ? (p.name.includes('%') ? `${p.value}%` : `₹${p.value}L`) : p.value}</span>
        </p>
      ))}
      <p className="text-[10px] text-amber-400/80 pt-1 border-t border-white/5 mt-1">
        💡 Click to drill down level-by-level
      </p>
    </div>
  );
};

export default function CFODashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('cfo_overview'); // 'cfo_overview', 'invoicing', 'logs', 'team'
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

  // Drilldown Modal State
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownMetric, setDrilldownMetric] = useState('sales_trend');
  const [drilldownMonth, setDrilldownMonth] = useState('Jun');
  const [drilldownBucket, setDrilldownBucket] = useState(null);
  const [drilldownKPI, setDrilldownKPI] = useState(null);

  const openDrilldown = (metric, month = 'Jun', bucket = null, kpi = null) => {
    setDrilldownMetric(metric);
    setDrilldownMonth(month);
    setDrilldownBucket(bucket);
    setDrilldownKPI(kpi);
    setDrilldownOpen(true);
  };

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
                  <span>{user?.name || 'Abhishek'} ({user?.roleTitle || 'Chief Financial Officer'})</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">P&L, Margins, Cash Flow & Financial Governance</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAlertsDrawer(true)}
                className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl transition text-xs font-bold text-rose-300 flex items-center gap-1.5 shadow-sm"
              >
                <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                <span>Financial Alerts (Overdue ₹4L)</span>
              </button>

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

            {/* ════════════ 8-REPORT DASHBOARD GRID (2x4) ════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ──────────────── 1. Sales Trend — Month-wise ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-amber-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">1</span>
                      Sales Trend — Month-wise
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold">₹ Lakh</span>
                  </div>
                  <p className="text-xs text-gray-400">Shows month-wise total sales performance.</p>
                </div>

                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={CFO_REPORTS_DATA.sales_trend}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          openDrilldown('sales_trend', e.activePayload[0].payload.month);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => `${v}L`} domain={[0, 40]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Sales (₹ Lakh)"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#60a5fa' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div
                  onClick={() => openDrilldown('sales_trend', 'Jun')}
                  className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">This Month (Jun): <span className="font-mono text-amber-400 font-black">₹32L</span></p>
                    <p className="text-gray-400 text-[11px]">Last Month (May): ₹27L</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs">
                      ↑ 18.5%
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">vs May</span>
                  </div>
                </div>
              </div>

              {/* ──────────────── 2. Gross Profit Trend ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-emerald-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">2</span>
                      Gross Profit Trend
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="text-emerald-400 flex items-center gap-1">■ GP (₹ Lakh)</span>
                      <span className="text-emerald-300 flex items-center gap-1">● GP %</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Shows month-wise Gross Profit (₹) and GP% trend.</p>
                </div>

                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={CFO_REPORTS_DATA.gp_trend}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          openDrilldown('gp_trend', e.activePayload[0].payload.month);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} tickFormatter={v => `${v}L`} domain={[0, 20]} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickFormatter={v => `${v}%`} domain={[0, 50]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="gp" name="Gross Profit (₹ Lakh)" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="gp_pct" name="GP %" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div
                  onClick={() => openDrilldown('gp_trend', 'Jun')}
                  className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">This Month (Jun): <span className="font-mono text-emerald-400 font-black">₹11.0L (34%)</span></p>
                    <p className="text-gray-400 text-[11px]">Last Month (May): ₹9.2L (34%)</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs">
                      ↑ 19.6% (₹)
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">GP% 0 pp</span>
                  </div>
                </div>
              </div>

              {/* ──────────────── 3. Collection vs Sales ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-blue-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">3</span>
                      Collection vs Sales
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="text-blue-400">■ Sales (₹ Lakh)</span>
                      <span className="text-amber-400">■ Collection (₹ Lakh)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Compares sales booked vs cash collected.</p>
                </div>

                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={CFO_REPORTS_DATA.collection_vs_sales}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          openDrilldown('collection_vs_sales', e.activePayload[0].payload.month);
                        }
                      }}
                      className="cursor-pointer"
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => `${v}L`} domain={[0, 40]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sales" name="Sales (₹ Lakh)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collection" name="Collection (₹ Lakh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div
                  onClick={() => openDrilldown('collection_vs_sales', 'Jun')}
                  className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                >
                  <div>
                    <p className="font-bold text-white">
                      This Month (Jun): Sales <strong className="font-mono text-blue-400">₹32L</strong> | Collection <strong className="font-mono text-amber-400">₹23L</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      Collection % of Sales: 72%
                    </span>
                  </div>
                </div>
              </div>

              {/* ──────────────── 4. Receivables / Overdue ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-purple-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold font-mono">4</span>
                      Receivables / Overdue
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold">Ageing Distribution</span>
                  </div>
                  <p className="text-xs text-gray-400">Shows total receivables and overdue amount.</p>
                </div>

                {/* Dual KPI Mini Cards */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div
                    onClick={() => openDrilldown('receivables_ageing', 'Jun', '0-30 Days')}
                    className="p-3 bg-black/40 rounded-2xl border border-white/10 cursor-pointer hover:border-purple-400 transition"
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total Receivables</span>
                    <p className="text-lg font-black text-white font-mono">₹12.0 Lakh</p>
                    <span className="text-[10px] text-gray-400">↑ ₹2.0L vs Last Month</span>
                  </div>
                  <div
                    onClick={() => openDrilldown('receivables_ageing', 'Jun', '90+ Days')}
                    className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/30 cursor-pointer hover:border-rose-400 transition"
                  >
                    <span className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Overdue
                    </span>
                    <p className="text-lg font-black text-rose-400 font-mono">₹4.0 Lakh</p>
                    <span className="text-[10px] text-rose-300">↑ ₹1.0L vs Last Month</span>
                  </div>
                </div>

                {/* Ageing Bar Chart */}
                <div className="h-36 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={CFO_REPORTS_DATA.receivables_ageing}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          openDrilldown('receivables_ageing', 'Jun', e.activePayload[0].payload.bucket);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="bucket" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={v => `${v}L`} domain={[0, 6]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="Receivables (₹ Lakh)" radius={[4, 4, 0, 0]}>
                        {CFO_REPORTS_DATA.receivables_ageing.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div
                  onClick={() => openDrilldown('receivables_ageing', 'Jun', '90+ Days')}
                  className="mt-3 pt-2.5 border-t border-white/10 text-xs bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition flex items-center justify-between"
                >
                  <p className="text-[11px] text-rose-300 font-bold">
                    Overdue &gt; 90 Days is 33% of Total Receivables. Action needed to improve collections.
                  </p>
                  <ChevronDown className="w-3.5 h-3.5 text-rose-400 -rotate-90 flex-shrink-0" />
                </div>
              </div>

              {/* ──────────────── 5. Inventory Value ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-cyan-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">5</span>
                      Inventory Value
                    </h3>
                    <span className="text-[10px] text-cyan-400 font-bold">■ Inventory Value (₹ Lakh)</span>
                  </div>
                  <p className="text-xs text-gray-400">Shows month-wise inventory value.</p>
                </div>

                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={CFO_REPORTS_DATA.inventory_value}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          openDrilldown('inventory_value', e.activePayload[0].payload.month);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => `${v}L`} domain={[0, 40]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="inventory" name="Inventory Value (₹ Lakh)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div
                  onClick={() => openDrilldown('inventory_value', 'Jun')}
                  className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">This Month (Jun): <span className="font-mono text-cyan-400 font-black">₹30L</span></p>
                    <p className="text-gray-400 text-[11px]">Last Month (May): ₹28L</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-extrabold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-xs">
                      ↑ ₹2.0L
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">vs May</span>
                  </div>
                </div>
              </div>

              {/* ──────────────── 6. Cash Flow Trend ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-emerald-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">6</span>
                      Cash Flow Trend
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-emerald-400">■ In</span>
                      <span className="text-rose-400">■ Out</span>
                      <span className="text-white">● Net</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Shows cash in, cash out and net cash flow.</p>
                </div>

                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={CFO_REPORTS_DATA.cash_flow_trend}
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          openDrilldown('cash_flow_trend', e.activePayload[0].payload.month);
                        }
                      }}
                      className="cursor-pointer"
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => `${v}L`} domain={[-10, 35]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cash_in" name="Cash In (₹ Lakh)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cash_out" name="Cash Out (₹ Lakh)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="net_cf" name="Net Cash Flow (₹ Lakh)" stroke="#ffffff" strokeWidth={2.5} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div
                  onClick={() => openDrilldown('cash_flow_trend', 'Jun')}
                  className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                >
                  <div>
                    <p className="font-bold text-white">This Month (Jun): Net Cash Flow <strong className="text-emerald-400 font-mono">₹3L (Positive)</strong></p>
                    <p className="text-[11px] text-gray-400">Last Month (May): Net Cash Flow ₹3L (Positive)</p>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Strong Liquidity
                  </span>
                </div>
              </div>

              {/* ──────────────── 7. This Month vs Last Month ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-blue-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">7</span>
                      This Month vs Last Month
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold">10 Key KPIs</span>
                  </div>
                  <p className="text-xs text-gray-400">Compares key numbers with last month.</p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#101116] text-gray-400 uppercase text-[10px] border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">KPI</th>
                        <th className="py-2.5 px-3 font-mono">This Month (Jun)</th>
                        <th className="py-2.5 px-3 font-mono">Last Month (May)</th>
                        <th className="py-2.5 px-3">Change</th>
                        <th className="py-2.5 px-3 text-right">% Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-black/20">
                      {CFO_REPORTS_DATA.mom_comparison.map(row => (
                        <tr
                          key={row.kpi}
                          onClick={() => openDrilldown('mom_comparison', 'Jun', null, row)}
                          className="hover:bg-white/5 transition-colors cursor-pointer group/row"
                        >
                          <td className="py-2 px-3 font-bold text-white group-hover/row:text-amber-300 transition-colors flex items-center gap-1.5">
                            {row.kpi}
                            {row.alert && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-white">{row.thisMonth}</td>
                          <td className="py-2 px-3 font-mono text-gray-400">{row.lastMonth}</td>
                          <td className="py-2 px-3 font-mono font-bold text-gray-200">{row.change}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={cn(
                              "text-[10px] font-extrabold px-1.5 py-0.5 rounded",
                              row.positive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                            )}>
                              {row.pctChange}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-gray-400 pt-3 border-t border-white/10 mt-3 text-center">
                  Helps to understand month-on-month performance. Click row to drill down into variance.
                </p>
              </div>

              {/* ──────────────── 8. Actual vs Target ──────────────── */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-emerald-400/30 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">8</span>
                      Actual vs Target
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold">Target Fulfillment</span>
                  </div>
                  <p className="text-xs text-gray-400">Shows actual performance vs target.</p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#101116] text-gray-400 uppercase text-[10px] border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">KPI</th>
                        <th className="py-2.5 px-3 font-mono">Target (Jun)</th>
                        <th className="py-2.5 px-3 font-mono">Actual (Jun)</th>
                        <th className="py-2.5 px-3">Achievement</th>
                        <th className="py-2.5 px-3 text-right">Gap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-black/20">
                      {CFO_REPORTS_DATA.actual_vs_target.map(row => (
                        <tr
                          key={row.kpi}
                          onClick={() => openDrilldown('actual_vs_target', 'Jun', null, row)}
                          className="hover:bg-white/5 transition-colors cursor-pointer group/row"
                        >
                          <td className="py-2.5 px-3 font-bold text-white group-hover/row:text-emerald-300 transition-colors">{row.kpi}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-400">{row.target}</td>
                          <td className="py-2.5 px-3 font-mono font-black text-white">{row.actual}</td>
                          <td className="py-2.5 px-3">
                            <span className={cn(
                              "text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
                              row.rawAch >= 90 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            )}>
                              {row.achievement}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-300">
                            {row.gap}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-white/10 mt-3 space-y-1 text-center">
                  <p className="text-[10px] text-gray-400 font-mono">
                    Achievement % = (Actual / Target) × 100
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Helps to track target achievement and identify gap. Click row for segment audit.
                  </p>
                </div>
              </div>

            </div>



          </motion.div>
        )}

        {/* Operational Modules (Inherited from Admin) */}
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

      {/* Interactive Hierarchical Drill-down Modal */}
      <FinancialDrilldownModal
        isOpen={drilldownOpen}
        onClose={() => setDrilldownOpen(false)}
        initialMetric={drilldownMetric}
        initialMonth={drilldownMonth}
        initialBucket={drilldownBucket}
        initialKPI={drilldownKPI}
      />

      {/* Red Alert Drawer Modal */}
      <AnimatePresence>
        {showAlertsDrawer && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAlertsDrawer(false)}
          >
            <div
              className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-base text-white">Executive Red Alert Summary</h3>
                </div>
                <button
                  onClick={() => setShowAlertsDrawer(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-200 font-medium">
                    Overdue accounts total <strong>₹4.0 Lakh</strong> across 4 institutions. Overdue &gt; 90 days represents 33% of total receivables. Immediate dispatch of legal demand letters required.
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 font-medium">
                    Collection % of Sales is currently at <strong>72%</strong> (₹23L collected vs ₹32L billed). Field recovery focus recommended.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAlertsDrawer(false);
                    openDrilldown('receivables_ageing', 'Jun', '90+ Days');
                  }}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl transition"
                >
                  Drill Down into Overdue Invoices
                </button>
                <button
                  onClick={() => setShowAlertsDrawer(false)}
                  className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
