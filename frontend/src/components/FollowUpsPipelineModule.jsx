import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, AlertTriangle, CheckCircle2, Search, Filter,
  Phone, User, Building2, MapPin, ArrowRight, Sparkles, ExternalLink,
  ChevronRight, RefreshCw, Briefcase, Eye, CalendarCheck, Flame,
  AlertCircle, MessageSquare, Edit3, X, FileText, ChevronDown, Check,
  RotateCcw
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';
import ProductBadge from './ProductBadge';
import AestheticSelect from './AestheticSelect';
import AestheticDatePicker from './AestheticDatePicker';
import SchoolPortfolioModal from './SchoolPortfolioModal';
import EditVisitModal from './EditVisitModal';

export default function FollowUpsPipelineModule({ currentUser, canvasserScoped = false }) {
  const isCanvasser = canvasserScoped || ['canvasser', 'cvs'].includes((currentUser?.role || '').toLowerCase());
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('tomorrow'); // 'tomorrow', 'today', 'overdue', 'upcoming_week', 'all'
  const [selectedCanvasser, setSelectedCanvasser] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');

  // Modals & Action States
  const [rescheduleVisit, setRescheduleVisit] = useState(null);
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [isUpdatingFollowUp, setIsUpdatingFollowUp] = useState(false);
  const [portfolioSchool, setPortfolioSchool] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Lock body scroll and handle Escape key for reschedule modal
  useEffect(() => {
    if (rescheduleVisit) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setRescheduleVisit(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = orig;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [rescheduleVisit]);

  useEffect(() => {
    loadVisits();
  }, [currentUser, isCanvasser]);

  const loadVisits = async (force = false) => {
    setLoading(true);
    try {
      const params = isCanvasser && currentUser?.id ? { canvasser_id: currentUser.id } : {};
      const data = await mockApi.getVisits(params, { forceRefresh: force });
      let list = Array.isArray(data) ? data : [];
      if (isCanvasser && currentUser) {
        list = list.filter(v => 
          (v.canvasser_id !== null && v.canvasser_id !== undefined && String(v.canvasser_id) === String(currentUser.id)) ||
          (v.canvasser_name && currentUser.name && v.canvasser_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
        );
      }
      setVisits(list);
    } catch (e) {
      console.error('Failed to load visits for followups pipeline', e);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFollowUp = async (visitId, nextDateOrNull) => {
    setIsUpdatingFollowUp(true);
    try {
      await mockApi.updateVisit(visitId, { follow_up_date: nextDateOrNull }, currentUser);
      setActionSuccessMsg(nextDateOrNull ? `Follow-up rescheduled to ${nextDateOrNull}` : 'Follow-up marked as Done / Cleared');
      setTimeout(() => setActionSuccessMsg(null), 3000);
      setRescheduleVisit(null);
      await loadVisits();
    } catch (err) {
      alert(err.message || 'Failed to update follow-up date');
    } finally {
      setIsUpdatingFollowUp(false);
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
      
      // All open counts upcoming and current follow-ups (not overdue)
      if (fDate >= today) {
        counts.all++;
      }

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

  // Options for AestheticSelect dropdowns
  const canvasserOptions = useMemo(() => [
    { id: 'all', label: `All Canvassers (${availableCanvassers.length})` },
    ...availableCanvassers.map(name => ({ id: name, label: name }))
  ], [availableCanvassers]);

  const districtOptions = useMemo(() => [
    { id: 'all', label: `All Districts (${availableDistricts.length})` },
    ...availableDistricts.map(dist => ({ id: dist, label: dist }))
  ], [availableDistricts]);

  const interestOptions = useMemo(() => [
    { id: 'all', label: 'All Interest Levels' },
    { id: 'Hot', label: '🔥 Hot' },
    { id: 'Warm', label: '⚡ Warm' },
    { id: 'Cold', label: '❄️ Cold' },
    { id: 'Not Interested', label: 'Not Interested' }
  ], []);

  // Filtered & Chronologically Sorted Visits
  const displayedFollowUps = useMemo(() => {
    const { today, tomorrow, in7Days } = dateStrings;
    const q = searchQuery.toLowerCase().trim();

    const filtered = followUpVisits.filter(v => {
      const fDate = v.follow_up_date.slice(0, 10);

      // Bucket filter: 'all' shows open follow-ups not yet expired; 'overdue' shows past dates only
      if (selectedBucket === 'all' && fDate < today) return false;
      if (selectedBucket === 'tomorrow' && fDate !== tomorrow) return false;
      if (selectedBucket === 'today' && fDate !== today) return false;
      if (selectedBucket === 'overdue' && fDate >= today) return false;
      if (selectedBucket === 'upcoming_week' && !(fDate > tomorrow && fDate <= in7Days)) return false;

      // Dropdown filters
      if (selectedCanvasser !== 'all' && v.canvasser_name !== selectedCanvasser) return false;
      if (selectedDistrict !== 'all' && v.district !== selectedDistrict) return false;
      if (selectedInterest !== 'all' && (v.interest_level || '').toLowerCase() !== selectedInterest.toLowerCase()) return false;

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
  }, [followUpVisits, selectedBucket, selectedCanvasser, selectedDistrict, selectedInterest, searchQuery, dateStrings]);

  const hasActiveFilters = searchQuery || selectedCanvasser !== 'all' || selectedDistrict !== 'all' || selectedInterest !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCanvasser('all');
    setSelectedDistrict('all');
    setSelectedInterest('all');
  };

  const getStatusBadge = (visit) => {
    const { today, tomorrow } = dateStrings;
    const fDate = visit.follow_up_date.slice(0, 10);

    if (fDate === tomorrow) {
      return (
        <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-400 text-black shadow-md shadow-amber-400/20 flex items-center gap-1.5 animate-pulse">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
          Due Tomorrow
        </span>
      );
    }
    if (fDate === today) {
      return (
        <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-500 text-white shadow-md shadow-rose-500/25 flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          Due Today
        </span>
      );
    }
    if (fDate < today) {
      const diffDays = Math.max(1, Math.round((new Date(today) - new Date(fDate)) / (1000 * 60 * 60 * 24)));
      return (
        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Overdue by {diffDays} {diffDays === 1 ? 'day' : 'days'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
        <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
        Scheduled for {visit.follow_up_date}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner with Luminous Catch ── */}
      <div className="bg-gradient-to-r from-[#14151f]/95 via-[#0e1017]/90 to-[#0c0d15]/90 p-5 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl relative overflow-hidden backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Luminous Top Catch Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="absolute right-0 top-0 w-72 h-72 bg-amber-500/[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/10 text-amber-300 border border-amber-400/25 tracking-wider">
              {isCanvasser ? "Field Priority Queue" : "Executive Follow-ups Pipeline"}
            </span>
            <span className="text-[11px] text-white/40 font-mono">Live Timeline</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <CalendarCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Priority Follow-ups &amp; Commitments</span>
          </h2>
          <p className="text-xs text-white/55 mt-1 max-w-xl leading-relaxed">
            {isCanvasser 
              ? "Your scheduled client callback queue. Review tomorrow's priorities and update visit commitments."
              : "High-priority institutional client commitments across all canvassers and districts."}
          </p>
        </div>

        <button
          onClick={() => loadVisits(true)}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white border border-white/[0.1] hover:border-amber-400/30 text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer backdrop-blur-md relative z-10 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", loading && "animate-spin")} />
          <span>{loading ? "Syncing..." : "Sync Pipeline"}</span>
        </button>
      </div>

      {/* ── KPI Pipeline Bucket Tabs (5 Interactive Queues) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Due Tomorrow (Primary Focus) */}
        <button
          type="button"
          onClick={() => setSelectedBucket('tomorrow')}
          className={cn(
            "p-4 rounded-3xl border text-left transition-all duration-200 relative overflow-hidden cursor-pointer backdrop-blur-xl group",
            selectedBucket === 'tomorrow'
              ? "bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-400/15 ring-1 ring-amber-400/50 scale-[1.01]"
              : "bg-[#0c0d15]/85 border-white/[0.08] hover:border-amber-400/40 hover:bg-[#121420]/85"
          )}
        >
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Due Tomorrow
            </span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25">
              Next Day
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2.5 group-hover:text-amber-300 transition-colors">
            {bucketCounts.tomorrow}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 font-medium">Tomorrow's commitments</p>
        </button>

        {/* 2. Due Today */}
        <button
          type="button"
          onClick={() => setSelectedBucket('today')}
          className={cn(
            "p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer backdrop-blur-xl group",
            selectedBucket === 'today'
              ? "bg-rose-500/15 border-rose-500 shadow-xl shadow-rose-500/15 ring-1 ring-rose-500/50 scale-[1.01]"
              : "bg-[#0c0d15]/85 border-white/[0.08] hover:border-rose-400/40 hover:bg-[#121420]/85"
          )}
        >
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Due Today
            </span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-400/15 text-rose-300 border border-rose-400/25">
              Urgent
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2.5 group-hover:text-rose-300 transition-colors">
            {bucketCounts.today}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 font-medium">Action before day-end</p>
        </button>

        {/* 3. Overdue */}
        <button
          type="button"
          onClick={() => setSelectedBucket('overdue')}
          className={cn(
            "p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer backdrop-blur-xl group",
            selectedBucket === 'overdue'
              ? "bg-red-500/15 border-red-500 shadow-xl shadow-red-500/15 ring-1 ring-red-500/50 scale-[1.01]"
              : "bg-[#0c0d15]/85 border-white/[0.08] hover:border-red-400/40 hover:bg-[#121420]/85"
          )}
        >
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-bold flex items-center gap-1.5 text-red-300">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              Overdue
            </span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-400/15 text-red-300 border border-red-400/25">
              Pending
            </span>
          </div>
          <p className="text-3xl font-black text-red-400 font-mono mt-2.5">
            {bucketCounts.overdue}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 font-medium">Past target deadline</p>
        </button>

        {/* 4. Next 7 Days */}
        <button
          type="button"
          onClick={() => setSelectedBucket('upcoming_week')}
          className={cn(
            "p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer backdrop-blur-xl group",
            selectedBucket === 'upcoming_week'
              ? "bg-indigo-500/15 border-indigo-400 shadow-xl shadow-indigo-400/15 ring-1 ring-indigo-400/50 scale-[1.01]"
              : "bg-[#0c0d15]/85 border-white/[0.08] hover:border-indigo-400/40 hover:bg-[#121420]/85"
          )}
        >
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-bold flex items-center gap-1.5 text-indigo-300">
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
              Next 7 Days
            </span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-400/15 text-indigo-300 border border-indigo-400/25">
              Week
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2.5 group-hover:text-indigo-300 transition-colors">
            {bucketCounts.upcoming_week}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 font-medium">Rolling week commitments</p>
        </button>

        {/* 5. All Scheduled Follow-ups */}
        <button
          type="button"
          onClick={() => setSelectedBucket('all')}
          className={cn(
            "p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer backdrop-blur-xl group col-span-2 sm:col-span-1",
            selectedBucket === 'all'
              ? "bg-purple-500/15 border-purple-500 shadow-xl shadow-purple-500/15 ring-1 ring-purple-500/50 scale-[1.01]"
              : "bg-[#0c0d15]/85 border-white/[0.08] hover:border-purple-400/40 hover:bg-[#121420]/85"
          )}
        >
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="font-bold flex items-center gap-1.5 text-purple-400">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              All Open
            </span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-400/15 text-purple-300 border border-purple-400/25">
              Total
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2.5 group-hover:text-purple-300 transition-colors">
            {bucketCounts.all}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 font-medium">All active follow-ups</p>
        </button>
      </div>

      {/* ── Multi-Filter and Search Command Bar ── */}
      <div className="bg-[#0c0d15]/85 p-3.5 sm:p-4 rounded-3xl border border-white/[0.08] shadow-xl backdrop-blur-xl relative z-30 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Text Search Input */}
          <div className={cn("relative", isCanvasser ? "sm:col-span-6 lg:col-span-6" : "sm:col-span-6 lg:col-span-4")}>
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isCanvasser ? "Search school, contact person, or phone..." : "Search school, canvasser, contact, or notes..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.06] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Canvasser Filter (Admin & CEO Only) */}
          {!isCanvasser && (
            <div className="sm:col-span-6 lg:col-span-3">
              <AestheticSelect
                value={selectedCanvasser}
                onChange={setSelectedCanvasser}
                options={canvasserOptions}
                searchable
                size="md"
                placeholder="All Canvassers"
                dropdownClassName="z-[1000] left-0 min-w-[220px]"
              />
            </div>
          )}

          {/* District Filter */}
          <div className={cn(isCanvasser ? "sm:col-span-6 lg:col-span-3" : "sm:col-span-6 lg:col-span-3")}>
            <AestheticSelect
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              options={districtOptions}
              searchable
              size="md"
              placeholder="All Districts"
              dropdownClassName="z-[1000] right-0 min-w-[210px]"
            />
          </div>

          {/* Interest Level Filter */}
          <div className={cn(isCanvasser ? "sm:col-span-6 lg:col-span-3" : "sm:col-span-6 lg:col-span-2")}>
            <AestheticSelect
              value={selectedInterest}
              onChange={setSelectedInterest}
              options={interestOptions}
              size="md"
              placeholder="All Interests"
              dropdownClassName="z-[1000] right-0 min-w-[190px]"
            />
          </div>
        </div>

        {/* Filter Summary & Quick Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs text-white/50">
            <span className="font-medium">
              Showing <strong className="text-white font-bold">{displayedFollowUps.length}</strong> matching commitments
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2.5 backdrop-blur-xl shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ── Follow-up Queue Cards ── */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-24 text-center space-y-3 bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08] backdrop-blur-2xl">
            <RefreshCw className="w-7 h-7 animate-spin text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-white">Loading Priority Commitments…</p>
            <p className="text-xs text-white/40">Synchronizing live visits database</p>
          </div>
        ) : displayedFollowUps.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08] backdrop-blur-2xl p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-white">No follow-ups found in this view</p>
            <p className="text-xs text-white/45 max-w-md mx-auto leading-relaxed">
              {selectedBucket === 'tomorrow'
                ? "No visits are currently scheduled for tomorrow. Switch to 'All Open' or check other pipeline buckets above."
                : hasActiveFilters
                ? "No scheduled commitments matched your current filter criteria."
                : "No matching scheduled follow-ups."}
            </p>
            {(selectedBucket !== 'all' || hasActiveFilters) && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {selectedBucket !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedBucket('all')}
                    className="px-4 py-2 bg-amber-400 text-black hover:bg-amber-300 rounded-xl text-xs font-black shadow-md shadow-amber-400/20 transition cursor-pointer"
                  >
                    View All Active ({bucketCounts.all})
                  </button>
                )}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          displayedFollowUps.map(visit => {
            const rawPhone = (visit.phone || '').trim();
            const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
            const hasValidPhone = cleanDigits.length >= 10;
            const waLink = hasValidPhone ? `https://wa.me/91${cleanDigits.slice(-10)}` : null;

            return (
              <div
                key={visit.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#0c0d15]/85 border border-white/[0.08] hover:border-amber-400/35 transition-all duration-200 shadow-xl backdrop-blur-2xl space-y-4 hover:shadow-2xl hover:scale-[1.003] group relative overflow-hidden"
              >
                {/* Luminous Top Catch Rim */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />

                {/* Header Row: School Name, Badges & Urgency */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 
                        onClick={() => !isCanvasser && setPortfolioSchool({
                          id: visit.master_school_id || visit.school_id || visit.id,
                          school_name: visit.school_name
                        })}
                        className={cn(
                          "text-base sm:text-lg font-black text-white text-left tracking-tight",
                          !isCanvasser ? "group-hover:text-amber-200 transition-colors cursor-pointer hover:underline" : "cursor-default"
                        )}
                        title={!isCanvasser ? "Click to view full school history" : undefined}
                      >
                        {visit.school_name}
                      </h3>
                      {visit.is_from_master_db && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          🏛️ Master DB
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                      <span className="flex items-center gap-1.5 text-white/70">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{visit.district} {visit.cluster_or_block ? `• ${visit.cluster_or_block}` : ''}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                        <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Canvasser: <strong className="text-white font-bold">{visit.canvasser_name}</strong></span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {getStatusBadge(visit)}

                    {/* Interest Level Pill with Glow */}
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide border flex items-center gap-1",
                      visit.interest_level === 'Hot' ? "bg-rose-500/20 text-rose-300 border-rose-500/35 shadow-sm shadow-rose-500/20" :
                      visit.interest_level === 'Warm' ? "bg-amber-500/20 text-amber-300 border-amber-500/35 shadow-sm shadow-amber-500/10" :
                      "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    )}>
                      {visit.interest_level === 'Hot' && <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
                      {visit.interest_level === 'Warm' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{visit.interest_level || 'Open'}</span>
                    </span>
                  </div>
                </div>

                {/* Contact & Status Details (Inset Glass Bar) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-black/35 p-3 sm:p-3.5 rounded-2xl border border-white/[0.06] text-xs text-white/70">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Key Contact</span>
                    <p className="font-bold text-white truncate">{visit.contact_person || 'School Management'}</p>
                    {rawPhone ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`tel:${cleanDigits}`}
                          className="text-amber-400 font-mono font-bold flex items-center gap-1 hover:underline text-[11px]"
                        >
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{rawPhone}</span>
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-white/30 italic">No phone recorded</span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Pipeline Stage</span>
                    <p className="font-bold text-emerald-300">{visit.outcome_status || 'Open'}</p>
                    <p className="text-[10px] text-white/40 mt-0.5 font-mono">
                      Logged: {new Date(visit.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Target Due Date</span>
                    <p className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{visit.follow_up_date}</span>
                    </p>
                  </div>
                </div>

                {/* Product Interests */}
                {Array.isArray(visit.product_interests) && visit.product_interests.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-wide">Interests:</span>
                    {visit.product_interests.map(p => (
                      <ProductBadge key={p} product={p} />
                    ))}
                  </div>
                )}

                {/* Meeting Notes */}
                {visit.notes && (
                  <div className="p-3 bg-white/[0.025] rounded-xl border-l-2 border-amber-400/60 border border-white/[0.06] text-xs text-white/80 italic leading-relaxed">
                    "{visit.notes}"
                  </div>
                )}

                {/* ── Action Buttons Footer ── */}
                <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/35">
                    <span>Ref #{visit.id}</span>
                    {visit.master_school_id && <span>· MSID #{visit.master_school_id}</span>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Call Button */}
                    {rawPhone && (
                      <a
                        href={`tel:${cleanDigits}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
                        title="Call contact"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call</span>
                      </a>
                    )}

                    {/* WhatsApp Quick Link */}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-green-600/15 hover:bg-green-600/25 text-green-300 border border-green-600/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
                        title="Open WhatsApp chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* School Portfolio Action (Admin & CEO Only) */}
                    {!isCanvasser && (
                      <button
                        type="button"
                        onClick={() => setPortfolioSchool({
                          id: visit.master_school_id || visit.school_id || visit.id,
                          school_name: visit.school_name
                        })}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
                        title="Inspect complete school institutional portfolio"
                      >
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Portfolio</span>
                      </button>
                    )}

                    {/* Edit Visit Action */}
                    <button
                      type="button"
                      onClick={() => setEditingVisit(visit)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
                      title="Edit visit notes, products, or stage"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Edit Visit</span>
                    </button>

                    {/* Reschedule Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleVisit(visit);
                        setNewFollowUpDate(visit.follow_up_date || '');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black text-xs font-black shadow-md shadow-amber-400/20 transition flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                      title="Reschedule follow-up target date or mark as done"
                    >
                      <Calendar className="w-3.5 h-3.5 text-black" />
                      <span>Reschedule</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Viewport-Centered Reschedule / Done Modal via Portal ── */}
      {rescheduleVisit && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={() => setRescheduleVisit(null)}
        >
          <div
            className="bg-[#0c0d15]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 my-auto relative overflow-visible"
            onClick={e => e.stopPropagation()}
          >
            {/* Luminous Top Catch Rim */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight">Reschedule Follow-up</h3>
                  <p className="text-[11px] text-white/50 font-medium truncate max-w-[280px]">{rescheduleVisit.school_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleVisit(null)}
                className="text-white/40 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white/70 flex items-center justify-between">
              <span className="text-white/40 font-medium">Current Date:</span>
              <span className="font-mono font-bold text-amber-400">
                {rescheduleVisit.follow_up_date || 'No Date Assigned'}
              </span>
            </div>

            {/* Custom Aesthetic Date Picker */}
            <div className="space-y-1">
              <AestheticDatePicker
                value={newFollowUpDate}
                onChange={setNewFollowUpDate}
                label="New Target Date"
                placeholder="Choose calendar date..."
                allowClear={true}
              />
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                disabled={isUpdatingFollowUp}
                onClick={() => handleUpdateFollowUp(rescheduleVisit.id, null)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Mark follow-up as complete"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Mark Done</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setRescheduleVisit(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isUpdatingFollowUp || !newFollowUpDate}
                  onClick={() => handleUpdateFollowUp(rescheduleVisit.id, newFollowUpDate)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black text-xs font-black shadow-md shadow-amber-400/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isUpdatingFollowUp ? 'Saving…' : 'Save Date'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Institutional School Portfolio Modal ── */}
      {portfolioSchool && (
        <SchoolPortfolioModal
          isOpen={Boolean(portfolioSchool)}
          onClose={() => setPortfolioSchool(null)}
          schoolId={portfolioSchool.id}
          schoolName={portfolioSchool.school_name}
        />
      )}

      {/* ── Edit Visit Modal ── */}
      {editingVisit && (
        <EditVisitModal
          isOpen={Boolean(editingVisit)}
          onClose={() => setEditingVisit(null)}
          visit={editingVisit}
          isManager={!isCanvasser}
          onSave={async (updatedData) => {
            try {
              await mockApi.updateVisit(editingVisit.id, updatedData, currentUser);
              setActionSuccessMsg('Visit details updated successfully');
              setTimeout(() => setActionSuccessMsg(null), 3000);
              setEditingVisit(null);
              await loadVisits();
            } catch (err) {
              alert(err.message || 'Failed to update visit');
            }
          }}
          onDelete={async (visitId) => {
            try {
              await mockApi.deleteVisit(visitId, currentUser);
              setActionSuccessMsg('Visit record removed');
              setTimeout(() => setActionSuccessMsg(null), 3000);
              setEditingVisit(null);
              await loadVisits();
            } catch (err) {
              alert(err.message || 'Failed to delete visit');
            }
          }}
        />
      )}
    </div>
  );
}
