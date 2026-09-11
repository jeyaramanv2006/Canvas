import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, TrendingUp, Construction, BarChart3, Users, Target,
  MapPin, Sparkles, Receipt, History, Trophy, Lock, Eye, EyeOff,
  Wrench, ShieldAlert, ArrowUpRight, CheckCircle2, Clock
} from 'lucide-react';
import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import { cn } from '../lib/utils';

const PLANNED_PANELS = [
  { icon: BarChart3, label: 'Canvassing Analytics', desc: 'Visit volume, district coverage, and field activity heatmaps', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { icon: TrendingUp, label: 'Conversion Rate Funnel', desc: 'Visits → Sample Sent → Quote Given → Won pipeline analytics', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { icon: MapPin, label: 'Field Operations KPIs', desc: 'District-wise performance, top zones, and coverage gaps', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { icon: Users, label: 'Team Performance', desc: 'Canvasser productivity, rankings, and incentive tracking', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { icon: Target, label: 'Sales Pipeline Metrics', desc: 'Revenue generated from field leads, order win rate, and pipeline value', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { icon: Sparkles, label: 'Revenue Attribution', desc: 'Commission attribution, canvasser-generated revenue, and ROI per visit', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
];

export default function CCODashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('cco_overview'); // 'cco_overview', 'invoicing', 'logs', 'team'

  // Under Construction Overlay State
  // Set to true by default to hide the workspace from viewers while developing underneath.
  // Can be permanently removed or toggled when the CCO Overview is ready to launch.
  const [isOverlayLocked, setIsOverlayLocked] = useState(true);

  const navTabs = [
    { id: 'cco_overview', label: 'CCO Commercial Overview', icon: TrendingUp },
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
              <div className="h-10 w-20 rounded-xl overflow-hidden border border-white/10 shadow-md bg-[#14151b] flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="MG The One" 
                  className="w-full h-full object-cover scale-[1.38]"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">The One</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> CCO — Commercial Strategy
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user?.name || 'Varshini'} ({user?.roleTitle || 'Chief Commercial Officer'})</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Field Canvassing, Market Coverage & Commercial Strategy</span>
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

        {activeTab === 'cco_overview' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative">

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
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full px-4 py-1.5 text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    Chief Commercial Officer Intelligence Center
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Commercial Strategy, Market Penetration & Pipeline
                  </h2>

                  <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                    Live tracking of statewide institutional coverage, multi-stage sales funnels, sample-to-order conversions, and field canvasser yield across Tamil Nadu districts.
                  </p>
                </div>

                {/* Underlying KPI Preview Grid (Work In Progress) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Visited Pipeline', val: '₹48.6L', change: '+18.4%', isPos: true },
                    { label: 'Sample Conversion Rate', val: '42.8%', change: '+5.2%', isPos: true },
                    { label: 'Active Territory Coverage', val: '14 Districts', change: '+3 new', isPos: true },
                    { label: 'Avg Canvasser Deal Size', val: '₹76,400', change: '+12.1%', isPos: true },
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

                {/* Planned Commercial Capabilities Panels */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Planned Commercial Capabilities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PLANNED_PANELS.map((p, i) => {
                      const Icon = p.icon;
                      return (
                        <div
                          key={p.label}
                          className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 rounded-3xl p-5 shadow-xl space-y-3"
                        >
                          <div className={cn("w-10 h-10 rounded-2xl border flex items-center justify-center", p.color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{p.label}</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{p.desc}</p>
                          </div>
                          <div className="pt-2 border-t border-white/5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                            <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">Under Active Dev</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* OVERLAY: ACTIVE UNDER CONSTRUCTION SHIELD */}
              <AnimatePresence>
                {isOverlayLocked && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#090a0f]/90 backdrop-blur-xl border border-amber-500/25 p-4 sm:p-6 text-center overflow-y-auto scrollbar-none"
                  >
                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative max-w-lg mx-auto space-y-4 py-2">

                      {/* Badge */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black tracking-wider uppercase shadow-lg shadow-amber-500/10">
                        <Construction className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                        <span>Under Active Construction</span>
                      </div>

                      {/* Icon with Glowing Rings */}
                      <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping opacity-30" />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1c1d27] to-[#12131a] border border-amber-500/40 flex items-center justify-center shadow-2xl">
                          <Wrench className="w-6 h-6 text-amber-400" />
                        </div>
                      </div>

                      {/* Main Title */}
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          CCO Commercial Overview
                          <br />
                          <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                            Work In Progress
                          </span>
                        </h3>
                        <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
                          This commercial intelligence and pipeline analytics workspace is currently under development and veiled for viewers.
                        </p>
                      </div>

                      {/* Architecture & Pipeline Status */}
                      <div className="bg-[#14151d]/90 border border-white/10 rounded-xl p-3 text-left space-y-1.5 max-w-sm mx-auto shadow-inner">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CCO Workspace Scaffold
                          </span>
                          <span className="text-emerald-400 font-mono text-[10px] font-bold">READY</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-amber-400" /> Conversion Funnel Engine
                          </span>
                          <span className="text-amber-400 font-mono text-[10px] font-bold">BUILDING</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-blue-400" /> Viewer Veil Protection
                          </span>
                          <span className="text-blue-400 font-mono text-[10px] font-bold">ACTIVE</span>
                        </div>
                      </div>

                      {/* Dev Toggle Button */}
                      <div className="pt-1">
                        <button
                          onClick={() => setIsOverlayLocked(false)}
                          className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-2 mx-auto group shadow-md"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span>Dev Preview (Temporarily Reveal Workspace)</span>
                        </button>
                        <p className="text-[10px] text-gray-500 mt-1 font-medium">
                          Work on components underneath and lock/unlock anytime.
                        </p>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FLOATING DEVELOPER RE-LOCK BUTTON (Visible when overlay is unlocked in dev mode) */}
              {!isOverlayLocked && (
                <div className="absolute top-4 right-4 z-40">
                  <button
                    onClick={() => setIsOverlayLocked(true)}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Re-enable Construction Overlay</span>
                  </button>
                </div>
              )}

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

