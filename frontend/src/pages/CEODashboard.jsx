import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  LogOut, Crown, TrendingUp, TrendingDown, AlertTriangle,
  IndianRupee, Users, Building2, Target, Wallet, BarChart3,
  Receipt, History, Trophy, Sparkles, ShieldCheck, CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import { cn } from '../lib/utils';

// ─── Mock Executive Data ───────────────────────────────────────────────────────

const SALES_TREND = [
  { month: 'Jan', sales: 18, gp: 7.2, gp_pct: 40 },
  { month: 'Feb', sales: 20, gp: 7.6, gp_pct: 38 },
  { month: 'Mar', sales: 22, gp: 8.1, gp_pct: 37 },
  { month: 'Apr', sales: 19, gp: 7.0, gp_pct: 37 },
  { month: 'May', sales: 27, gp: 9.2, gp_pct: 34 },
  { month: 'Jun', sales: 32, gp: 11.0, gp_pct: 34 },
];

const HERO_KPIS = [
  {
    label: 'Total Revenue',
    value: '₹32.0L',
    trend: '+18.5%',
    trendUp: true,
    sub: 'vs Last Month',
    icon: IndianRupee,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    label: 'Gross Profit',
    value: '₹11.0L',
    trend: '+19.6%',
    trendUp: true,
    sub: 'vs Last Month',
    icon: TrendingUp,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    label: 'Gross Margin %',
    value: '34.4%',
    trend: 'Healthy',
    trendUp: true,
    sub: 'Threshold: 30%',
    icon: BarChart3,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    label: 'Collections Realized',
    value: '₹23.0L',
    trend: '+15.0%',
    trendUp: true,
    sub: '72% of Invoiced',
    icon: Wallet,
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  {
    label: 'Overdue Outstanding',
    value: '₹4.0L',
    trend: 'Action Required',
    trendUp: false,
    sub: '4 Accounts',
    icon: AlertTriangle,
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    alert: true
  },
];

const OPS_KPIS = [
  { label: 'Total Field Visits', value: '47', sub: 'This Month', icon: Building2, color: 'text-amber-400' },
  { label: 'New Institutions', value: '12', sub: 'Newly Discovered', icon: Target, color: 'text-emerald-400' },
  { label: 'Active Field Agents', value: '3', sub: 'Canvassers Active', icon: Users, color: 'text-blue-400' },
  { label: 'Won Supply Contracts', value: '8', sub: 'Orders Converted', icon: CheckCircle2, color: 'text-purple-400' },
];

const TARGET_STATUS = [
  { kpi: 'Sales Revenue', actual: 32, target: 35, unit: 'L', ach: 91 },
  { kpi: 'Gross Profit',  actual: 11, target: 12, unit: 'L', ach: 92 },
  { kpi: 'Margin %',      actual: 34, target: 34, unit: '%', ach: 100 },
  { kpi: 'Collections',   actual: 23, target: 25, unit: 'L', ach: 92 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

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

export default function CEODashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('ceo_overview'); // 'ceo_overview', 'invoicing', 'logs', 'team'

  const navTabs = [
    { id: 'ceo_overview', label: 'CEO Executive Overview', icon: Crown },
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
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> CEO — Global Executive
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user?.name} ({user?.roleTitle || 'Chief Executive Officer'})</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Full Executive & Strategic Oversight</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
        
        {activeTab === 'ceo_overview' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Top Hero KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {HERO_KPIS.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-400">{kpi.label}</span>
                      <div className={cn("p-2 rounded-xl border", kpi.badgeColor)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{kpi.value}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn(
                          "text-[10px] font-extrabold px-1.5 py-0.5 rounded-md",
                          kpi.trendUp ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        )}>
                          {kpi.trend}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate">{kpi.sub}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts & Target Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales & GP Trend Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-murugan-accent" />
                      Revenue & Gross Profit Performance (H1 2026)
                    </h3>
                    <p className="text-xs text-gray-400">Monthly revenue compared to gross profit realization (in ₹ Lakhs)</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                    +18.5% Growth
                  </span>
                </div>

                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SALES_TREND} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        formatter={(val) => <span className="text-gray-300 font-semibold">{val}</span>}
                      />
                      <Bar dataKey="sales" name="Sales Revenue" fill="#eab308" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="gp" name="Gross Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Target vs Actual Progress */}
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-murugan-accent" />
                    Target vs Actuals (Jun 2026)
                  </h3>
                  <p className="text-xs text-gray-400">Strategic milestone fulfillment</p>
                </div>

                <div className="space-y-4">
                  {TARGET_STATUS.map((item) => (
                    <div key={item.kpi} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-300">{item.kpi}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white">
                            {item.actual}{item.unit} / {item.target}{item.unit}
                          </span>
                          <span className={cn(
                            "text-[10px] font-extrabold px-1.5 py-0.5 rounded",
                            item.ach >= 90 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          )}>
                            {item.ach}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, item.ach)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-[11px] text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>Overall quarterly run-rate is at <strong>93.7%</strong> of strategic targets.</span>
                </div>
              </div>
            </div>

            {/* Operations Overview Sub-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {OPS_KPIS.map((op) => {
                const Icon = op.icon;
                return (
                  <div key={op.label} className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-4 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className={cn("w-5 h-5", op.color)} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{op.value}</p>
                      <p className="text-[11px] font-bold text-gray-400">{op.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

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
    </div>
  );
}
