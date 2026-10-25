import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Award, TrendingUp, Users, Target, 
  Sparkles, ShieldCheck, Flame, ChevronUp, ChevronDown, CheckCircle2,
  Receipt, Briefcase, Info, RefreshCw, ArrowUpDown, DollarSign,
  Building2, Percent, Calculator, ChevronRight, Eye, Calendar, Gift, AlertCircle,
  Lock, ChevronLeft
} from 'lucide-react';
import { mockApi, calculateCommissionSlab } from '../mockApi';
import { cn } from '../lib/utils';
import AestheticSelect from './AestheticSelect';

export default function CanvasserLeaderboard({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('pay'); // 'pay', 'visits', 'invoices', 'invoiced', 'conversion', 'avg_deal'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthKey);
  const [expandedCanvasserId, setExpandedCanvasserId] = useState(null);
  const [dynamicMonths, setDynamicMonths] = useState([]);
  const [showCommissionGuide, setShowCommissionGuide] = useState(false);

  // Check if current user is canvasser vs executive
  const userRole = (currentUser?.role || '').toLowerCase();
  const isCanvasser = userRole === 'canvasser';
  const isExecutive = ['ceo', 'cfo', 'cco', 'manager', 'admin', 'admin_exec'].includes(userRole);
  const currentUserId = currentUser?.id ?? currentUser?.userId ?? currentUser?._id;

  // Helper to format YYYY-MM to readable label
  const formatMonthLabel = (mKey) => {
    if (mKey === 'all') return 'All-Time Cumulative';
    const [year, month] = mKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return mKey === currentMonthKey ? `${monthName} (Current Month)` : monthName;
  };

  const monthOptions = useMemo(() => {
    const list = dynamicMonths.length > 0 ? [...dynamicMonths] : [currentMonthKey, '2026-09', '2026-08', '2026-07'];
    if (!list.includes(currentMonthKey)) {
      list.unshift(currentMonthKey);
    }
    const unique = Array.from(new Set(list));
    const opts = unique.map(m => ({ id: m, label: formatMonthLabel(m) }));
    opts.push({ id: 'all', label: 'All-Time Cumulative' });
    return opts;
  }, [dynamicMonths, currentMonthKey]);

  useEffect(() => {
    loadLeaderboard();
  }, [currentUser, sortBy, sortOrder, selectedMonth]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mockApi.getCanvasserLeaderboard({ 
        sort_by: sortBy, 
        order: sortOrder,
        month: selectedMonth 
      });

      if (res && res.availableMonths && Array.isArray(res.availableMonths)) {
        setDynamicMonths(res.availableMonths);
      }

      if (res && Array.isArray(res.rankings)) {
        setData(res);
      } else if (Array.isArray(res)) {
        const safeRankings = res;
        const teamTotalInvoiced = safeRankings.reduce((sum, c) => sum + (Number(c.totalInvoiced) || 0), 0);
        const teamTotalWon = safeRankings.reduce((sum, c) => sum + (Number(c.wonOrders || c.invoicesConverted) || 0), 0);
        const teamTotalVisits = safeRankings.reduce((sum, c) => sum + (Number(c.totalVisits || c.schoolsCanvassed) || 0), 0);
        const teamTotalPay = safeRankings.reduce((sum, c) => sum + (Number(c.totalPayout || c.payEarned || c.commissionEarned) || 0), 0);

        setData({
          rankings: safeRankings,
          teamStats: {
            teamTotalInvoiced,
            formattedTeamInvoiced: `₹${(teamTotalInvoiced / 100000).toFixed(2)}L`,
            teamTotalWon,
            teamTotalVisits,
            teamTotalPay,
            formattedTeamTotalPay: `₹${teamTotalPay.toLocaleString('en-IN')}`,
            teamConversionRate: teamTotalVisits > 0 ? Math.round((teamTotalWon / teamTotalVisits) * 100) : 0,
            activeCanvassersCount: safeRankings.length
          }
        });
      } else {
        setData({ rankings: [], teamStats: {} });
      }
    } catch (e) {
      console.error("Failed loading leaderboard:", e);
      setError(e.message || "Could not connect to backend server. Please check if your backend is running.");
      setData({
        rankings: [],
        teamStats: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(criteria);
      setSortOrder('desc');
    }
  };

  const toggleExpand = (id) => {
    setExpandedCanvasserId(prev => prev === id ? null : id);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const currentIndex = monthOptions.findIndex(m => m.id === selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(monthOptions[currentIndex - 1].id);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = monthOptions.findIndex(m => m.id === selectedMonth);
    if (currentIndex < monthOptions.length - 1) {
      setSelectedMonth(monthOptions[currentIndex + 1].id);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-20 text-center space-y-3 bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-8 shadow-xl backdrop-blur-2xl">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
        <p className="text-sm text-white/80 font-bold">Calculating sales &amp; leaderboard rankings...</p>
        <p className="text-xs text-white/40">Synchronizing realized transactions from sales database</p>
      </div>
    );
  }

  const { rankings = [], teamStats = {} } = data || {};
  const myRank = rankings.find(r => String(r.id) === String(currentUserId));
  const topLeader = rankings && rankings.length > 0 ? rankings[0] : null;

  const sortOptions = [
    { id: 'pay', label: 'Total Pay Earned (₹)', icon: DollarSign, metric: 'Commission + Bonus' },
    { id: 'invoiced', label: 'Realized Sales (₹)', icon: TrendingUp, metric: 'Billed Volume' },
    { id: 'invoices', label: 'Invoices Converted', icon: Receipt, metric: 'Won Deals' },
    { id: 'visits', label: 'Schools Canvassed', icon: Building2, metric: 'Field Visits' },
    { id: 'conversion', label: 'Conversion Rate (%)', icon: Target, metric: 'Win Rate %' }
  ];

  const isCurrentActiveCycle = selectedMonth === '2026-09' || selectedMonth === currentMonthKey;

  return (
    <div className="space-y-5 selection:bg-amber-400 selection:text-black">
      {/* Backend Connection Notice Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-200">Connection Notice</p>
              <p className="text-[11px] text-amber-300/80">{error}</p>
            </div>
          </div>
          <button
            onClick={loadLeaderboard}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-white font-bold rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ================= 1. CANVASSER-ONLY SPOTLIGHT (UNCHANGED FOR CANVASSER ROLE) ================= */}
      {myRank && isCanvasser && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#161420]/90 via-[#0e1017]/90 to-[#0c0d15]/90 border border-amber-500/40 shadow-2xl relative overflow-hidden backdrop-blur-2xl space-y-4"
        >
          {/* Luminous Top Catch */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10 flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-400/25 shrink-0 border border-amber-300">
                #{myRank.rank}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{myRank.name}</h2>
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    · Your Rank
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-white/60">
                  <span className="font-semibold text-purple-300 text-[11px]">
                    {myRank.commissionRate || 2}% Slab
                  </span>
                  {Number(myRank.performanceIncentive) > 0 && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="font-semibold text-amber-300 text-[11px] flex items-center gap-1">
                        <Gift className="w-3 h-3 text-amber-400" />
                        +{myRank.formattedPerformanceIncentive || `₹${Number(myRank.performanceIncentive).toLocaleString('en-IN')}`} Bonus
                      </span>
                    </>
                  )}
                  {Number(myRank.newSchoolIncentive) > 0 && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="font-semibold text-cyan-300 text-[11px]">
                        +{myRank.formattedNewSchoolIncentive || `₹${Number(myRank.newSchoolIncentive).toLocaleString('en-IN')}`} New School
                      </span>
                    </>
                  )}
                  <span className="text-white/20">·</span>
                  <span>
                    Pay: <strong className="text-emerald-400 font-mono font-black text-sm">{myRank.formattedTotalPayout || myRank.formattedPayEarned || myRank.formattedCommission || '₹0'}</strong>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Monthly Sales</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
                {myRank.formattedInvoiced || `₹${((myRank.totalInvoiced || 0) / 100000).toFixed(2)}L`}
              </span>
              <span className="text-[11px] text-white/50 block font-medium">
                {myRank.invoicesConverted || myRank.invoicesCount || 0} Invoices Converted
              </span>
            </div>
          </div>

          {/* Minimal Level-Up Progress Bar */}
          <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
            {myRank.nextTarget ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60 text-[11px]">
                    Next: <strong className="text-white">Tier {(myRank.commissionTier || 1) + 1} ({Number(myRank.commissionRate || 2) < 5.0 ? (Number(myRank.commissionRate || 2) + 0.5).toFixed(1) : '5.50'}% Slab)</strong>
                  </span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">
                    ₹{((Number(myRank.amountToNextTier) || 0) / 100000).toFixed(2)}L to unlock
                  </span>
                </div>
                <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/[0.08]">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    style={{ width: `${myRank.progressPercent || 0}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Top Tier: Maximum 5.50% Slab + ₹30,000 Bonus Active
                </span>
                <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  MAX TIER
                </span>
              </div>
            )}
          </div>

          {/* Minimal 3-Chip Summary */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px]">
                {myRank.schoolsCanvassed || myRank.totalVisits || 0} Visits
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-emerald-400 font-bold text-[11px]">
                {myRank.invoicesConverted || myRank.wonOrders || 0} Deals ({myRank.conversionRate || 0}%)
              </span>
            </div>
            <span className="text-[11px] text-purple-300/80 font-medium">
              Payout: 1st of month
            </span>
          </div>
        </motion.div>
      )}

      {/* ================= 2. EXECUTIVE-ONLY TOP HEADER ================= */}
      {!isCanvasser && (
        <div className="bg-gradient-to-r from-[#14151f]/95 via-[#0e1017]/90 to-[#0c0d15]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-black font-black shadow-lg shadow-amber-400/20 shrink-0">
                <Trophy className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md border font-mono bg-amber-500/15 text-amber-300 border-amber-500/30">
                    Executive Intelligence
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  Field Sales &amp; Canvasser Leaderboard
                </h2>
                <p className="text-xs text-white/55 mt-0.5 max-w-xl">
                  Real-time sales standings, commission slabs, conversion rates, and itemized payout audits.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. MONTHLY CYCLE TOOLBAR ================= */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-xl backdrop-blur-xl relative z-40 overflow-visible">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Sales Cycle</h3>
              {isCurrentActiveCycle && (
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40 mt-0.5">
              Accumulates from 1st to month-end.
            </p>
          </div>
        </div>

        {/* Stepper + AestheticSelect + All-Time Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative z-40 overflow-visible">
          <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-2xl p-1 gap-1 relative z-40 overflow-visible">
            <button
              onClick={handleNextMonth}
              disabled={monthOptions.findIndex(m => m.id === selectedMonth) >= monthOptions.length - 1}
              className="p-1.5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="min-w-[190px] relative z-50">
              <AestheticSelect
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions}
                size="sm"
                buttonClassName="bg-transparent border-0 hover:bg-white/[0.06] shadow-none py-1.5"
                dropdownClassName="z-[9999]"
              />
            </div>

            <button
              onClick={handlePrevMonth}
              disabled={monthOptions.findIndex(m => m.id === selectedMonth) <= 0}
              className="p-1.5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedMonth(selectedMonth === 'all' ? currentMonthKey : 'all')}
            className={cn(
              "px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap",
              selectedMonth === 'all'
                ? "bg-gradient-to-r from-amber-400 to-amber-300 text-black border-amber-300 font-black shadow-md shadow-amber-400/20"
                : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border-white/[0.08]"
            )}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* ================= 4. TEAM AGGREGATES TELEMETRY CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-5 rounded-3xl flex flex-col justify-center items-center space-y-1.5 text-center shadow-xl backdrop-blur-xl group hover:border-amber-400/30 transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-1.5 text-amber-400/80 text-[10px] font-bold uppercase tracking-wider font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Realized Sales</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight group-hover:scale-105 transition-transform">
            {teamStats.formattedTeamInvoiced || `₹${((teamStats.teamTotalInvoiced || 0) / 100000).toFixed(2)}L`}
          </span>
        </div>

        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-5 rounded-3xl flex flex-col justify-center items-center space-y-1.5 text-center shadow-xl backdrop-blur-xl group hover:border-white/20 transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-wider font-mono">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Schools Visited</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight group-hover:scale-105 transition-transform">
            {teamStats.teamTotalVisits || teamStats.totalTeamVisits || 0}
          </span>
        </div>

        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-5 rounded-3xl flex flex-col justify-center items-center space-y-1.5 text-center shadow-xl backdrop-blur-xl group hover:border-purple-400/30 transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-1.5 text-purple-300/80 text-[10px] font-bold uppercase tracking-wider font-mono">
            <Receipt className="w-3.5 h-3.5 text-purple-400" />
            <span>Invoices Won</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono tracking-tight group-hover:scale-105 transition-transform">
            {teamStats.teamTotalWon || teamStats.totalTeamWon || 0}
          </span>
        </div>

        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-5 rounded-3xl flex flex-col justify-center items-center space-y-1.5 text-center shadow-xl backdrop-blur-xl group hover:border-emerald-400/30 transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-1.5 text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider font-mono">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Canvassers</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight group-hover:scale-105 transition-transform">
            {teamStats.activeCanvassersCount || rankings.length || 0}
          </span>
        </div>
      </div>

      {/* ================= 5. SORTING CONTROL BAR ================= */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 rounded-3xl space-y-3 shadow-xl backdrop-blur-xl relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Compare &amp; Sort</span>
          </div>
          
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Toggle sort direction"
          >
            <span>{sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}</span>
            {sortOrder === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronUp className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>

        {/* Sort Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {sortOptions.map(opt => {
            const Icon = opt.icon;
            const isActive = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSortChange(opt.id)}
                className={cn(
                  "relative px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer text-xs select-none",
                  isActive 
                    ? "text-black font-black"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeLeaderboardSortPill"
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl shadow-md shadow-amber-400/25 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                  />
                )}
                <Icon className={cn("w-3.5 h-3.5 relative z-10", isActive ? "text-black" : "text-amber-400")} />
                <span className="relative z-10">{opt.label}</span>
                {isActive && (
                  <span className="relative z-10 text-[10px] bg-black/20 px-1 py-0.2 rounded font-mono">
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 6. MAIN LEADERBOARD TABLE / CARDS ================= */}
      <div className="bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl backdrop-blur-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">Canvasser Rankings &amp; Realized Volume</h3>
              <p className="text-[11px] text-white/40">Real-time team standings and realized conversion metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-white/40">Cycle:</span>
            <span className="text-amber-400 font-bold font-mono">{formatMonthLabel(selectedMonth)}</span>
          </div>
        </div>

        {rankings.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Trophy className="w-10 h-10 text-white/20 mx-auto" />
            <p className="text-sm font-bold text-white/80">No Canvasser Records Available</p>
            <p className="text-xs text-white/40 max-w-md mx-auto">
              No active field visits or converted sales logged for the selected cycle.
            </p>
            <button
              onClick={loadLeaderboard}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 cursor-pointer hover:scale-105 transition"
            >
              Refresh Rankings
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {rankings.map((canvasser) => {
              const isMe = String(canvasser.id) === String(currentUserId);
              const canViewPay = isMe || isExecutive;
              const isExpanded = expandedCanvasserId === canvasser.id;
              const invoicesList = canvasser.convertedInvoices || [];
              
              // Rank badge styling with metallic podium flair
              let rankBadge = (
                <div className="w-9 h-9 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono font-bold text-xs text-white/60 shrink-0">
                  #{canvasser.rank}
                </div>
              );
              if (canvasser.rank === 1) {
                rankBadge = (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 border border-amber-300 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-400/25 shrink-0">
                    🥇
                  </div>
                );
              } else if (canvasser.rank === 2) {
                rankBadge = (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-gray-400 border border-slate-200 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-slate-300/25 shrink-0">
                    🥈
                  </div>
                );
              } else if (canvasser.rank === 3) {
                rankBadge = (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-700 via-orange-700 to-amber-900 border border-amber-600/50 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-amber-700/25 shrink-0">
                    🥉
                  </div>
                );
              }

              return (
                <div
                  key={canvasser.id}
                  className={cn(
                    "transition-all duration-200",
                    isMe ? "bg-amber-400/[0.06] border-l-2 border-l-amber-400" : "hover:bg-white/[0.03]"
                  )}
                >
                  {/* Main Canvasser Row */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3.5">
                      {rankBadge}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{canvasser.name}</span>
                            {isMe && (
                              <span className="text-[9px] font-bold uppercase text-amber-400 font-mono">
                                · You
                              </span>
                            )}
                          </h4>
                          <span className="text-[11px] font-semibold text-purple-300 font-mono">
                            {canvasser.commissionRate || 2}% Slab
                          </span>
                          {Number(canvasser.performanceIncentive) > 0 && canViewPay && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="text-[11px] font-medium text-amber-300 flex items-center gap-1 font-mono">
                                +{canvasser.formattedPerformanceIncentive || `₹${Number(canvasser.performanceIncentive).toLocaleString('en-IN')}`} Bonus
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] text-white/50 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-white/40" />
                            <strong className="text-white/80 font-mono">{canvasser.schoolsCanvassed || canvasser.totalVisits || 0}</strong> Schools
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            <strong className="text-emerald-300 font-mono">{canvasser.invoicesConverted || canvasser.invoicesCount || 0}</strong> Deals
                          </span>
                          <span>•</span>
                          <span className="text-white/50">
                            Win Rate: <strong className="text-purple-300 font-mono">{canvasser.conversionRate || 0}%</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics & Pay Display */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-between w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-white/40 uppercase block font-mono">Realized Sales</span>
                        <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                          {canvasser.formattedInvoiced || `₹${((canvasser.totalInvoiced || 0) / 100000).toFixed(2)}L`}
                        </span>
                      </div>

                      {/* Pay column: Visible to Canvasser or Executives */}
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-white/40 uppercase block font-mono">Total Pay</span>
                        {canViewPay ? (
                          <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                            {canvasser.formattedTotalPayout || canvasser.formattedPayEarned || canvasser.formattedCommission || '₹0'}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-white/30 flex items-center justify-end gap-1" title="Confidential">
                            <Lock className="w-3.5 h-3.5 text-white/30" />
                            <span>Private</span>
                          </span>
                        )}
                      </div>

                      {/* View Pay Details Button */}
                      {canViewPay && (
                        <button
                          onClick={() => toggleExpand(canvasser.id)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                            isExpanded 
                              ? "bg-amber-400 text-black border-amber-300 font-black shadow-md shadow-amber-400/20"
                              : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border-white/[0.08]"
                          )}
                          title="Inspect converted invoices and monthly pay calculation"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isExpanded ? 'Hide Details' : 'View Pay Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Itemized Invoice Table */}
                  <AnimatePresence>
                    {isExpanded && canViewPay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#080910] border-t border-white/[0.08] px-5 py-5 space-y-4 overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-xs text-white/70 pb-1 flex-wrap gap-2">
                          <span className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                            <Receipt className="w-4 h-4 text-amber-400" />
                            Monthly Invoices for {canvasser.name}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-white/50">
                            <span>Realized: <strong className="text-amber-400 font-mono">{canvasser.formattedInvoiced}</strong></span>
                            <span>•</span>
                            <span>Settlement: <strong className="text-emerald-400">{canvasser.nextSettlementDate || '1st of Month'}</strong></span>
                          </div>
                        </div>

                        {invoicesList.length === 0 ? (
                          <p className="text-xs text-white/40 py-3 italic">
                            No converted invoices logged in this monthly cycle.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/40">
                            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                              <thead className="bg-[#121420] text-white/50 uppercase text-[10px] font-bold border-b border-white/[0.08] whitespace-nowrap">
                                <tr>
                                  <th className="py-3 px-4 text-amber-400 font-black">INVOICE ID</th>
                                  <th className="py-3 px-4">SCHOOL INSTITUTION</th>
                                  <th className="py-3 px-4">DISTRICT</th>
                                  <th className="py-3 px-4 text-right">INVOICE VALUE (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.04] font-medium">
                                {invoicesList.map(inv => (
                                  <tr key={inv.id} className="hover:bg-white/[0.04] transition-colors">
                                    <td className="py-3 px-4 font-mono text-amber-400 font-bold">{inv.id}</td>
                                    <td className="py-3 px-4 text-white font-semibold">{inv.school_name}</td>
                                    <td className="py-3 px-4 text-white/60">{inv.district || 'Tamil Nadu'}</td>
                                    <td className="py-3 px-4 text-right font-mono text-white font-bold">
                                      {inv.formatted_total || `₹${Number(inv.grand_total || 0).toLocaleString('en-IN')}`}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Itemized Payout Breakdown Summary Card */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3.5 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-white/40 block font-medium">1. Realized Sales</span>
                            <span className="text-sm font-black text-amber-400 font-mono">
                              {canvasser.formattedInvoicedFull || canvasser.formattedInvoiced || '₹0'}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-white/40 block font-medium">2. Commission ({canvasser.commissionRate || 2}% Slab)</span>
                            <span className="text-sm font-black text-emerald-300 font-mono">
                              {canvasser.formattedCommission || `₹${Number(canvasser.commissionEarned || 0).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-white/40 block font-medium">3. Sales Incentive</span>
                            <span className="text-sm font-black text-amber-300 font-mono">
                              {canvasser.formattedPerformanceIncentive || `₹${Number(canvasser.performanceIncentive || 0).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-white/40 block font-medium">4. Discovery Bonus ({canvasser.verifiedDiscoveryCount || 0} Verified)</span>
                            <span className="text-sm font-black text-purple-300 font-mono">
                              {canvasser.formattedDiscoveryBonuses || `₹${Number(canvasser.verifiedDiscoveryBonuses || 0).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="space-y-0.5 sm:text-right border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-2 sm:pt-0 sm:pl-3.5">
                            <span className="text-[10px] text-emerald-400 block font-bold uppercase font-mono">Total Current Pay</span>
                            <span className="text-base font-black text-emerald-400 font-mono">
                              {canvasser.formattedTotalPayout || canvasser.formattedPayEarned || canvasser.formattedCommission || '₹0'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= 7. COMMISSION & INCENTIVE ACCORDION ================= */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl transition-all">
        <button
          type="button"
          onClick={() => setShowCommissionGuide(!showCommissionGuide)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/25 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-white">Commission &amp; Payout Policy</h4>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25">
                  2.00% – 5.50% Slabs
                </span>
              </div>
              <p className="text-[11px] text-white/40 mt-0.5">
                Monthly tiered commission, volume milestones up to ₹30,000 &amp; ₹1,000 new account bonus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-amber-400 hidden sm:inline">
              {showCommissionGuide ? 'Collapse Guide' : 'View Policy'}
            </span>
            <div className={cn("p-1.5 rounded-xl bg-white/[0.04] text-white/50 transition-transform duration-200", showCommissionGuide && "rotate-180 text-amber-400")}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {showCommissionGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-white/[0.06] p-5 sm:p-6 space-y-5"
            >
              {/* Slabs Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block font-mono">
                  Monthly Realized Sales Slabs
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
                  {[
                    { range: '₹0–₹99K', rate: '2.00%' },
                    { range: '₹1L–₹2.49L', rate: '2.50%' },
                    { range: '₹2.5L–₹4.99L', rate: '3.00%' },
                    { range: '₹5L–₹7.49L', rate: '3.50%' },
                    { range: '₹7.5L–₹9.99L', rate: '4.00%' },
                    { range: '₹10L–₹14.99L', rate: '4.50%' },
                    { range: '₹15L–₹24.99L', rate: '5.00%' },
                    { range: '₹25L+', rate: '5.50% Max', highlight: true }
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-2.5 rounded-2xl border text-center transition",
                        s.highlight
                          ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                          : "bg-black/40 border-white/[0.06] text-amber-400"
                      )}
                    >
                      <span className="text-[9px] text-white/40 block font-semibold">{s.range}</span>
                      <span className="text-xs font-black mt-0.5 block font-mono">{s.rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume Bonuses & New School Acquisition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    Volume Performance Bonus
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                    {[
                      { vol: '₹5L+', b: '+₹2,000' },
                      { vol: '₹7.5L+', b: '+₹4,000' },
                      { vol: '₹10L+', b: '+₹7,500' },
                      { vol: '₹15L+', b: '+₹12,500' },
                      { vol: '₹20L+', b: '+₹20,000' },
                      { vol: '₹25L+', b: '+₹30,000', hl: true }
                    ].map((b, idx) => (
                      <div key={idx} className={cn("p-2 rounded-xl border text-center", b.hl ? "bg-emerald-950/40 border-emerald-500/25 text-emerald-400" : "bg-white/[0.04] border-white/[0.04]")}>
                        <span className="text-[9px] text-white/40 block font-medium">{b.vol}</span>
                        <span className="text-[11px] font-black font-mono">{b.b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      New Account Acquisition
                    </span>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Earn <strong className="text-white font-bold">₹1,000 bonus</strong> for every newly acquired &amp; invoiced institution.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-400/10 px-3 py-1.5 rounded-xl border border-cyan-400/20 shrink-0">
                    +₹1,000 / School
                  </span>
                </div>
              </div>

              {/* 3-Step Protocol */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider block flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Monthly Payout Settlement Protocol
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] text-amber-400 font-mono font-bold block mb-0.5">01 · ACCUMULATION</span>
                    <p className="text-[11px] text-white/60">Invoices converted from 1st to month-end tally into monthly sales.</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] text-purple-300 font-mono font-bold block mb-0.5">02 · SLAB MULTIPLIER</span>
                    <p className="text-[11px] text-white/60">Sales total determines active commission slab (2.00% to 5.50%).</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold block mb-0.5">03 · SETTLEMENT</span>
                    <p className="text-[11px] text-white/60">Commissions &amp; bonuses lock on 1st of every month for disbursement.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
