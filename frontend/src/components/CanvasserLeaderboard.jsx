import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Award, TrendingUp, Users, Target, 
  Sparkles, ShieldCheck, Flame, ChevronUp, ChevronDown, CheckCircle2,
  Receipt, Briefcase, Info, RefreshCw, ArrowUpDown, DollarSign,
  Building2, Percent, Calculator, ChevronRight, Eye
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';

export default function CanvasserLeaderboard({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('pay'); // 'pay', 'visits', 'invoices', 'invoiced', 'conversion', 'avg_deal'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [expandedCanvasserId, setExpandedCanvasserId] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [currentUser, sortBy, sortOrder]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await mockApi.getCanvasserLeaderboard(sortBy, sortOrder);
      setData(res);
    } catch (e) {
      console.error("Failed loading leaderboard", e);
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

  if (loading && !data) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
        <p className="text-xs text-gray-400 font-medium">Calculating team leaderboard rankings & pay breakdown...</p>
      </div>
    );
  }

  const { rankings = [], teamStats = {} } = data || {};
  const myRank = rankings.find(r => r.id === currentUser?.id);
  const topLeader = rankings[0];
  const gapToLeader = topLeader && myRank && topLeader.id !== myRank.id 
    ? Math.max(0, (topLeader.payEarned || topLeader.totalInvoiced) - (myRank.payEarned || myRank.totalInvoiced))
    : 0;

  const sortOptions = [
    { id: 'pay', label: 'Pay Earned (₹)', icon: DollarSign, metric: 'Commission Pay' },
    { id: 'visits', label: 'Schools Canvassed', icon: Building2, metric: 'Field Visits' },
    { id: 'invoices', label: 'Invoices Converted', icon: Receipt, metric: 'Won Deals' },
    { id: 'invoiced', label: 'Total Invoiced (₹)', icon: TrendingUp, metric: 'Revenue Billed' },
    { id: 'conversion', label: 'Conversion Rate (%)', icon: Target, metric: 'Win Rate %' },
    { id: 'avg_deal', label: 'Avg Deal Size (₹)', icon: Calculator, metric: 'Avg / Invoice' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner: Logged In Canvasser Rank Spotlight & Live Slab Status */}
      {myRank && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-murugan-card to-murugan-card border border-amber-500/40 shadow-xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-400/20">
                #{myRank.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white">{myRank.name}</h2>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Your Rank
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                    {myRank.commissionRate}% Slab Tier
                  </span>
                  <span className="text-xs text-gray-300">
                    Total Pay Earned: <strong className="text-emerald-400 font-extrabold text-sm">{myRank.formattedPayEarned || myRank.formattedCommission}</strong>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Invoiced Billed</span>
              <span className="text-lg font-black text-amber-400 font-mono">{myRank.formattedInvoiced}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {myRank.invoicesConverted || myRank.invoicesCount} Invoices Converted
              </span>
            </div>
          </div>

          {/* Slab Upgrade Progress Bar */}
          {myRank.nextTarget && (
            <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-gray-300">
                  Progress to <strong>{myRank.commissionRate + 1}% Slab Tier</strong>
                </span>
                <span className="text-amber-400 font-bold">
                  ₹{(myRank.amountToNextTier / 100000).toFixed(2)}L more to level up
                </span>
              </div>
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${myRank.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Motivational Gap Summary */}
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-gray-300 flex-wrap gap-2">
            {myRank.rank === 1 ? (
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Trophy className="w-4 h-4 text-amber-400" />
                You are #1 on the leaderboard! Keep converting those school accounts.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-300 font-medium text-[11px]">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Leaderboard gap to #1 ({topLeader?.name}):</span>
                <strong className="text-white font-mono">
                  {sortBy === 'pay' ? `₹${(gapToLeader).toLocaleString('en-IN')} Pay` : `₹${(gapToLeader / 100000).toFixed(2)}L Billed`}
                </strong>
              </span>
            )}

            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="bg-white/5 px-2.5 py-1 rounded-xl">
                {myRank.schoolsCanvassed || myRank.totalVisits} Schools Canvassed
              </span>
              <span className="bg-white/5 px-2.5 py-1 rounded-xl text-emerald-400 font-bold">
                {myRank.invoicesConverted || myRank.wonOrders} Invoices Converted ({myRank.conversionRate || 0}%)
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Team Aggregates Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-murugan-card border border-white/10 p-3.5 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Team Total Invoiced</span>
          <span className="text-base font-black text-amber-400 mt-0.5 block font-mono">{teamStats.formattedTeamInvoiced}</span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-3.5 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Canvasser Pay Earned</span>
          <span className="text-base font-black text-emerald-400 mt-0.5 block font-mono">{teamStats.formattedTeamCommission || '₹0'}</span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-3.5 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Schools Canvassed</span>
          <span className="text-base font-black text-white mt-0.5 block font-mono">{teamStats.totalTeamVisits}</span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-3.5 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Invoices Converted</span>
          <span className="text-base font-black text-purple-300 mt-0.5 block font-mono">{teamStats.totalTeamWon}</span>
        </div>
      </div>

      {/* Pay Calculation Logic & Tier Reference Info */}
      <div className="bg-murugan-card/70 border border-white/10 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-amber-400" />
            Invoice Pay Calculation & Tier Slabs
          </span>
          <span className="text-[11px] text-gray-400">
            For every converted invoice, canvasser receives <strong className="text-amber-400">active slab %</strong> of invoice total
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="p-2 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-semibold">Tier 1 (Up to ₹5L)</span>
            <span className="text-sm font-black text-amber-400 mt-0.5 block">1% per Invoice</span>
          </div>
          <div className="p-2 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-semibold">Tier 2 (₹5L - ₹10L)</span>
            <span className="text-sm font-black text-amber-400 mt-0.5 block">2% per Invoice</span>
          </div>
          <div className="p-2 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-semibold">Tier 3 (₹10L - ₹15L)</span>
            <span className="text-sm font-black text-amber-400 mt-0.5 block">3% per Invoice</span>
          </div>
          <div className="p-2 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-semibold">Tier 4 (₹15L - ₹20L)</span>
            <span className="text-sm font-black text-amber-400 mt-0.5 block">4% per Invoice</span>
          </div>
          <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/30 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-300 block font-semibold">Tier 5 (&gt; ₹20L)</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 block">5% Max Payout</span>
          </div>
        </div>
      </div>

      {/* Sorting Control Bar */}
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

      {/* Main Leaderboard Table & Expandable Invoice Details */}
      <div className="bg-murugan-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Canvasser Performance & Payout Rankings</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Sorted by <strong className="text-amber-400">{sortOptions.find(o => o.id === sortBy)?.label || 'Pay Earned'}</strong> ({sortOrder})
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {rankings.map((canvasser, idx) => {
            const isMe = canvasser.id === currentUser?.id;
            const isExpanded = expandedCanvasserId === canvasser.id;
            const invoicesList = canvasser.convertedInvoices || [];
            
            // Rank badge styling
            let rankBadge = (
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-300">
                #{canvasser.rank}
              </div>
            );
            if (canvasser.rank === 1) {
              rankBadge = (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center font-black text-black text-xs shadow-md shadow-amber-400/20">
                  🏆
                </div>
              );
            } else if (canvasser.rank === 2) {
              rankBadge = (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-300 to-gray-400 flex items-center justify-center font-black text-black text-xs shadow-md shadow-slate-300/20">
                  🥈
                </div>
              );
            } else if (canvasser.rank === 3) {
              rankBadge = (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-orange-800 flex items-center justify-center font-black text-white text-xs shadow-md shadow-amber-700/20">
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{canvasser.name}</span>
                          {isMe && (
                            <span className="text-[9px] font-black uppercase bg-amber-400 text-black px-1.5 py-0.5 rounded font-mono">
                              YOU
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                          {canvasser.commissionRate}% Slab
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <strong className="text-gray-200">{canvasser.schoolsCanvassed || canvasser.totalVisits}</strong> Schools Canvassed
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Receipt className="w-3 h-3 text-emerald-400" />
                          <strong className="text-emerald-300">{canvasser.invoicesConverted || canvasser.invoicesCount}</strong> Invoices Converted
                        </span>
                        <span>•</span>
                        <span className="text-gray-400">
                          Conversion: <strong className="text-purple-300">{canvasser.conversionRate || 0}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics & Pay Display */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-between w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Invoiced</span>
                      <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                        {canvasser.formattedInvoiced}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Pay Earned</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                        {canvasser.formattedPayEarned || canvasser.formattedCommission}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleExpand(canvasser.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                        isExpanded 
                          ? "bg-amber-400 text-black border-amber-300"
                          : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                      )}
                      title="Inspect converted invoices and pay calculation breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isExpanded ? 'Hide Pay Details' : 'View Pay Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Itemized Invoice Payout Breakdown */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-black/50 border-t border-white/10 px-4 py-3 space-y-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-300 pb-1">
                        <span className="font-bold flex items-center gap-1.5 text-amber-300">
                          <Receipt className="w-3.5 h-3.5" />
                          Converted Invoices & Pay Calculation Breakdown for {canvasser.name}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Active Slab Rate: <strong className="text-amber-400">{canvasser.commissionRate}%</strong> applied per converted invoice
                        </span>
                      </div>

                      {invoicesList.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2 italic">
                          No commercial invoices converted yet for this canvasser. Once visits turn into confirmed orders and invoices are generated, pay will appear here.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-white/5 text-gray-400 uppercase text-[9px] font-bold">
                              <tr>
                                <th className="py-2 px-3">Invoice ID</th>
                                <th className="py-2 px-3">School Institution</th>
                                <th className="py-2 px-3">District</th>
                                <th className="py-2 px-3 text-right">Invoice Value (₹)</th>
                                <th className="py-2 px-3 text-center">Slab Rate (%)</th>
                                <th className="py-2 px-3 text-right">Pay Earned (₹)</th>
                                <th className="py-2 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                              {invoicesList.map(inv => (
                                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-3 font-mono text-amber-400 font-bold">{inv.id}</td>
                                  <td className="py-2 px-3 text-white font-semibold">{inv.school_name}</td>
                                  <td className="py-2 px-3 text-gray-400">{inv.district || 'Tamil Nadu'}</td>
                                  <td className="py-2 px-3 text-right font-mono text-white">
                                    ₹{Number(inv.grand_total).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                      {inv.applied_rate}%
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                    {inv.formatted_pay || `₹${Number(inv.pay_earned).toLocaleString('en-IN')}`}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                      inv.payment_status === 'Paid' 
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    )}>
                                      {inv.payment_status || 'Invoiced'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {/* Total Footer Row */}
                              <tr className="bg-white/5 font-bold border-t border-white/10">
                                <td colSpan={3} className="py-2.5 px-3 text-gray-300 uppercase text-[10px]">
                                  Total Calculated Pay ({invoicesList.length} Invoices)
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                                  ₹{canvasser.totalInvoiced.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-3 text-center text-purple-300">
                                  {canvasser.commissionRate}%
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                                  {canvasser.formattedPayEarned || canvasser.formattedCommission}
                                </td>
                                <td className="py-2.5 px-3 text-center text-emerald-300 text-[10px]">
                                  Ready
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Commercial Rules Banner */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-gray-200 font-bold">How Invoice Conversion & Pay Works:</p>
          <p className="text-[11px] leading-relaxed">
            1. Whenever a school visit results in an order, the Admin issues an official Tax Invoice attributed to the field canvasser.
            <br />
            2. The canvasser’s total cumulative invoiced volume determines their active slab tier (1% to 5%).
            <br />
            3. For every invoice converted, the canvasser earns the percentage payout of that invoice. Compare team members above by Pay Earned, Schools Canvassed, Invoices Converted, or Total Billed Volume.
          </p>
        </div>
      </div>
    </div>
  );
}
