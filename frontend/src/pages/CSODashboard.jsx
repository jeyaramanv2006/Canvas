import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Compass, TrendingUp, Target, BarChart3, Users,
  MapPin, Sparkles, Receipt, History, Trophy, Lock, Eye, EyeOff,
  Wrench, ShieldAlert, ArrowUpRight, CheckCircle2, Clock, Building2
} from 'lucide-react';
import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { cn } from '../lib/utils';

const PLANNED_PANELS = [
  { icon: Target, label: 'Strategic Market Penetration', desc: 'District-level institution coverage, competitor replacement, and high-yield zones', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { icon: TrendingUp, label: 'Institutional Conversion Funnel', desc: 'Initial contact → Principal pitch → Sample kit → High-volume order pipeline', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { icon: MapPin, label: 'Territory Expansion KPIs', desc: 'Unmapped taluks, tier-2 city expansion velocity, and regional market share', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { icon: Users, label: 'Field Deployment Yield', desc: 'High-performing territory managers, sales productivity ratios, and coverage density', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { icon: BarChart3, label: 'Strategic Pipeline Value', desc: 'Institutional annual recurring contracts, bulk uniform orders, and contract renewals', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { icon: Sparkles, label: 'Revenue Velocity & Attribution', desc: 'Territory ROI, canvasser-attributed revenue, and institutional deal velocity', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

export default function CSODashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('cso_overview'); // 'cso_overview', 'invoicing', 'logs', 'team'

  // Under Construction Overlay State
  // Set to true by default to hide the workspace from viewers while developing underneath.
  // Can be toggled to preview the strategic development workspace.
  const [isOverlayLocked, setIsOverlayLocked] = useState(true);

  const navTabs = [
    { id: 'cso_overview', label: 'CSO Strategy Overview', mobileLabel: 'Strategy', icon: Compass },
    { id: 'invoicing', label: 'Invoicing & Records', mobileLabel: 'Invoices', icon: Receipt },
    { id: 'logs', label: 'Central Visit Logs', mobileLabel: 'Visits', icon: History },
    { id: 'team', label: 'Team Leaderboard', mobileLabel: 'Leaderboard', icon: Trophy }
  ];

  return (
    <div className="min-h-screen vivid-void-canvas text-white pb-16 selection:bg-amber-300 selection:text-black">
      {/* ── Top Header with Obsidian Glass & Apple Fluid Spring Navigation ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08090f]/90 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.7)] transition-all duration-300 relative overflow-hidden">
        {/* Subtle luminous golden top hairline */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-20 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16 sm:h-[72px] gap-4">
            {/* Branding Identity */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink-0">
              <div className="group relative h-10 w-20 sm:h-11 sm:w-24 rounded-xl overflow-hidden border border-amber-400/30 bg-[#0d0e14] flex items-center justify-center flex-shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                <img 
                  src="/logo.jpg" 
                  alt="MG The One" 
                  className="w-full h-full object-cover scale-[1.38] transition-transform duration-500 group-hover:scale-[1.44]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black tracking-tight uppercase leading-none bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                    The One
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/40 whitespace-nowrap tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
                    <Compass className="w-3 h-3 shrink-0" /> CSO
                  </span>
                </div>
                <p className="text-[11px] text-white/50 font-medium flex items-center gap-1.5 mt-1 truncate">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  </span>
                  <span className="truncate text-white/80 font-semibold">{user?.name || 'Chief Strategy Officer'}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40 font-mono text-[10px] hidden sm:inline">Strategy &amp; Expansion</span>
                </p>
              </div>
            </div>

            {/* Desktop Center Fluid Apple Tabs (Single-Row on XL+) */}
            <div className="hidden xl:flex items-center justify-center flex-1 max-w-2xl mx-4">
              <div className="inline-flex p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-inner">
                {navTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 z-10",
                        isActive
                          ? "text-black font-black"
                          : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="csoActiveTopTab"
                          className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl shadow-[0_2px_14px_rgba(251,191,36,0.35)] -z-10"
                          transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                        />
                      )}
                      <Icon className={cn("w-3.5 h-3.5 relative z-10 transition-transform duration-200", isActive ? "text-black scale-105" : "text-white/50")} />
                      <span className="relative z-10 tracking-tight">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setUser(null)}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white/[0.04] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 rounded-xl transition-all duration-200 text-xs font-semibold text-white/70 hover:text-rose-200 flex items-center gap-1.5 shadow-sm group"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0 text-white/60 group-hover:text-rose-400 transition-colors" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Medium Desktop (md:xl) Fluid Apple-style Navigation Segmented Control Tray */}
          <div className="hidden md:flex xl:hidden space-x-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none justify-center border-t border-white/[0.04]">
            <div className="inline-flex p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-inner">
              {navTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 z-10",
                      isActive
                        ? "text-black font-black"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="csoActiveTopTabSecondary"
                        className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl shadow-[0_2px_14px_rgba(251,191,36,0.35)] -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                      />
                    )}
                    <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-200", isActive ? "text-black scale-105" : "text-white/50")} />
                    <span className="relative z-10 tracking-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>
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
            {activeTab === 'cso_overview' && (
              <div className="relative">

                {/* UNDER CONSTRUCTION OVERLAY CONTAINER */}
                <div className={cn(
                  "relative rounded-3xl overflow-hidden border border-white/10 bg-[#0d0e13]",
                  isOverlayLocked ? "max-h-[560px]" : "max-h-none"
                )}>

                  {/* UNDERLYING WORKSPACE (Developer works under this layer) */}
                  <div
                    className={cn(
                      "space-y-6 p-6 sm:p-8 transition-all duration-300",
                      isOverlayLocked ? "filter blur-lg opacity-25 select-none pointer-events-none max-h-[560px] overflow-hidden" : "filter-none opacity-100"
                    )}
                  >
                    {/* Commercial Header Banner */}
                    <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-8 rounded-3xl border border-white/10 shadow-2xl text-center space-y-4">
                      <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full px-4 py-1.5 text-xs font-bold">
                        <Compass className="w-3.5 h-3.5 text-teal-400" />
                        Chief Strategy Officer Intelligence Center
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Strategic Planning, Market Penetration &amp; Institutional Expansion
                      </h2>

                      <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                        Live strategic tracking of statewide institutional footprint, high-volume school conversions, territory penetration, and field force deployment across Tamil Nadu.
                      </p>
                    </div>

                    {/* Underlying KPI Preview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Institutional Pipeline', val: '₹54.2L', change: '+22.4%', isPos: true },
                        { label: 'High-Yield Win Rate', val: '46.5%', change: '+6.8%', isPos: true },
                        { label: 'Active Territory Coverage', val: '18 Districts', change: '+4 new', isPos: true },
                        { label: 'Strategic Account Size', val: '₹88,200', change: '+15.3%', isPos: true },
                      ].map((k, idx) => (
                        <div key={idx} className="bg-[#14151c] border border-white/10 rounded-2xl p-4 space-y-2">
                          <p className="text-xs text-gray-400 font-semibold">{k.label}</p>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl font-black text-white">{k.val}</span>
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" /> {k.change}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Planned Analytics Modules */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {PLANNED_PANELS.map((panel, idx) => {
                        const Icon = panel.icon;
                        return (
                          <div key={idx} className="bg-[#14151c]/70 border border-white/10 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2.5 rounded-xl border", panel.color)}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-sm text-white">{panel.label}</h3>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">{panel.desc}</p>
                            <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 font-mono">
                              <span>Phase: Architecture Ready</span>
                              <span className="text-amber-400/80 font-bold">Planned</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── THE OBSIDIAN UNDER-CONSTRUCTION GLASS OVERLAY ── */}
                  {isOverlayLocked && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#08090f]/80 backdrop-blur-md">
                      <div className="max-w-md w-full bg-[#12131b]/95 border border-amber-400/30 rounded-3xl p-7 shadow-[0_0_50px_rgba(251,191,36,0.12)] text-center space-y-5">
                        
                        {/* Animated Construction Emblem */}
                        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shadow-inner">
                          <Compass className="w-8 h-8 text-amber-400 animate-pulse" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#12131b] border border-amber-400/40 flex items-center justify-center">
                            <Wrench className="w-3 h-3 text-amber-300" />
                          </div>
                        </div>

                        {/* Heading & Context */}
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            <Clock className="w-3 h-3" /> Under Active Engineering
                          </span>
                          <h3 className="text-xl font-black text-white tracking-tight">
                            CSO Strategy Command Center
                          </h3>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            This strategic intelligence interface is currently in development.
                            Statewide territory heatmaps, pipeline telemetry, and conversion analytics will unlock in upcoming deployment phases.
                          </p>
                        </div>

                        {/* Interactive Developer / Preview Toggle */}
                        <div className="pt-2">
                          <button
                            onClick={() => setIsOverlayLocked(false)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-all hover:scale-[1.02] shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview Strategic Blueprint
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Bar Floating Button when unlocked so developers can lock it back */}
                  {!isOverlayLocked && (
                    <div className="absolute top-4 right-4 z-40">
                      <button
                        onClick={() => setIsOverlayLocked(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-[#12131b]/90 border border-amber-400/40 hover:bg-amber-400/20 shadow-lg backdrop-blur-md transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Lock Workspace
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}

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

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#0c0d15]/90 backdrop-blur-2xl border-t border-white/[0.08] pb-safe z-50 px-2 py-2 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto p-1 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-2 flex flex-col items-center gap-1 rounded-xl transition-colors text-center z-10", 
                  isActive 
                    ? "text-amber-300 font-black" 
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="csoActiveBottomTab"
                    className="absolute inset-0 bg-amber-400/15 border border-amber-400/35 rounded-xl shadow-[0_0_12px_rgba(251,191,36,0.15)] -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 shrink-0 relative z-10 transition-transform duration-200", isActive && "scale-110")} />
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
