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

export default function DynamicKPISection({ currentUser }) {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  const roleConfig = getRoleConfig(currentUser);
  const isUserAdmin = isAdmin(currentUser);

  useEffect(() => {
    loadKPIs();
  }, [currentUser]);

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
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-murugan-accent animate-pulse" />
            {isUserAdmin ? 'Executive Performance' : 'Field Sales Performance'}
          </h2>
          <p className="text-xs text-gray-400">
            {roleConfig.description}
          </p>
        </div>
      </div>

      {/* Dynamic KPI Cards Grid */}
      {loading || !kpiData ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-murugan-card/60 border border-white/5 p-4 rounded-2xl h-28 animate-pulse" />
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
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 relative overflow-hidden group shadow-lg hover:shadow-2xl hover:scale-[1.01] flex flex-col justify-between",
                  "bg-murugan-card/90 backdrop-blur-md border-white/10 hover:border-white/20"
                )}
              >
                {/* Subtle Ambient Glow */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-murugan-accent/5 rounded-full blur-2xl group-hover:bg-murugan-accent/10 transition-all pointer-events-none" />

                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="pr-2">
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-300 block leading-snug">
                      {kpi.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5 inline-block">
                      {kpi.trend}
                    </span>
                  </div>
                  <div className={cn(
                    "p-2 sm:p-2.5 rounded-xl border bg-black/40 flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6",
                    colorClass
                  )}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-2 relative z-10">
                  <h3 className="text-base sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-white group-hover:text-murugan-accent transition-colors truncate whitespace-nowrap">
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
