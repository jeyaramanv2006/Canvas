import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Users, Search, Filter, Edit3, Trash2, Phone, MapPin, 
  CheckCircle2, Receipt, History, FileText, Camera, X, RefreshCw,
  Calendar, User, Clock, RotateCcw, Sparkles, AlertCircle
} from 'lucide-react';
import { mockApi } from '../mockApi';
import EditVisitModal from './EditVisitModal';
import EditHistoryModal from './EditHistoryModal';
import InvoiceDocumentModal from './InvoiceDocumentModal';
import ProductBadge from './ProductBadge';
import VerifySchoolDiscoveryModal from './VerifySchoolDiscoveryModal';
import AestheticSelect from './AestheticSelect';
import { cn } from '../lib/utils';

export default function FieldVisitRegistry({ currentUser }) {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCanvasser, setSelectedCanvasser] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');

  // Modals & Lightbox
  const [editingVisit, setEditingVisit] = useState(null);
  const [inspectHistoryVisit, setInspectHistoryVisit] = useState(null);
  const [verifyDiscoveryVisit, setVerifyDiscoveryVisit] = useState(null);
  const [docModalVisit, setDocModalVisit] = useState(null);
  const [docModalType, setDocModalType] = useState('quote');
  const [previewImage, setPreviewImage] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Lock body scroll when image preview is open
  useEffect(() => {
    if (previewImage) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [previewImage]);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const [statsData, visitsData] = await Promise.all([
        mockApi.getDashboardStats({ forceRefresh: force }).catch(() => null),
        mockApi.getVisits({}, { forceRefresh: force }).catch(() => [])
      ]);
      setStats(statsData);
      setVisits(Array.isArray(visitsData) ? visitsData : []);
    } catch (e) {
      console.error("Failed loading field visits", e);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisit = async (id, updatedData) => {
    await mockApi.updateVisit(id, updatedData, currentUser);
    showToast("Visit updated successfully!");
    await loadData(true);
  };

  const handleDeleteVisit = async (id) => {
    await mockApi.deleteVisit(id);
    showToast("Visit deleted successfully!");
    await loadData(true);
  };

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (v.school_name || '').toLowerCase().includes(q) ||
        (v.district || '').toLowerCase().includes(q) ||
        (v.contact_person || '').toLowerCase().includes(q) ||
        (v.canvasser_name || '').toLowerCase().includes(q) ||
        (v.notes || '').toLowerCase().includes(q) ||
        (v.id && String(v.id).toLowerCase().includes(q));

      const matchesDistrict = selectedDistrict === 'all' || v.district === selectedDistrict;
      const matchesCanvasser = selectedCanvasser === 'all' || String(v.canvasser_id) === String(selectedCanvasser);
      const matchesInterest = selectedInterest === 'all' || v.interest_level === selectedInterest;
      const matchesStatus = selectedStatus === 'all' || v.outcome_status === selectedStatus;
      const matchesOrigin = selectedOrigin === 'all' || 
        (selectedOrigin === 'master' && v.is_from_master_db && v.discovery_status !== 'LINKED_EXISTING') ||
        (selectedOrigin === 'custom' && !v.is_from_master_db) ||
        (selectedOrigin === 'pending' && (!v.is_from_master_db || v.discovery_status === 'PENDING_VERIFICATION')) ||
        (selectedOrigin === 'verified_new' && v.discovery_status === 'VERIFIED_NEW') ||
        (selectedOrigin === 'linked_typo' && v.discovery_status === 'LINKED_EXISTING');

      return matchesSearch && matchesDistrict && matchesCanvasser && matchesInterest && matchesStatus && matchesOrigin;
    });
  }, [visits, searchQuery, selectedDistrict, selectedCanvasser, selectedInterest, selectedStatus, selectedOrigin]);

  const handleExportCSV = () => {
    mockApi.exportToCSV(filteredVisits);
    showToast(`Exported ${filteredVisits.length} records to CSV`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('all');
    setSelectedCanvasser('all');
    setSelectedInterest('all');
    setSelectedStatus('all');
    setSelectedOrigin('all');
  };

  const hasActiveFilters = searchQuery || selectedDistrict !== 'all' || selectedCanvasser !== 'all' || selectedInterest !== 'all' || selectedStatus !== 'all' || selectedOrigin !== 'all';

  const uniqueDistricts = useMemo(() => {
    return Array.from(new Set(visits.map(v => v.district).filter(Boolean))).sort();
  }, [visits]);

  const uniqueCanvassers = useMemo(() => {
    if (stats?.canvasserStats && stats.canvasserStats.length > 0) {
      return stats.canvasserStats;
    }
    return Array.from(
      new Map(
        visits
          .filter(v => v.canvasser_id)
          .map(v => [v.canvasser_id, { id: v.canvasser_id, name: v.canvasser_name || `Canvasser ${v.canvasser_id}` }])
      ).values()
    );
  }, [stats, visits]);

  // Filter Dropdown Options
  const originOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'pending', label: '⏳ Pending Verification' },
    { value: 'verified_new', label: '✨ Verified New (+Bonus)' },
    { value: 'linked_typo', label: '🔗 Linked Typo to Master' },
    { value: 'master', label: '🏛️ Original Master DB' },
    { value: 'custom', label: '🆕 All Non-Master' }
  ];

  const districtOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Districts' },
      ...uniqueDistricts.map(d => ({ value: d, label: d }))
    ];
  }, [uniqueDistricts]);

  const canvasserOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Canvassers' },
      ...uniqueCanvassers.map(c => ({ value: String(c.id), label: c.name }))
    ];
  }, [uniqueCanvassers]);

  const interestOptions = [
    { value: 'all', label: 'All Interests' },
    { value: 'Hot', label: '🔥 Hot' },
    { value: 'Warm', label: '⚡ Warm' },
    { value: 'Cold', label: '❄️ Cold' },
    { value: 'Not Interested', label: '⛔ Not Interested' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Outcomes' },
    { value: 'Open', label: 'Open' },
    { value: 'Sample Sent', label: 'Sample Sent' },
    { value: 'Quote Given', label: 'Quote Given' },
    { value: 'Won', label: 'Won' },
    { value: 'Lost', label: 'Lost' },
    { value: 'Not Interested', label: 'Not Interested' }
  ];

  if (loading && visits.length === 0) {
    return (
      <div className="py-20 text-center space-y-3 bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08] p-8 shadow-xl backdrop-blur-2xl">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
        <p className="text-sm font-bold text-white/80">Loading central field visit registry...</p>
        <p className="text-xs text-white/40">Fetching institutional visits, specifications, and media attachments</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 selection:bg-amber-400 selection:text-black">
      {/* ── TOP HEADER & TELEMETRY ───────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#14151f]/95 via-[#0e1017]/90 to-[#0c0d15]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-black font-black shadow-lg shadow-amber-400/20 shrink-0">
              <History className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Central Field Visit Registry
                </h3>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Showing <strong className="text-white font-mono">{filteredVisits.length}</strong> visits matching filters (<strong className="text-white/80 font-mono">{visits.length}</strong> total)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-white/[0.1] hover:border-amber-400/30 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Sync and pull latest visits from live database"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", loading && "animate-spin")} />
              <span>{loading ? "Syncing..." : "Sync Visits"}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-400/20 transition whitespace-nowrap cursor-pointer active:scale-95"
              title="Export filtered visits to CSV"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH & 5 FILTERS COMMAND BAR ───────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-2xl relative z-30 space-y-3">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />

        {/* Row 1: Full-Width Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search school, district, notes, canvasser..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl pl-10 pr-9 text-xs text-white placeholder:text-white/40 focus:outline-none transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-md transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: 5 Equal-Width Filter Selectors - ample space so no label is truncated */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="relative focus-within:z-40">
            <AestheticSelect
              value={selectedOrigin}
              onChange={setSelectedOrigin}
              options={originOptions}
              placeholder="All Sources"
              size="sm"
              buttonClassName="min-h-[42px] bg-black/40 border-white/[0.1] hover:border-white/20 font-medium"
            />
          </div>

          <div className="relative focus-within:z-40">
            <AestheticSelect
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              options={districtOptions}
              searchable={true}
              placeholder="All Districts"
              size="sm"
              icon={MapPin}
              buttonClassName="min-h-[42px] bg-black/40 border-white/[0.1] hover:border-white/20 font-medium"
            />
          </div>

          <div className="relative focus-within:z-40">
            <AestheticSelect
              value={selectedCanvasser}
              onChange={setSelectedCanvasser}
              options={canvasserOptions}
              searchable={true}
              placeholder="All Canvassers"
              size="sm"
              icon={Users}
              buttonClassName="min-h-[42px] bg-black/40 border-white/[0.1] hover:border-white/20 font-medium"
            />
          </div>

          <div className="relative focus-within:z-40">
            <AestheticSelect
              value={selectedInterest}
              onChange={setSelectedInterest}
              options={interestOptions}
              placeholder="All Interests"
              size="sm"
              buttonClassName="min-h-[42px] bg-black/40 border-white/[0.1] hover:border-white/20 font-medium"
            />
          </div>

          <div className="col-span-2 sm:col-span-1 relative focus-within:z-40">
            <AestheticSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
              placeholder="All Outcomes"
              size="sm"
              buttonClassName="min-h-[42px] bg-black/40 border-white/[0.1] hover:border-white/20 font-medium"
            />
          </div>
        </div>

        {/* Filter Reset pill bar if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-white/[0.06] flex-wrap gap-2">
            <div className="flex items-center gap-2 text-white/50 text-[11px] flex-wrap">
              <span className="font-bold text-white">Active Filters:</span>
              {searchQuery && (
                <span className="bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                  "{searchQuery}"
                </span>
              )}
              {selectedOrigin !== 'all' && (
                <span className="bg-white/10 text-white/80 border border-white/20 px-2 py-0.5 rounded-full font-mono">
                  Origin: {originOptions.find(o => o.value === selectedOrigin)?.label || selectedOrigin}
                </span>
              )}
              {selectedDistrict !== 'all' && (
                <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  District: {selectedDistrict}
                </span>
              )}
              {selectedCanvasser !== 'all' && (
                <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  Canvasser: {canvasserOptions.find(c => c.value === selectedCanvasser)?.label || selectedCanvasser}
                </span>
              )}
              {selectedInterest !== 'all' && (
                <span className="bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                  Interest: {selectedInterest}
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Outcome: {selectedStatus}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ── VISITS LIST (CANVASSER "MY VISITS" CARD AESTHETIC) ─────────────── */}
      {filteredVisits.length === 0 ? (
        <div className="bg-[#0c0d15]/85 p-12 rounded-3xl border border-white/[0.08] text-center space-y-2 backdrop-blur-2xl">
          <History className="w-8 h-8 text-white/20 mx-auto" />
          <p className="text-sm font-bold text-white/80">No field visits matched the current criteria.</p>
          <p className="text-xs text-white/40">Try resetting filters or adjusting search parameters.</p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredVisits.map((visit) => {
            const isOverdue = visit.follow_up_date && new Date(visit.follow_up_date) < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08] hover:border-amber-400/30 p-5 sm:p-6 transition-all duration-300 relative overflow-hidden backdrop-blur-2xl shadow-xl space-y-3.5 group"
              >
                {/* Luminous Top Catch Rim */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

                {/* 1. Header: School Name, Origin • Dot, and • Interest | Outcome (matching attached screenshot) */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-base text-white tracking-tight leading-snug">
                      {visit.school_name}
                    </h4>

                    {/* Origin / Discovery Badge (format: • Verified DB / • New Discovery) */}
                    {visit.is_from_master_db ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>Verified DB</span>
                      </span>
                    ) : (
                      <span 
                        onClick={() => {
                          if (visit.discovery_status === 'PENDING_VERIFICATION') {
                            setVerifyDiscoveryVisit(visit);
                          }
                        }}
                        className={cn(
                          "text-xs font-semibold text-amber-400 flex items-center gap-1.5",
                          visit.discovery_status === 'PENDING_VERIFICATION' && "cursor-pointer hover:underline"
                        )}
                        title={visit.discovery_status === 'PENDING_VERIFICATION' ? "Click to verify discovery" : undefined}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>New Discovery</span>
                      </span>
                    )}
                  </div>

                  {/* Top Right: • Interest | Outcome Status (exact format of attached image) */}
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {/* Interest Level */}
                    <span className={cn(
                      "flex items-center gap-1.5 font-bold tracking-wide",
                      visit.interest_level === 'Hot' ? 'text-rose-400' :
                      visit.interest_level === 'Warm' ? 'text-amber-400' :
                      visit.interest_level === 'Cold' ? 'text-blue-400' : 'text-white/40'
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        visit.interest_level === 'Hot' ? 'bg-rose-400 animate-pulse' :
                        visit.interest_level === 'Warm' ? 'bg-amber-400' :
                        visit.interest_level === 'Cold' ? 'bg-blue-400' : 'bg-white/40'
                      )} />
                      <span>{visit.interest_level || 'Open'}</span>
                    </span>

                    <span className="text-white/20 select-none">|</span>

                    {/* Outcome Status */}
                    <span className={cn(
                      "font-bold tracking-tight",
                      visit.outcome_status === 'Won' ? 'text-emerald-400' :
                      visit.outcome_status === 'Lost' ? 'text-rose-400' :
                      'text-purple-300'
                    )}>
                      {visit.outcome_status || 'Open'}
                    </span>
                  </div>
                </div>

                {/* Subtitle: District · Board / Type · Student Strength */}
                <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
                  <span>{visit.district}</span>
                  {visit.board ? (
                    <>
                      <span className="text-white/20">·</span>
                      <span>{visit.board}</span>
                    </>
                  ) : visit.institution_type ? (
                    <>
                      <span className="text-white/20">·</span>
                      <span>{visit.institution_type}</span>
                    </>
                  ) : null}
                  {visit.student_strength && Number(visit.student_strength) > 0 && (
                    <>
                      <span className="text-white/20">·</span>
                      <span>{Number(visit.student_strength).toLocaleString('en-IN')} students</span>
                    </>
                  )}
                  {visit.canvasser_name && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-white/40">by <strong className="text-white/70 font-normal">{visit.canvasser_name}</strong></span>
                    </>
                  )}
                </div>

                {/* 2. Contact Person & Direct Phone Link */}
                <div className="flex items-center justify-between text-xs text-white/70 flex-wrap gap-2 pt-1 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-white/40" />
                    <span className="font-medium text-white/90">{visit.contact_person || 'Management'}</span>
                    {visit.phone && (
                      <>
                        <span className="text-white/20">·</span>
                        <a 
                          href={`tel:${visit.phone.replace(/[^0-9+]/g, '')}`} 
                          className="text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold font-mono text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-amber-400/70" />
                          {visit.phone}
                        </a>
                      </>
                    )}
                  </div>

                  {/* Product Badges (Inline) */}
                  {Array.isArray(visit.product_interests) && visit.product_interests.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {visit.product_interests.map(p => (
                        <ProductBadge key={p} product={p} size="sm" />
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Product Specifications (Minimalist Left Accent) */}
                {visit.product_specifications && (
                  <div className="border-l-2 border-amber-400/80 pl-3.5 py-1 text-xs space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                      REQUIREMENTS &amp; SPECIFICATIONS
                    </span>
                    <p className="leading-relaxed text-white/80">{visit.product_specifications}</p>
                  </div>
                )}

                {/* 4. Meeting Notes (Clean Left Border Quote) */}
                {visit.notes && (
                  <div className="border-l-2 border-white/20 pl-3.5 py-0.5 text-xs text-white/60 italic leading-relaxed">
                    "{visit.notes}"
                  </div>
                )}

                {/* 5. Reference Photo Thumbnails */}
                {Array.isArray(visit.attachments) && visit.attachments.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="text-[10px] uppercase text-white/40 flex items-center gap-1 mr-1 font-semibold">
                      <Camera className="w-3 h-3 text-amber-400" />
                      PHOTOS ({visit.attachments.length}):
                    </span>
                    {visit.attachments.map((att, i) => (
                      <div 
                        key={att.id || i} 
                        onClick={() => setPreviewImage(att.url)}
                        className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-amber-400 hover:scale-105 transition-all shadow-md bg-black"
                        title="Click to view full photo"
                      >
                        <img src={att.url} alt={att.name || 'Sample'} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. Card Footer: Follow-up & Audit & Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-white/50 flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Follow-up: <strong className={cn(isOverdue ? "text-rose-400 font-bold" : "text-white/80")}>
                        {visit.follow_up_date || 'None'}
                        {isOverdue && ' (Overdue)'}
                      </strong></span>
                    </span>

                    {visit.last_edited_by_name && (
                      <>
                        <span className="text-white/20">·</span>
                        <button
                          type="button"
                          onClick={() => setInspectHistoryVisit(visit)}
                          className="text-white/40 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer text-[11px] font-medium"
                          title="Inspect audit history"
                        >
                          <History className="w-3 h-3 text-white/30" />
                          <span>Edited by {visit.last_edited_by_name} ({visit.edit_history?.length || 0})</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingVisit(visit)}
                      className="px-3.5 py-1.5 bg-white/[0.05] hover:bg-amber-400/15 text-white/80 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Visit</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── MODALS & OVERLAYS ────────────────────────────────────────────── */}
      <VerifySchoolDiscoveryModal
        isOpen={!!verifyDiscoveryVisit}
        onClose={() => setVerifyDiscoveryVisit(null)}
        visit={verifyDiscoveryVisit}
        onVerified={() => {
          showToast("School discovery successfully verified!");
          loadData();
        }}
      />

      <EditVisitModal 
        isOpen={!!editingVisit} 
        onClose={() => setEditingVisit(null)} 
        visit={editingVisit} 
        onSave={handleUpdateVisit} 
        onDelete={handleDeleteVisit} 
        isManager={true} 
      />

      <EditHistoryModal 
        isOpen={!!inspectHistoryVisit} 
        onClose={() => setInspectHistoryVisit(null)} 
        visit={inspectHistoryVisit} 
      />

      <InvoiceDocumentModal
        key={`visit-doc-${docModalType}-${docModalVisit?.id || 'none'}-${docModalVisit ? '1' : '0'}`}
        isOpen={!!docModalVisit}
        onClose={() => setDocModalVisit(null)}
        type={docModalType === 'quote' ? 'Quotation' : docModalType === 'proforma' ? 'Proforma Invoice' : 'Tax Invoice'}
        mode="create"
        visitData={docModalVisit}
        currentUser={currentUser}
        onSaveSuccess={() => {
          showToast(docModalType === 'quote' ? "Quotation generated!" : docModalType === 'proforma' ? "Proforma Invoice generated!" : "Tax Invoice generated!");
          loadData();
        }}
      />

      {/* Lightbox Image Preview Modal */}
      <AnimatePresence>
        {previewImage && createPortal(
          <div 
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setPreviewImage(null)}
          >
            <div 
              className="relative max-w-xl max-h-[85vh] p-2 bg-[#0c0d15] border border-white/20 rounded-3xl shadow-2xl overflow-hidden my-auto" 
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-white/20 text-white rounded-full transition-colors z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={previewImage} alt="Sample Preview" className="max-w-full max-h-[75vh] object-contain rounded-2xl mx-auto" />
            </div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 30 }} 
            className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 z-50 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
