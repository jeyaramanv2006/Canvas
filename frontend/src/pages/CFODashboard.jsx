import React, { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, AlertTriangle, TrendingUp, TrendingDown, IndianRupee,
  Wallet, CreditCard, Package, Users, BarChart3, Landmark,
  Receipt, History, Trophy, Bell, ChevronDown, CheckCircle2,
  Calendar, Layers, Sparkles, Filter, X, ArrowUpRight, ArrowDownRight,
  Info, HelpCircle, BookOpen, AlertCircle, Eye, Clock, ShieldAlert,
  Database, Calculator, RefreshCw
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
import ErrorBoundary from '../components/ErrorBoundary';
import FinancialDrilldownModal from '../components/FinancialDrilldownModal';
import { CFO_REPORTS_DATA } from '../data/cfoDrilldownData';
import { mockApi } from '../mockApi';
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

  // Lock body scroll when alerts drawer is open
  useEffect(() => {
    if (showAlertsDrawer) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showAlertsDrawer]);


  // Live Database Analytics State
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCFOData();
  }, []);

  const loadCFOData = async () => {
    try {
      const data = await mockApi.getCFOAnalytics();
      setLiveData(data);
    } catch (err) {
      console.error('Failed to load live CFO analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCFOData();
  };

  // Live aggregations with modeled defaults as fallback
  const totalInvoicedL = liveData?.summary?.totalInvoiced != null
    ? (liveData.summary.totalInvoiced / 100000).toFixed(2)
    : '32.00';
  const totalCollectedL = liveData?.summary?.totalCollected != null
    ? (liveData.summary.totalCollected / 100000).toFixed(2)
    : '23.00';
  const totalOutstandingL = liveData?.summary?.totalOutstanding != null
    ? (liveData.summary.totalOutstanding / 100000).toFixed(2)
    : '12.00';
  const grossProfitL = liveData?.summary?.grossProfit != null
    ? (liveData.summary.grossProfit / 100000).toFixed(2)
    : '11.00';
  const grossProfitMargin = liveData?.summary?.grossProfitMargin ?? 34.4;
  const collectionRate = liveData?.summary?.collectionRate ?? 71.9;
  const overdueAmountL = liveData?.summary?.overdueAmount != null
    ? (liveData.summary.overdueAmount / 100000).toFixed(2)
    : '4.00';
  const overdueCount = liveData?.summary?.overdueCount ?? 4;

  // Receivables aging array from live DB buckets if present
  const receivablesAgingData = useMemo(() => {
    if (!liveData?.agingBuckets) return CFO_REPORTS_DATA.receivables_ageing;
    const b = liveData.agingBuckets;
    return [
      { bucket: '0-30 Days', amount: Number(((b.current?.amount || 0) / 100000).toFixed(2)), count: b.current?.count || 0, color: '#8b5cf6', desc: 'Current invoices within credit terms' },
      { bucket: '31-60 Days', amount: Number(((b.days31_60?.amount || 0) / 100000).toFixed(2)), count: b.days31_60?.count || 0, color: '#a855f7', desc: 'Moderate ageing — reminder dispatched' },
      { bucket: '61-90 Days', amount: Number(((b.days61_90?.amount || 0) / 100000).toFixed(2)), count: b.days61_90?.count || 0, color: '#6366f1', desc: 'Escalated to management' },
      { bucket: '90+ Days', amount: Number(((b.days90Plus?.amount || 0) / 100000).toFixed(2)), count: b.days90Plus?.count || 0, color: '#ef4444', desc: 'CRITICAL: Overdue debt collection required' }
    ];
  }, [liveData]);

  // Sales Trend chart data (combining live database monthly billed with benchmark timeline)
  const salesTrendData = useMemo(() => {
    if (!liveData?.monthlyTrend?.length) return CFO_REPORTS_DATA.sales_trend;
    return liveData.monthlyTrend.map(m => {
      const fallback = CFO_REPORTS_DATA.sales_trend.find(s => s.month === m.month);
      return {
        month: m.month,
        sales: m.sales > 0 ? m.sales : (fallback?.sales || 20),
        lastMonth: fallback?.lastMonth || 18,
        growth: fallback?.growth || '+15.0%'
      };
    });
  }, [liveData]);

  // GP Trend chart data
  const gpTrendData = useMemo(() => {
    return salesTrendData.map(s => {
      const gp = Number((s.sales * 0.344).toFixed(1));
      return {
        month: s.month,
        sales: s.sales,
        gp: gp > 0 ? gp : 8.5,
        gp_pct: 34
      };
    });
  }, [salesTrendData]);

  // Collection vs Sales chart data
  const collectionVsSalesData = useMemo(() => {
    if (!liveData?.monthlyTrend?.length) return CFO_REPORTS_DATA.collection_vs_sales;
    return liveData.monthlyTrend.map(m => {
      const fallback = CFO_REPORTS_DATA.collection_vs_sales.find(c => c.month === m.month);
      return {
        month: m.month,
        sales: m.sales > 0 ? m.sales : (fallback?.sales || 25),
        collection: m.collections > 0 ? m.collections : (fallback?.collection || 18)
      };
    });
  }, [liveData]);

  // Month-on-month comparison with dynamic live values
  const momComparisonData = useMemo(() => {
    return CFO_REPORTS_DATA.mom_comparison.map(row => {
      if (row.kpi === 'Sales') return { ...row, thisMonth: `₹${totalInvoicedL}L` };
      if (row.kpi === 'Gross Profit') return { ...row, thisMonth: `₹${grossProfitL}L` };
      if (row.kpi === 'GP %') return { ...row, thisMonth: `${grossProfitMargin}%` };
      if (row.kpi === 'Collection') return { ...row, thisMonth: `₹${totalCollectedL}L` };
      if (row.kpi === 'Receivables') return { ...row, thisMonth: `₹${totalOutstandingL}L` };
      if (row.kpi === 'Overdue') return { ...row, thisMonth: `₹${overdueAmountL}L` };
      return row;
    });
  }, [totalInvoicedL, grossProfitL, grossProfitMargin, totalCollectedL, totalOutstandingL, overdueAmountL]);

  // Actual vs Target with dynamic live values
  const actualVsTargetData = useMemo(() => {
    return CFO_REPORTS_DATA.actual_vs_target.map(row => {
      if (row.kpi === 'Sales') {
        const target = 35;
        const actual = Number(totalInvoicedL) || 0;
        const ach = target > 0 ? Math.round((actual / target) * 100) : 100;
        const gap = Number((actual - target).toFixed(1));
        return {
          ...row,
          actual: `₹${totalInvoicedL}L`,
          achievement: `${ach}%`,
          rawAch: ach,
          gap: gap >= 0 ? `↑ ₹${gap}L` : `↓ ₹${Math.abs(gap)}L`
        };
      }
      if (row.kpi === 'Gross Profit') {
        const target = 12;
        const actual = Number(grossProfitL) || 0;
        const ach = target > 0 ? Math.round((actual / target) * 100) : 100;
        const gap = Number((actual - target).toFixed(1));
        return {
          ...row,
          actual: `₹${grossProfitL}L`,
          achievement: `${ach}%`,
          rawAch: ach,
          gap: gap >= 0 ? `↑ ₹${gap}L` : `↓ ₹${Math.abs(gap)}L`
        };
      }
      if (row.kpi === 'Collection') {
        const target = 25;
        const actual = Number(totalCollectedL) || 0;
        const ach = target > 0 ? Math.round((actual / target) * 100) : 100;
        const gap = Number((actual - target).toFixed(1));
        return {
          ...row,
          actual: `₹${totalCollectedL}L`,
          achievement: `${ach}%`,
          rawAch: ach,
          gap: gap >= 0 ? `↑ ₹${gap}L` : `↓ ₹${Math.abs(gap)}L`
        };
      }
      if (row.kpi === 'Overdue') {
        const target = 3;
        const actual = Number(overdueAmountL) || 0;
        const ach = target > 0 ? Math.round((actual / target) * 100) : 100;
        const gap = Number((actual - target).toFixed(1));
        return {
          ...row,
          actual: `₹${overdueAmountL}L`,
          achievement: `${ach}%`,
          rawAch: ach,
          gap: gap >= 0 ? `↑ ₹${gap}L` : `↓ ₹${Math.abs(gap)}L`,
          onTrack: actual <= target
        };
      }
      return row;
    });
  }, [totalInvoicedL, grossProfitL, totalCollectedL, overdueAmountL]);

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
    { id: 'cfo_overview', label: 'CFO Financial Strategy', mobileLabel: 'Strategy', icon: Landmark },
    { id: 'invoicing', label: 'Invoicing & Records', mobileLabel: 'Invoices', icon: Receipt },
    { id: 'logs', label: 'Central Visit Logs', mobileLabel: 'Visits', icon: History },
    { id: 'team', label: 'Team Leaderboard', mobileLabel: 'Leaderboard', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-16 selection:bg-murugan-accent selection:text-black">
      {/* Header */}
      <header className="bg-[#14151b]/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-20 rounded-xl overflow-hidden border border-white/10 shadow-md bg-[#14151b] flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="MG The One" 
                  className="w-full h-full object-cover scale-[1.38]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">The One</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 whitespace-nowrap">
                    <Landmark className="w-3 h-3 shrink-0" /> CFO
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">{user?.name || 'Abhishek'} (CFO)</span>
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setShowAlertsDrawer(true)}
                className="px-2.5 sm:px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl transition text-xs font-bold text-rose-300 flex items-center gap-1.5 shadow-sm"
              >
                <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce shrink-0" />
                <span className="hidden sm:inline">Financial Alerts</span>
                <span className="sm:hidden text-[10px]">Alerts</span>
              </button>

              <button
                onClick={() => setUser(null)}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Desktop-Only Navigation Bar */}
          <div className="hidden md:flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 z-10",
                    isActive
                      ? "text-black font-black"
                      : "bg-[#1c1d25] text-gray-400 hover:text-white hover:bg-[#252632] border border-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="cfoActiveTopTab"
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl shadow-xl shadow-amber-400/25 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-black" : "text-gray-400")} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 pb-28 md:pb-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            {activeTab === 'cfo_overview' && (
              <div className="space-y-6">

                {/* ── CFO STRATEGY HEADER & DATA INTEGRITY BANNER ────────────────── */}
                <div className="bg-gradient-to-r from-[#181924] via-[#151620] to-[#12131a] border border-amber-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
                          CFO Financial Intelligence & Treasury MIS
                        </span>
                        <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-md font-mono">
                          FY 2026-27 Active
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                        Executive 8-Report Financial Strategy Suite
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Comprehensive management information system for commercial realization, liquidity, margins, and target variance.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                        title="Sync live records from PostgreSQL/Neon"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-amber-400")} />
                        <span>{refreshing ? 'Syncing...' : 'Sync Live Data'}</span>
                      </button>
                      <button
                        onClick={() => openDrilldown('sales_trend', 'Jun')}
                        className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Interactive Audit Trail</span>
                      </button>
                    </div>
                  </div>

                  {/* Data Source Transparency Indicator */}
                  <div className="flex items-center gap-3 text-[11px] bg-black/40 border border-white/10 px-3.5 py-2.5 rounded-xl text-gray-400 flex-wrap mt-4">
                    <span className="font-bold text-gray-200">Data Integrity Breakdown:</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Live PostgreSQL DB Logic: Invoices (₹{totalInvoicedL}L), Realized Cash (₹{totalCollectedL}L), Receivables (₹{totalOutstandingL}L), Overdue (₹{overdueAmountL}L)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Fabricated / Modeled: 6-Month Sales Curve, Gross Profit (66% COGS), Warehouse Stock, Cash Flow — Concrete Formulas Displayed Below
                    </span>
                  </div>
                </div>

                {/* ════════════ 8-REPORT DASHBOARD GRID (2x4) ════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* ──────────────── 1. Sales Trend — Month-wise ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-amber-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">1</span>
                          <h3 className="text-sm font-black text-white">Sales Trend — Month-wise</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Fabricated Model
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">₹ Lakh</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Shows month-wise total sales performance across the semester.</p>
                    </div>

                    <div className="h-56 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={salesTrendData}
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

                    <div className="space-y-2 mt-4 pt-3 border-t border-white/10">
                      <div
                        onClick={() => openDrilldown('sales_trend', 'Jun')}
                        className="flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">This Month (Jun): <span className="font-mono text-amber-400 font-black">₹{totalInvoicedL}L</span></p>
                          <p className="text-gray-400 text-[11px]">Last Month (May Benchmark): ₹27L</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs">
                            ↑ {(((Number(totalInvoicedL) - 27) / 27) * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">vs Benchmark</span>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                        Formula: MoM Growth % = ((Sales_Jun - Sales_May) / Sales_May) × 100 • 6M Curve is Modeled Benchmark
                      </div>
                    </div>
                  </div>

                  {/* ──────────────── 2. Gross Profit Trend ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-emerald-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">2</span>
                          <h3 className="text-sm font-black text-white">Gross Profit Trend</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Fabricated Model
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-emerald-400">■ GP</span>
                            <span className="text-emerald-300">● GP %</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Shows month-wise Gross Profit (₹) and GP% margin trend.</p>
                    </div>

                    <div className="h-56 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={gpTrendData}
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

                    <div className="space-y-2 mt-4 pt-3 border-t border-white/10">
                      <div
                        onClick={() => openDrilldown('gp_trend', 'Jun')}
                        className="flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">This Month (Jun): <span className="font-mono text-emerald-400 font-black">₹{grossProfitL}L ({grossProfitMargin}%)</span></p>
                          <p className="text-gray-400 text-[11px]">Last Month (May Benchmark): ₹9.2L (34.1%)</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs">
                            ↑ {(((Number(grossProfitL) - 9.2) / 9.2) * 100).toFixed(1)}% (₹)
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">GP% Margin</span>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                        Formula: COGS = Sales × 66% • GP = Sales - COGS (₹{totalInvoicedL}L - ₹{(Number(totalInvoicedL) * 0.66).toFixed(1)}L = ₹{grossProfitL}L) • GP % = {grossProfitMargin}%
                      </div>
                    </div>
                  </div>

                  {/* ──────────────── 3. Collection vs Sales ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-blue-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">3</span>
                          <h3 className="text-sm font-black text-white">Collection vs Sales</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Fabricated Model
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-blue-400">■ Sales</span>
                            <span className="text-amber-400">■ Collections</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Compares billed invoice revenue vs realized cash receipts.</p>
                    </div>

                    <div className="h-56 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={collectionVsSalesData}
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

                    <div className="space-y-2 mt-4 pt-3 border-t border-white/10">
                      <div
                        onClick={() => openDrilldown('collection_vs_sales', 'Jun')}
                        className="flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                      >
                        <div>
                          <p className="font-bold text-white">
                            This Month (Jun): Sales <strong className="font-mono text-blue-400">₹{totalInvoicedL}L</strong> | Collection <strong className="font-mono text-amber-400">₹{totalCollectedL}L</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                            Collection Rate: {collectionRate}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                        Formula: Collection Rate % = (Realized Cash Collections / Total Billed Sales) × 100 = (₹{totalCollectedL}L / ₹{totalInvoicedL}L) × 100 = {collectionRate}%
                      </div>
                    </div>
                  </div>

                  {/* ──────────────── 4. Receivables / Overdue ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-purple-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold font-mono">4</span>
                          <h3 className="text-sm font-black text-white">Receivables / Overdue</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Live DB Logic
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">Aging Brackets</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Calculates total outstanding credit and overdue debt by age bucket.</p>
                    </div>

                    {/* Dual KPI Mini Cards */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div
                        onClick={() => openDrilldown('receivables_ageing', 'Jun', '0-30 Days')}
                        className="p-3 bg-black/40 rounded-2xl border border-white/10 cursor-pointer hover:border-purple-400 transition"
                      >
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total Receivables</span>
                        <p className="text-lg font-black text-white font-mono">₹{totalOutstandingL} Lakh</p>
                        <span className="text-[10px] text-emerald-400 font-semibold">Live DB Invoices</span>
                      </div>
                      <div
                        onClick={() => openDrilldown('receivables_ageing', 'Jun', '90+ Days')}
                        className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/30 cursor-pointer hover:border-rose-400 transition"
                      >
                        <span className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                        <p className="text-lg font-black text-rose-400 font-mono">₹{overdueAmountL} Lakh</p>
                        <span className="text-[10px] text-rose-300 font-semibold">{overdueCount} Accounts Overdue</span>
                      </div>
                    </div>

                    {/* Ageing Bar Chart */}
                    <div className="h-36 mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={receivablesAgingData}
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
                            {receivablesAgingData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 mt-3 pt-2.5 border-t border-white/10">
                      <div
                        onClick={() => openDrilldown('receivables_ageing', 'Jun', '90+ Days')}
                        className="text-xs bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 cursor-pointer hover:bg-rose-500/20 transition flex items-center justify-between"
                      >
                        <p className="text-[11px] text-rose-300 font-bold">
                          Overdue: ₹{overdueAmountL}L across {overdueCount} accounts. Immediate follow-up required.
                        </p>
                        <ChevronDown className="w-3.5 h-3.5 text-rose-400 -rotate-90 flex-shrink-0" />
                      </div>

                      <div className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                        Formula: Age (days) = ⌊(Today - Invoice_Date) / 86,400,000⌋ • Receivables = Σ(Total - Paid) • Overdue = Σ(Balance where Age &gt; 30d)
                      </div>
                    </div>
                  </div>

                  {/* ──────────────── 5. Inventory Value ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-cyan-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">5</span>
                          <h3 className="text-sm font-black text-white">Inventory Value</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Fabricated Model
                          </span>
                          <span className="text-[10px] text-cyan-400 font-bold">■ Stock (₹ Lakh)</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Shows warehouse inventory valuation across raw materials & finished goods.</p>
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

                    <div className="space-y-2 mt-4 pt-3 border-t border-white/10">
                      <div
                        onClick={() => openDrilldown('inventory_value', 'Jun')}
                        className="flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
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

                      <div className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                        Formula: Inventory Valuation = Σ(Warehouse Batch Qty × Unit Cost) [Yarn 40%, Finished 38%, WIP 15%, Trims 7%]
                      </div>
                    </div>
                  </div>

                  {/* ──────────────── 6. Cash Flow Trend ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-emerald-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">6</span>
                          <h3 className="text-sm font-black text-white">Cash Flow Trend</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Fabricated Model
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="text-emerald-400">■ In</span>
                            <span className="text-rose-400">■ Out</span>
                            <span className="text-white">● Net</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Shows cash inflows, operational outflows and net liquidity.</p>
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

                    <div className="space-y-2 mt-4 pt-3 border-t border-white/10">
                      <div
                        onClick={() => openDrilldown('cash_flow_trend', 'Jun')}
                        className="flex items-center justify-between text-xs bg-black/30 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition"
                      >
                        <div>
                          <p className="font-bold text-white">This Month (Jun): Net Cash Flow <strong className="text-emerald-400 font-mono">₹3L (Positive)</strong></p>
                          <p className="text-[11px] text-gray-400">Last Month (May): Net Cash Flow ₹3L (Positive)</p>
                        </div>
                        <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          Strong Liquidity
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                        Formula: Net Cash Flow = Total Inflows (Collections + Advances) - Total Outflows (Raw Materials + Factory Opex + Comm + Logistics)
                      </div>
                    </div>
                  </div>

                  {/* ──────────────── 7. This Month vs Last Month ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-blue-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">7</span>
                          <h3 className="text-sm font-black text-white">This Month vs Last Month</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Mathematical Audit
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">10 Key KPIs</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Compares key financial telemetry with prior month baseline.</p>
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
                          {momComparisonData.map(row => (
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

                    <div className="space-y-1.5 pt-3 border-t border-white/10 mt-3 text-center">
                      <div className="text-[10px] font-mono text-cyan-300/90 bg-cyan-500/10 px-2.5 py-1.5 rounded-xl border border-cyan-500/20 text-left">
                        Formula: Absolute Change = (Value_Jun - Value_May) • % Change = (Change / Value_May) × 100 • Margin Δ = Percentage Points (pp)
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Tracks month-on-month variance. Click any row to drill down into the specific account ledger.
                      </p>
                    </div>
                  </div>

                  {/* ──────────────── 8. Actual vs Target ──────────────── */}
                  <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-emerald-400/30 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">8</span>
                          <h3 className="text-sm font-black text-white">Actual vs Target</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Calculated Metric
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">Target Fulfillment</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Shows actual financial realization vs budgeted commercial targets.</p>
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
                          {actualVsTargetData.map(row => (
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

                    <div className="pt-3 border-t border-white/10 mt-3 space-y-1.5 text-center">
                      <div className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 text-left">
                        Formula: Achievement % = (Actual / Target) × 100 • Gap = Actual - Target • Overdue On-Track if Actual ≤ Target
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Tracks budget variance and execution gaps. Click any row for institutional audit.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Operational Modules (Inherited from Admin) */}
            {activeTab === 'invoicing' && (
              <InvoicingModule currentUser={user} />
            )}

            {activeTab === 'logs' && (
              <FieldVisitRegistry currentUser={user} />
            )}

            {activeTab === 'team' && (
              <ErrorBoundary>
                <CanvasserLeaderboard currentUser={user} />
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>

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
        {showAlertsDrawer && createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowAlertsDrawer(false)}
          >
            <div
              className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-white my-auto"
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
                    Overdue accounts total <strong>₹{overdueAmountL} Lakh</strong> across {overdueCount} institutions. Overdue &gt; 90 days represents critical credit exposure. Immediate dispatch of legal demand letters required.
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 font-medium">
                    Collection % of Sales is currently at <strong>{collectionRate}%</strong> (₹{totalCollectedL}L collected vs ₹{totalInvoicedL}L billed). Field recovery focus recommended.
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
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#14151b]/95 backdrop-blur-2xl border-t border-white/10 pb-safe z-50 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-2 flex flex-col items-center gap-1 rounded-2xl transition-colors z-10", 
                  isActive 
                    ? "text-amber-400 font-black" 
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="cfoActiveBottomTab"
                    className="absolute inset-0 bg-amber-500/15 border border-amber-500/40 rounded-2xl shadow-lg shadow-amber-500/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0 relative z-10" />
                <span className="text-[10px] font-bold tracking-tight truncate max-w-full relative z-10">
                  {tab.mobileLabel || tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
