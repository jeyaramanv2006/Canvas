import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  LogOut, TrendingUp, Construction, BarChart3, Users, Target, 
  MapPin, Sparkles, Receipt, History, Trophy 
} from 'lucide-react';
import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import { cn } from '../lib/utils';

const PLANNED_PANELS = [
  { icon: BarChart3, label: 'Canvassing Analytics', desc: 'Visit volume, district coverage, and field activity heatmaps', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { icon: TrendingUp, label: 'Conversion Rate Funnel', desc: 'Visits → Sample Sent → Quote Given → Won pipeline analytics', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { icon: MapPin,     label: 'Field Operations KPIs', desc: 'District-wise performance, top zones, and coverage gaps', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { icon: Users,      label: 'Team Performance',      desc: 'Canvasser productivity, rankings, and incentive tracking', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { icon: Target,     label: 'Sales Pipeline Metrics', desc: 'Revenue generated from field leads, order win rate, and pipeline value', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { icon: Sparkles,   label: 'Revenue Attribution',   desc: 'Commission attribution, canvasser-generated revenue, and ROI per visit', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
];

export default function CCODashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('cco_overview'); // 'cco_overview', 'invoicing', 'logs', 'team'

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
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-400/20">
                MC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white">Murugan Canvass</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> CCO — Commercial Operations
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user?.name} ({user?.roleTitle || 'Chief Commercial Officer'})</span>
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
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Banner Card */}
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-8 rounded-3xl border border-white/10 shadow-2xl text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full px-4 py-1.5 text-xs font-bold">
                <Construction className="w-3.5 h-3.5 text-amber-400" />
                Commercial Analytics Under Design
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Commercial Operations & Field Analytics
                <br />
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  In Finalization (TBD)
                </span>
              </h2>

              <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                The CCO dashboard is being configured to provide live conversion funnels, district penetration heatmaps, and canvasser ROI attribution. You currently have full operational access to the Central Field Visit Registry, Invoicing & Document Engine, and Team Leaderboards.
              </p>

              <div className="inline-flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-5 py-2.5">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-300 font-semibold">Status: Design & Metric Finalization in Progress</span>
              </div>
            </div>

            {/* Planned Panels Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                Planned Commercial Capabilities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLANNED_PANELS.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
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
                        <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">Pending Spec</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
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
