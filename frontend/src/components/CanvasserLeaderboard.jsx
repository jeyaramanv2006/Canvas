import React, { useState, useEffect } from 'react';
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

export default function CanvasserLeaderboard({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('pay'); // 'pay', 'visits', 'invoices', 'invoiced', 'conversion', 'avg_deal'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [selectedMonth, setSelectedMonth] = useState('2026-09'); // Default to live current month
  const [expandedCanvasserId, setExpandedCanvasserId] = useState(null);

  // Check if current user is executive or management
  const userRole = (currentUser?.role || '').toLowerCase();
  const isExecutive = ['ceo', 'cfo', 'cco', 'manager', 'admin'].includes(userRole);
  const currentUserId = currentUser?.id ?? currentUser?.userId ?? currentUser?._id;

  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // Helper to format YYYY-MM to readable label
  const formatMonthLabel = (mKey) => {
    if (mKey === 'all') return 'All-Time Cumulative';
    const [year, month] = mKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return mKey === currentMonthKey ? `${monthName} (Current Month)` : monthName;
  };

  const monthOptions = [
    { id: '2026-09', label: formatMonthLabel('2026-09') },
    { id: '2026-08', label: formatMonthLabel('2026-08') },
    { id: '2026-07', label: formatMonthLabel('2026-07') },
    { id: '2026-06', label: formatMonthLabel('2026-06') },
    { id: 'all', label: 'All-Time Cumulative' }
  ];

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
      <div className="py-16 text-center space-y-3 bg-murugan-card border border-white/10 rounded-3xl p-8 shadow-xl">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
        <p className="text-sm text-gray-300 font-bold">Calculating monthly realized sales & leaderboard rankings...</p>
        <p className="text-xs text-gray-500">Connecting to sales database</p>
      </div>
    );
  }

  const { rankings = [], teamStats = {} } = data || {};
  const myRank = rankings.find(r => String(r.id) === String(currentUserId));
  const topLeader = rankings && rankings.length > 0 ? rankings[0] : null;
  const gapToLeader = topLeader && myRank && String(topLeader.id) !== String(myRank.id) 
    ? Math.max(0, (Number(topLeader.totalPayout || topLeader.payEarned || topLeader.totalInvoiced) || 0) - (Number(myRank.totalPayout || myRank.payEarned || myRank.totalInvoiced) || 0))
    : 0;

  const sortOptions = [
    { id: 'pay', label: 'Total Pay Earned (₹)', icon: DollarSign, metric: 'Commission + Bonus' },
    { id: 'invoiced', label: 'Realized Sales (₹)', icon: TrendingUp, metric: 'Billed Volume' },
    { id: 'invoices', label: 'Invoices Converted', icon: Receipt, metric: 'Won Deals' },
    { id: 'visits', label: 'Schools Canvassed', icon: Building2, metric: 'Field Visits' },
    { id: 'conversion', label: 'Conversion Rate (%)', icon: Target, metric: 'Win Rate %' }
  ];

  const isCurrentActiveCycle = selectedMonth === '2026-09' || selectedMonth === currentMonthKey;

  return (
    <div className="space-y-5">
      {/* Backend Connection / Session Notice Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-200">Connection or Session Update</p>
              <p className="text-[11px] text-amber-300/80">
                {error.includes('401') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('session')
                  ? "Your session token was issued by another environment. Please Log Out and Log In again to refresh your local session."
                  : error}
              </p>
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

      {/* ================= 1. TOP BANNER: LOGGED IN CANVASSER RANK SPOTLIGHT ================= */}
      {myRank && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-murugan-card to-murugan-card border border-amber-500/40 shadow-xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-amber-400/25 flex-shrink-0">
                #{myRank.rank}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-white">{myRank.name}</h2>
                  <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full tracking-wider">
                    YOUR RANK
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                    {myRank.commissionRate || 2}% Slab Tier
                  </span>
                  {Number(myRank.performanceIncentive) > 0 && (
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      +{myRank.formattedPerformanceIncentive || `₹${Number(myRank.performanceIncentive).toLocaleString('en-IN')}`} Bonus
                    </span>
                  )}
                  {Number(myRank.newSchoolIncentive) > 0 && (
                    <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                      +{myRank.formattedNewSchoolIncentive || `₹${Number(myRank.newSchoolIncentive).toLocaleString('en-IN')}`} New School Bonus
                    </span>
                  )}
                  <span className="text-xs text-gray-300 font-medium ml-1">
                    Total Pay: <strong className="text-emerald-400 font-black text-sm font-mono">{myRank.formattedTotalPayout || myRank.formattedPayEarned || myRank.formattedCommission || '₹0'}</strong>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Monthly Realized Sales</span>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">{myRank.formattedInvoiced || `₹${((myRank.totalInvoiced || 0) / 100000).toFixed(2)}L`}</span>
              <span className="text-xs text-gray-400 block mt-0.5 font-medium">
                {myRank.invoicesConverted || myRank.invoicesCount || 0} Converted Invoices
              </span>
            </div>
          </div>

          {/* Slab Progress Bar or Max Tier Celebration */}
          <div className="mt-4 pt-3.5 border-t border-white/10 space-y-1.5">
            {myRank.nextTarget ? (
              <>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-300">
                    Progress to <strong>Tier {(myRank.commissionTier || 1) + 1} ({Number(myRank.commissionRate || 2) < 5.0 ? (Number(myRank.commissionRate || 2) + 0.5).toFixed(1) : '5.50'}% Slab)</strong>
                  </span>
                  <span className="text-amber-400 font-bold">
                    ₹{((Number(myRank.amountToNextTier) || 0) / 100000).toFixed(2)}L more to level up
                  </span>
                </div>
                <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${myRank.progressPercent || 0}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Top Tier Limit Achieved: Maximum 5.50% Commission Slab + ₹30,000 Volume Bonus Active
                </span>
                <span className="text-[11px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  MAX SLAB (₹25L+)
                </span>
              </div>
            )}
          </div>

          {/* Motivational Gap Summary & Cycle Status */}
          <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-300 flex-wrap gap-2">
            {myRank.rank === 1 ? (
              <span className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <Trophy className="w-4 h-4 text-amber-400" />
                You are #1 on the leaderboard! Keep converting those school accounts.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-300 font-medium text-xs">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Leaderboard gap to #1 ({topLeader?.name || 'Leader'}):</span>
                <strong className="text-white font-mono">
                  {sortBy === 'pay' ? `₹${(gapToLeader || 0).toLocaleString('en-IN')} Pay` : `₹${((gapToLeader || 0) / 100000).toFixed(2)}L Billed`}
                </strong>
              </span>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="bg-white/5 px-3 py-1 rounded-xl">
                {myRank.schoolsCanvassed || myRank.totalVisits || 0} Schools Canvassed
              </span>
              <span className="bg-white/5 px-3 py-1 rounded-xl text-emerald-400 font-bold">
                {myRank.invoicesConverted || myRank.wonOrders || 0} Invoices ({myRank.conversionRate || 0}%)
              </span>
              <span className="bg-white/5 px-3 py-1 rounded-xl text-purple-300 font-bold">
                Settlement: Every 1st
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= 2. ENHANCED MONTHLY TRACKING & NAVIGATION TOOLBAR ================= */}
      <div className="bg-[#161720] border border-white/10 p-4 rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Monthly Sales & Settlement Cycle</h3>
              {isCurrentActiveCycle && (
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Active Month
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Realized sales and canvassed schools accumulate from 1st to month-end.
            </p>
          </div>
        </div>

        {/* Scalable Month Navigation: Stepper + Select Dropdown + All-Time Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Previous / Next Arrow Steppers */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1 gap-1">
            <button
              onClick={handleNextMonth}
              disabled={monthOptions.findIndex(m => m.id === selectedMonth) >= monthOptions.length - 1}
              className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Custom Styled Month Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold text-xs px-2.5 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none"
              >
                {monthOptions.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#181924] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={handlePrevMonth}
              disabled={monthOptions.findIndex(m => m.id === selectedMonth) <= 0}
              className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Toggle to All-Time Cumulative */}
          <button
            onClick={() => setSelectedMonth(selectedMonth === 'all' ? currentMonthKey : 'all')}
            className={cn(
              "px-3 py-2 rounded-2xl text-xs font-bold transition border cursor-pointer whitespace-nowrap",
              selectedMonth === 'all'
                ? "bg-amber-400 text-black border-amber-300 font-black shadow-md shadow-amber-400/20"
                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
            )}
          >
            {selectedMonth === 'all' ? 'Viewing All-Time' : 'All-Time'}
          </button>
        </div>
      </div>

      {/* ================= 3. TEAM AGGREGATES OVERVIEW CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-murugan-card border border-white/10 p-4 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Team Realized Sales</span>
          <span className="text-base sm:text-lg font-black text-amber-400 mt-1 block font-mono">
            {teamStats.formattedTeamInvoiced || `₹${((teamStats.teamTotalInvoiced || 0) / 100000).toFixed(2)}L`}
          </span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-4 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Schools Canvassed</span>
          <span className="text-base sm:text-lg font-black text-white mt-1 block font-mono">
            {teamStats.teamTotalVisits || teamStats.totalTeamVisits || 0}
          </span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-4 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Invoices Converted</span>
          <span className="text-base sm:text-lg font-black text-purple-300 mt-1 block font-mono">
            {teamStats.teamTotalWon || teamStats.totalTeamWon || 0}
          </span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-4 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Canvassers</span>
          <span className="text-base sm:text-lg font-black text-emerald-400 mt-1 block font-mono">
            {teamStats.activeCanvassersCount || rankings.length || 0}
          </span>
        </div>
      </div>

      {/* ================= 4. SORTING CONTROL BAR ================= */}
      <div className="bg-[#161720] border border-white/10 p-3.5 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Compare & Sort Leaderboard</span>
          </div>
          
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Toggle sort direction"
          >
            <span>{sortOrder === 'desc' ? 'Highest First (Descending)' : 'Lowest First (Ascending)'}</span>
            {sortOrder === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronUp className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>

        {/* Quick Filter Sort Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {sortOptions.map(opt => {
            const Icon = opt.icon;
            const isActive = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSortChange(opt.id)}
                className={cn(
                  "px-3 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer border text-xs",
                  isActive 
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 shadow-md shadow-amber-400/20 font-black"
                    : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-black" : "text-amber-400")} />
                <span>{opt.label}</span>
                {isActive && (
                  <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded font-mono">
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 5. MAIN LEADERBOARD TABLE ================= */}
      <div className="bg-murugan-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Canvasser Performance Leaderboard</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Cycle: <strong className="text-amber-400">{formatMonthLabel(selectedMonth)}</strong>
          </span>
        </div>

        {rankings.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-bold text-gray-300">No Canvasser Records Available for this cycle</p>
            <p className="text-xs text-gray-500">
              {error 
                ? "Start the local backend server (cd backend; npm run dev) to load live canvasser data."
                : "No active field visits or converted sales logged for the selected timeframe."}
            </p>
            <button
              onClick={loadLeaderboard}
              className="px-4 py-2 bg-murugan-accent text-black font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-yellow-400 transition"
            >
              Refresh Rankings
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rankings.map((canvasser) => {
              const isMe = String(canvasser.id) === String(currentUserId);
              const canViewPay = isMe || isExecutive;
              const isExpanded = expandedCanvasserId === canvasser.id;
              const invoicesList = canvasser.convertedInvoices || [];
              
              // Rank badge styling
              let rankBadge = (
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-300 flex-shrink-0">
                  #{canvasser.rank}
                </div>
              );
              if (canvasser.rank === 1) {
                rankBadge = (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center font-black text-black text-xs shadow-md shadow-amber-400/20 flex-shrink-0">
                    🏆
                  </div>
                );
              } else if (canvasser.rank === 2) {
                rankBadge = (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-300 to-gray-400 flex items-center justify-center font-black text-black text-xs shadow-md shadow-slate-300/20 flex-shrink-0">
                    🥈
                  </div>
                );
              } else if (canvasser.rank === 3) {
                rankBadge = (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-orange-800 flex items-center justify-center font-black text-white text-xs shadow-md shadow-amber-700/20 flex-shrink-0">
                    🥉
                  </div>
                );
              }

              return (
                <div
                  key={canvasser.id}
                  className={cn(
                    "transition-all",
                    isMe ? "bg-amber-500/5 ring-1 ring-amber-500/20" : "hover:bg-white/5"
                  )}
                >
                  {/* Main Canvasser Row */}
                  <div className="p-4 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3">
                      {rankBadge}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{canvasser.name}</span>
                            {isMe && (
                              <span className="text-[9px] font-black uppercase bg-amber-400 text-black px-1.5 py-0.5 rounded font-mono">
                                YOU
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                            {canvasser.commissionRate || 2}% Slab
                          </span>
                          {Number(canvasser.performanceIncentive) > 0 && canViewPay && (
                            <span className="text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              +{canvasser.formattedPerformanceIncentive || `₹${Number(canvasser.performanceIncentive).toLocaleString('en-IN')}`} Bonus
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <strong className="text-gray-200">{canvasser.schoolsCanvassed || canvasser.totalVisits || 0}</strong> Schools
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Receipt className="w-3 h-3 text-emerald-400" />
                            <strong className="text-emerald-300">{canvasser.invoicesConverted || canvasser.invoicesCount || 0}</strong> Invoices
                          </span>
                          <span>•</span>
                          <span className="text-gray-400">
                            Win Rate: <strong className="text-purple-300">{canvasser.conversionRate || 0}%</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics & Pay Display */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-between w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Realized Sales</span>
                        <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                          {canvasser.formattedInvoiced || `₹${((canvasser.totalInvoiced || 0) / 100000).toFixed(2)}L`}
                        </span>
                      </div>

                      {/* Pay column: Only visible to the specific canvasser or Executives */}
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Pay</span>
                        {canViewPay ? (
                          <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                            {canvasser.formattedTotalPayout || canvasser.formattedPayEarned || canvasser.formattedCommission || '₹0'}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-500 flex items-center justify-end gap-1" title="Confidential: Only visible to this canvasser">
                            <Lock className="w-3 h-3 text-gray-500" />
                            <span>Private</span>
                          </span>
                        )}
                      </div>

                      {/* View Pay Details Button: ONLY rendered for the canvasser themselves or CEO/Admin */}
                      {canViewPay && (
                        <button
                          onClick={() => toggleExpand(canvasser.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                            isExpanded 
                              ? "bg-amber-400 text-black border-amber-300"
                              : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
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

                  {/* ================= 6. EXPANDABLE ITEMIZED INVOICE TABLE (Screenshot 1 Format) ================= */}
                  <AnimatePresence>
                    {isExpanded && canViewPay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#101118] border-t border-white/10 px-4 py-4 space-y-4 overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-300 pb-1 flex-wrap gap-2">
                          <span className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                            <Receipt className="w-4 h-4 text-amber-400" />
                            Monthly Converted Invoices for {canvasser.name}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            <span>Monthly Realized Sales: <strong className="text-amber-400 font-mono">{canvasser.formattedInvoiced}</strong></span>
                            <span>•</span>
                            <span>Next Settlement: <strong className="text-emerald-400">{canvasser.nextSettlementDate || '1st of Month'}</strong></span>
                          </div>
                        </div>

                        {invoicesList.length === 0 ? (
                          <p className="text-xs text-gray-500 py-3 italic">
                            No converted invoices logged in this monthly cycle. Once school visits convert and invoices are issued, they will appear here.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-[#181924] text-gray-400 uppercase text-[10px] font-bold border-b border-white/10">
                                <tr>
                                  <th className="py-3 px-4 text-amber-400 font-black">INVOICE ID</th>
                                  <th className="py-3 px-4">SCHOOL INSTITUTION</th>
                                  <th className="py-3 px-4">DISTRICT</th>
                                  <th className="py-3 px-4 text-right">INVOICE VALUE (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-medium">
                                {invoicesList.map(inv => (
                                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 font-mono text-amber-400 font-bold">{inv.id}</td>
                                    <td className="py-3 px-4 text-white font-semibold">{inv.school_name}</td>
                                    <td className="py-3 px-4 text-gray-300">{inv.district || 'Tamil Nadu'}</td>
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
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block font-medium">1. Realized Sales</span>
                            <span className="text-sm font-black text-amber-400 font-mono">
                              {canvasser.formattedInvoicedFull || canvasser.formattedInvoiced || '₹0'}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block font-medium">2. Commission ({canvasser.commissionRate || 2}% Slab)</span>
                            <span className="text-sm font-black text-emerald-300 font-mono">
                              {canvasser.formattedCommission || `₹${Number(canvasser.commissionEarned || 0).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block font-medium">3. Sales Incentive</span>
                            <span className="text-sm font-black text-amber-300 font-mono">
                              {canvasser.formattedPerformanceIncentive || `₹${Number(canvasser.performanceIncentive || 0).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block font-medium">4. Discovery Bonus ({canvasser.verifiedDiscoveryCount || 0} Verified)</span>
                            <span className="text-sm font-black text-purple-300 font-mono">
                              {canvasser.formattedDiscoveryBonuses || `₹${Number(canvasser.verifiedDiscoveryBonuses || 0).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="space-y-0.5 sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                            <span className="text-[10px] text-emerald-400 block font-bold uppercase">Total Current Pay</span>
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

      {/* ================= 7. BOTTOM SECTION: COMMISSION SLABS & BONUS TIERS ================= */}
      <div className="bg-murugan-card/70 border border-white/10 p-5 rounded-3xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-amber-400" />
            Standard Monthly Commission Slabs Matrix
          </span>
          <span className="text-[11px] text-gray-400">
            Applied to <strong className="text-amber-400">Monthly Net Realized Sales</strong> (Total converted invoices of the month)
          </span>
        </div>

        {/* 8-Tier Slabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[9px] text-gray-400 block font-semibold">₹0 – ₹99,999</span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">2.00%</span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[9px] text-gray-400 block font-semibold">₹1L – ₹2.49L</span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">2.50%</span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[9px] text-gray-400 block font-semibold">₹2.5L – ₹4.99L</span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">3.00%</span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[9px] text-gray-400 block font-semibold">₹5L – ₹7.49L</span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">3.50%</span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[9px] text-gray-400 block font-semibold">₹7.5L – ₹9.99L</span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">4.00%</span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[9px] text-gray-400 block font-semibold">₹10L – ₹14.99L</span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">4.50%</span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[9px] text-gray-400 block font-semibold">₹15L – ₹24.99L</span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">5.00%</span>
          </div>
          <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
            <span className="text-[9px] text-emerald-300 block font-semibold">₹25L and above</span>
            <span className="text-xs font-black text-emerald-400 mt-0.5 block">5.50% Max</span>
          </div>
        </div>

        {/* Monthly Performance Incentive & New School Bonus Cards */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              Monthly Performance Incentive (Bonus on Volume)
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-gray-400 block font-medium">₹5L+</span>
                <span className="text-[11px] font-black text-white">+₹2,000</span>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-gray-400 block font-medium">₹7.5L+</span>
                <span className="text-[11px] font-black text-white">+₹4,000</span>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-gray-400 block font-medium">₹10L+</span>
                <span className="text-[11px] font-black text-white">+₹7,500</span>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-gray-400 block font-medium">₹15L+</span>
                <span className="text-[11px] font-black text-white">+₹12,500</span>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-gray-400 block font-medium">₹20L+</span>
                <span className="text-[11px] font-black text-white">+₹20,000</span>
              </div>
              <div className="p-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-lg">
                <span className="text-[9px] text-emerald-300 block font-medium">₹25L+</span>
                <span className="text-[11px] font-black text-emerald-400">+₹30,000</span>
              </div>
            </div>
          </div>

          <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                New School Account Acquisition Incentive
              </span>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Earn <strong className="text-white font-bold">₹1,000 bonus</strong> for every newly converted non-catalog institution successfully acquired and invoiced.
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Auto-added on invoice creation
              </span>
              <span className="font-mono text-purple-300 font-bold">Settled 1st of every month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Commercial Rules Banner */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-gray-200 font-bold">Monthly Realized Sales & 1st-of-Month Payout Cycle:</p>
          <p className="text-[11px] leading-relaxed">
            1. All commercial invoices and school visits logged in a calendar month (from 1st to month-end) accumulate into the canvasser’s <strong>Monthly Realized Sales</strong> and visit volume.
            <br />
            2. At any point in the month, the total realized sales determines the active commission slab (2.00% to 5.50%) and performance bonus.
            <br />
            3. On the 1st of every month, total earned payouts are summarized and locked for settlement, and the new monthly sales cycle begins fresh at ₹0.
          </p>
        </div>
      </div>
    </div>
  );
}
