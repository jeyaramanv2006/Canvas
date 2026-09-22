import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, AlertTriangle, CheckCircle2, Search, Filter,
  Phone, User, Building2, MapPin, ArrowRight, Sparkles, ExternalLink,
  ChevronRight, RefreshCw, Briefcase, Eye, CalendarCheck, Flame,
  AlertCircle, MessageSquare
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';
import ProductBadge from './ProductBadge';
import SchoolPortfolioModal from './SchoolPortfolioModal';

export default function FollowUpsPipelineModule({ currentUser }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('tomorrow'); // 'tomorrow', 'today', 'overdue', 'upcoming_week', 'all'
  const [selectedCanvasser, setSelectedCanvasser] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  // School Portfolio Modal
  const [portfolioSchool, setPortfolioSchool] = useState(null);
  const [inspectVisit, setInspectVisit] = useState(null);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getVisits();
      setVisits(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load visits for followups pipeline', e);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  // Date helpers (local time YYYY-MM-DD)
  const dateStrings = useMemo(() => {
    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const today = formatYMD(now);

    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    const tomorrow = formatYMD(tmrw);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const in7Days = formatYMD(nextWeek);

    return { today, tomorrow, in7Days, now };
  }, []);

  // Filter only visits that have a scheduled follow-up date
  const followUpVisits = useMemo(() => {
    return visits.filter(v => v.follow_up_date && typeof v.follow_up_date === 'string' && v.follow_up_date.trim() !== '');
  }, [visits]);

  // Compute Bucket Counts
  const bucketCounts = useMemo(() => {
    const { today, tomorrow, in7Days } = dateStrings;
    let counts = {
      tomorrow: 0,
      today: 0,
      overdue: 0,
      upcoming_week: 0,
      all: 0
    };

    followUpVisits.forEach(v => {
      const fDate = v.follow_up_date.slice(0, 10);
      counts.all++;

      if (fDate === tomorrow) {
        counts.tomorrow++;
      } else if (fDate === today) {
        counts.today++;
      } else if (fDate < today) {
        counts.overdue++;
      } else if (fDate > tomorrow && fDate <= in7Days) {
        counts.upcoming_week++;
      }
    });

    return counts;
  }, [followUpVisits, dateStrings]);

  // Distinct canvassers and districts for filter dropdowns
  const availableCanvassers = useMemo(() => {
    const list = Array.from(new Set(followUpVisits.map(v => v.canvasser_name).filter(Boolean)));
    return list.sort();
  }, [followUpVisits]);

  const availableDistricts = useMemo(() => {
    const list = Array.from(new Set(followUpVisits.map(v => v.district).filter(Boolean)));
    return list.sort();
  }, [followUpVisits]);

  // Filtered & Chronologically Sorted Visits
  const displayedFollowUps = useMemo(() => {
    const { today, tomorrow, in7Days } = dateStrings;
    const q = searchQuery.toLowerCase().trim();

    const filtered = followUpVisits.filter(v => {
      const fDate = v.follow_up_date.slice(0, 10);

      // Bucket filter
      if (selectedBucket === 'tomorrow' && fDate !== tomorrow) return false;
      if (selectedBucket === 'today' && fDate !== today) return false;
      if (selectedBucket === 'overdue' && fDate >= today) return false;
      if (selectedBucket === 'upcoming_week' && !(fDate > tomorrow && fDate <= in7Days)) return false;

      // Dropdown filters
      if (selectedCanvasser !== 'all' && v.canvasser_name !== selectedCanvasser) return false;
      if (selectedDistrict !== 'all' && v.district !== selectedDistrict) return false;

      // Text search
      if (q) {
        const matchesQ =
          (v.school_name || '').toLowerCase().includes(q) ||
          (v.canvasser_name || '').toLowerCase().includes(q) ||
          (v.district || '').toLowerCase().includes(q) ||
          (v.contact_person || '').toLowerCase().includes(q) ||
          (v.phone || '').toLowerCase().includes(q) ||
          (v.notes || '').toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      return true;
    });

    // Sort strictly chronologically by follow_up_date ASC (earliest dates first)
    return filtered.sort((a, b) => {
      const dateA = a.follow_up_date.slice(0, 10);
      const dateB = b.follow_up_date.slice(0, 10);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      // Secondary sort: Hot interest first
      const interestRank = { 'Hot': 1, 'Warm': 2, 'Cold': 3, 'Not Interested': 4 };
      const rankA = interestRank[a.interest_level] || 5;
      const rankB = interestRank[b.interest_level] || 5;
      return rankA - rankB;
    });
  }, [followUpVisits, selectedBucket, selectedCanvasser, selectedDistrict, searchQuery, dateStrings]);

  const getStatusBadge = (visit) => {
    const { today, tomorrow } = dateStrings;
    const fDate = visit.follow_up_date.slice(0, 10);

    if (fDate === tomorrow) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-400 text-black shadow-md shadow-amber-400/20 flex items-center gap-1.5 animate-pulse">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
          Due Tomorrow
        </span>
      );
    }
    if (fDate === today) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-500 text-white shadow-md shadow-rose-500/25 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          Due Today
        </span>
      );
    }
    if (fDate < today) {
      const diffDays = Math.max(1, Math.round((new Date(today) - new Date(fDate)) / (1000 * 60 * 60 * 24)));
      return (
        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Overdue by {diffDays} {diffDays === 1 ? 'day' : 'days'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
        <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
        Scheduled for {visit.follow_up_date}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#171822] via-[#14151c] to-[#121319] p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-wider">
              Field Coordination Center
            </span>
            <span className="text-xs text-gray-400">Chronological Priority Queue</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-amber-400" />
            Executive Priority Follow-ups
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Proactively monitor upcoming client commitments and tomorrow's pipeline meetings without having to search through historical visit records.
          </p>
        </div>

        <button
          onClick={loadVisits}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-amber-400")} />
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* KPI Bucket Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Due Tomorrow (Primary Focus) */}
        <button
          type="button"
          onClick={() => setSelectedBucket('tomorrow')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer",
            selectedBucket === 'tomorrow'
              ? "bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-400/10 ring-1 ring-amber-400/50"
              : "bg-[#161721] border-white/10 hover:border-amber-400/40"
          )}
        >
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <Clock className="w-4 h-4 text-amber-400" />
              Due Tomorrow
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300">
              Next Day
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2">{bucketCounts.tomorrow}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Visits scheduled for next day action</p>
        </button>

        {/* Due Today */}
        <button
          type="button"
          onClick={() => setSelectedBucket('today')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            selectedBucket === 'today'
              ? "bg-rose-500/15 border-rose-500 shadow-xl shadow-rose-500/10 ring-1 ring-rose-500/50"
              : "bg-[#161721] border-white/10 hover:border-rose-400/40"
          )}
        >
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Due Today
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-400/10 text-rose-300">
              Immediate
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2">{bucketCounts.today}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Commitments due before end of day</p>
        </button>

        {/* Overdue */}
        <button
          type="button"
          onClick={() => setSelectedBucket('overdue')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            selectedBucket === 'overdue'
              ? "bg-rose-500/15 border-rose-500 shadow-xl shadow-rose-500/10 ring-1 ring-rose-500/50"
              : "bg-[#161721] border-white/10 hover:border-rose-400/40"
          )}
        >
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold flex items-center gap-1.5 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Overdue Follow-ups
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-400/10 text-rose-300">
              Escalation
            </span>
          </div>
          <p className="text-3xl font-black text-rose-300 font-mono mt-2">{bucketCounts.overdue}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Missed follow-up deadlines</p>
        </button>

        {/* All Scheduled Follow-ups */}
        <button
          type="button"
          onClick={() => setSelectedBucket('all')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all cursor-pointer",
            selectedBucket === 'all'
              ? "bg-purple-500/15 border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/50"
              : "bg-[#161721] border-white/10 hover:border-purple-400/40"
          )}
        >
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold flex items-center gap-1.5 text-purple-400">
              <Calendar className="w-4 h-4 text-purple-400" />
              All Open Follow-ups
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-400/10 text-purple-300">
              Entire Pipeline
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2">{bucketCounts.all}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Total scheduled follow-ups logged</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#161721] p-3 rounded-2xl border border-white/10">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search school name, canvasser, phone, or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#121319] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCanvasser}
            onChange={e => setSelectedCanvasser(e.target.value)}
            className="w-full bg-[#121319] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Canvassers ({availableCanvassers.length})</option>
            {availableCanvassers.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="w-full bg-[#121319] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Districts ({availableDistricts.length})</option>
            {availableDistricts.map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Follow-up Queue Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-[#161721] rounded-3xl border border-white/10">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-gray-300">Loading Follow-up Commitments...</p>
          </div>
        ) : displayedFollowUps.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-[#161721] rounded-3xl border border-white/10">
            <CalendarCheck className="w-10 h-10 text-gray-500 mx-auto mb-2" />
            <p className="text-base font-bold text-white">No follow-ups found in this view</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {selectedBucket === 'tomorrow'
                ? "No visits are currently scheduled for tomorrow. Switch to 'All Open Follow-ups' or check other buckets above."
                : "No matching scheduled follow-ups based on the selected filters."}
            </p>
            {selectedBucket !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedBucket('all')}
                className="mt-3 px-4 py-2 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                View All Scheduled Follow-ups ({bucketCounts.all})
              </button>
            )}
          </div>
        ) : (
          displayedFollowUps.map(visit => {
            return (
              <div
                key={visit.id}
                className="p-5 rounded-3xl bg-gradient-to-br from-[#181924] via-[#14151d] to-[#101117] border border-white/10 hover:border-amber-400/30 transition-all shadow-lg space-y-3"
              >
                {/* Header Row: School Name & Urgency Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPortfolioSchool({ id: visit.master_school_id || visit.id, school_name: visit.school_name })}
                        className="text-base sm:text-lg font-black text-white hover:text-amber-400 transition text-left flex items-center gap-2 group cursor-pointer"
                        title="Click to view full school portfolio"
                      >
                        <span className="group-hover:underline">{visit.school_name}</span>
                        <Briefcase className="w-4 h-4 text-emerald-400 opacity-70 group-hover:opacity-100 shrink-0" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {visit.district} {visit.cluster_or_block ? `• ${visit.cluster_or_block}` : ''}
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-medium">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        Canvasser: <strong className="text-white">{visit.canvasser_name}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(visit)}

                    {/* Interest Level Pill */}
                    <span className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wide border",
                      visit.interest_level === 'Hot' ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                      visit.interest_level === 'Warm' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                      "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    )}>
                      {visit.interest_level === 'Hot' && <Flame className="w-3 h-3 inline mr-1 text-rose-400" />}
                      {visit.interest_level}
                    </span>
                  </div>
                </div>

                {/* Contact & Status Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-black/30 p-3 rounded-2xl border border-white/5 text-xs text-gray-300">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Decision Maker / Contact</span>
                    <p className="font-semibold text-white">{visit.contact_person || 'School Management'}</p>
                    {visit.phone && (
                      <a
                        href={`tel:${visit.phone}`}
                        className="text-amber-400 font-mono flex items-center gap-1 hover:underline text-[11px]"
                      >
                        <Phone className="w-3 h-3" /> {visit.phone}
                      </a>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Funnel Outcome</span>
                    <p className="font-semibold text-emerald-300">{visit.outcome_status || 'Open'}</p>
                    <p className="text-[10px] text-gray-400">
                      Logged: {new Date(visit.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Follow-up Target Date</span>
                    <p className="font-mono font-bold text-amber-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {visit.follow_up_date}
                    </p>
                  </div>
                </div>

                {/* Product Interests */}
                {Array.isArray(visit.product_interests) && visit.product_interests.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-400">Products Discussed:</span>
                    {visit.product_interests.map(p => (
                      <ProductBadge key={p} product={p} />
                    ))}
                  </div>
                )}

                {/* Meeting Notes */}
                {visit.notes && (
                  <p className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5 italic">
                    "{visit.notes}"
                  </p>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-gray-500">
                    Visit Ref #{visit.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {visit.phone && (
                      <a
                        href={`tel:${visit.phone}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>Call</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setPortfolioSchool({ id: visit.master_school_id || visit.id, school_name: visit.school_name })}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Briefcase className="w-3 h-3 text-amber-400" />
                      <span>School Portfolio</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* School Portfolio Modal */}
      {portfolioSchool && (
        <SchoolPortfolioModal
          isOpen={!!portfolioSchool}
          onClose={() => setPortfolioSchool(null)}
          schoolId={portfolioSchool.id}
          schoolName={portfolioSchool.school_name}
        />
      )}
    </div>
  );
}
