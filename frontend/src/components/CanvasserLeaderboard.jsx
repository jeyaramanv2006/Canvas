import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Award, TrendingUp, Users, Target, 
  Sparkles, ShieldCheck, Flame, ChevronUp, CheckCircle2,
  Receipt, Briefcase, Info, RefreshCw
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';

export default function CanvasserLeaderboard({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [currentUser]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await mockApi.getCanvasserLeaderboard();
      setData(res);
    } catch (e) {
      console.error("Failed loading leaderboard", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-murugan-accent" />
        <p className="text-xs text-gray-400 font-medium">Calculating team leaderboard rankings...</p>
      </div>
    );
  }

  const { rankings = [], teamStats = {} } = data || {};
  const myRank = rankings.find(r => r.id === currentUser?.id);
  const topLeader = rankings[0];
  const gapToLeader = topLeader && myRank && topLeader.id !== myRank.id 
    ? Math.max(0, topLeader.totalInvoiced - myRank.totalInvoiced)
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner: Logged In Canvasser Rank Status */}
      {myRank && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-murugan-card to-murugan-card border border-amber-500/40 shadow-xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
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
                <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-1.5">
                  <span>{myRank.badge}</span>
                  <span className="text-gray-500">•</span>
                  <span>{myRank.roleTitle}</span>
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Invoiced</span>
              <span className="text-lg font-black text-murugan-accent">{myRank.formattedInvoiced}</span>
            </div>
          </div>

          {/* Motivational gap note */}
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
            {myRank.rank === 1 ? (
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <CrownIcon className="w-4 h-4 text-amber-400" />
                You are leading the board! Keep closing those school deals.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Gap to #1 ({topLeader?.name}):</span>
                <strong className="text-white">₹{(gapToLeader / 100000).toFixed(2)}L</strong>
              </span>
            )}

            <span className="text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-xl">
              {myRank.totalVisits} visits logged
            </span>
          </div>
        </motion.div>
      )}

      {/* Team Aggregates Overview */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-murugan-card border border-white/10 p-3.5 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Team Invoiced</span>
          <span className="text-base sm:text-lg font-black text-amber-400 mt-0.5 block">{teamStats.formattedTeamInvoiced}</span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-3.5 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Visits</span>
          <span className="text-base sm:text-lg font-black text-white mt-0.5 block">{teamStats.totalTeamVisits}</span>
        </div>
        <div className="bg-murugan-card border border-white/10 p-3.5 rounded-2xl text-center shadow-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deals Won</span>
          <span className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 block">{teamStats.totalTeamWon}</span>
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="bg-murugan-card rounded-3xl border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-murugan-accent" />
            <h3 className="text-sm font-bold text-white">Canvasser Rankings</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Ranked by Invoiced Value</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {rankings.map((canvasser, idx) => {
            const isMe = canvasser.id === currentUser?.id;
            
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
              <motion.div
                key={canvasser.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
                  isMe 
                    ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20" 
                    : "bg-black/40 border-white/5 hover:border-white/15"
                )}
              >
                <div className="flex items-center gap-3">
                  {rankBadge}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{canvasser.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-black uppercase bg-amber-400 text-black px-1.5 py-0.5 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </h4>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      <span>{canvasser.totalVisits} Visits</span>
                      <span className="mx-1">•</span>
                      <span className="text-emerald-400">{canvasser.wonOrders} Deals Won</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-black text-murugan-accent block">
                    {canvasser.formattedInvoiced}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold block">
                    {canvasser.invoicesCount} Invoices
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Verified Data Banner & Admin attribution notice */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs text-gray-400">
        <ShieldCheck className="w-4 h-4 text-murugan-accent flex-shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-gray-200">How invoice totals are credited:</strong> When school visits turn into confirmed orders, the Admin generates the official Tax Invoice and attributes it to your account. Leaderboard ranks are updated live upon invoice issuance.
        </p>
      </div>
    </div>
  );
}

function CrownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
