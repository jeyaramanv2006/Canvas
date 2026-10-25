import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Percent, Target, Briefcase, 
  Sparkles, Award, ArrowUpRight, BarChart3, 
  CheckCircle, FileCheck, Trophy, Receipt
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { isAdmin, getRoleConfig } from '../lib/rbac';
import { cn } from '../lib/utils';

const KPI_ICONS = {
  revenue: DollarSign,
  gross_profit: TrendingUp,
  ebitda: Award,
  cash_flow: Sparkles,
  collection_rate: CheckCircle,
  school_visits: Briefcase,
  leads_generated: Target,
  quotations_issued: FileCheck,
  orders_won: Award,
  order_value: DollarSign,
  invoices_credited: Receipt,
  commission_earned: TrendingUp,
  commission_slab: Sparkles,
  team_rank: Trophy,
  conversion_pct: Percent
};

const KPI_COLORS = {
  revenue: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/30',
  gross_profit: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30',
  ebitda: 'from-yellow-500/20 to-amber-500/5 text-yellow-400 border-yellow-500/30',
  cash_flow: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/30',
  collection_rate: 'from-emerald-500/20 to-green-500/5 text-emerald-400 border-emerald-500/30',
  school_visits: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/30',
  leads_generated: 'from-amber-500/20 to-orange-500/5 text-amber-400 border-amber-500/30',
  quotations_issued: 'from-yellow-500/20 to-amber-500/5 text-yellow-400 border-yellow-500/30',
  orders_won: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30',
  order_value: 'from-yellow-500/20 to-amber-500/5 text-yellow-400 border-yellow-500/30',
  invoices_credited: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/30',
  commission_earned: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30',
  commission_slab: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/30',
  team_rank: 'from-yellow-500/20 to-orange-500/5 text-yellow-400 border-yellow-500/30',
  conversion_pct: 'from-rose-500/20 to-red-500/5 text-rose-400 border-rose-500/30'
};

export default function DynamicKPISection({ currentUser, refreshTrigger }) {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  const roleConfig = getRoleConfig(currentUser);
  const isUserAdmin = isAdmin(currentUser);

  useEffect(() => {
    loadKPIs();
  }, [currentUser, refreshTrigger]);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getRoleSpecificKPIs(currentUser);
      setKpiData(data);
    } catch (e) {
      console.error("Failed to load KPIs", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse" />
          <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
            {isUserAdmin ? 'Executive Performance Telemetry' : 'Field Sales Performance'}
          </h2>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 border border-white/[0.08]">
            Live KPI
          </span>
        </div>
        <p className="text-[11px] text-white/40 font-medium">
          {roleConfig.description}
        </p>
      </div>

      {/* Dynamic KPI Cards Grid */}
      {loading || !kpiData ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-[#0c0d15]/80 border border-white/[0.06] p-4 rounded-3xl h-28 animate-pulse backdrop-blur-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {roleConfig.primaryKPIs.map((kpi, idx) => {
            const valObj = kpiData[kpi.key];
            const displayVal = valObj?.formatted ?? '—';
            const IconComponent = KPI_ICONS[kpi.key] || TrendingUp;
            const colorClass = KPI_COLORS[kpi.key] || 'from-white/10 to-transparent text-white border-white/10';

            return (
              <motion.div
                key={kpi.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className={cn(
                  "p-4 sm:p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between",
                  "bg-[#0c0d15]/85 backdrop-blur-2xl border-white/[0.08] hover:border-amber-400/40 shadow-xl hover:shadow-2xl hover:scale-[1.01]"
                )}
              >
                {/* Luminous Ambient Glow */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/5 group-hover:bg-amber-400/12 rounded-full blur-2xl transition-all duration-300 pointer-events-none" />

                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="pr-2">
                    <span className="text-xs sm:text-[13px] font-bold text-white/70 group-hover:text-white transition-colors block leading-snug">
                      {kpi.label}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono font-medium mt-0.5 inline-block">
                      {kpi.trend}
                    </span>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-2xl border bg-black/40 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
                    colorClass
                  )}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 relative z-10">
                  <h3 className="text-lg sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-white group-hover:text-amber-300 transition-colors truncate whitespace-nowrap">
                    {displayVal}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
