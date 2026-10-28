import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Search, Filter, Plus, Edit2, Trash2, MapPin, 
  Phone, Users, Sparkles, CheckCircle2, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, Download, ShieldCheck, Clock, Check, AlertCircle,
  Briefcase, X, RotateCcw, GraduationCap, School, Layers
} from 'lucide-react';
import { TAMIL_NADU_DISTRICTS } from '../data/masterSchools';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';
import AestheticSelect from './AestheticSelect';
import SchoolPortfolioModal from './SchoolPortfolioModal';

export default function MasterSchoolsDirectoryModule({ currentUser }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [portfolioSchool, setPortfolioSchool] = useState(null);
  const [targetSchool, setTargetSchool] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    school_name: '',
    district: 'Chennai',
    block_or_cluster: '',
    board: 'CBSE',
    student_strength: null,
    contact_person: '',
    phone: '',
    area: '',
    priority: 'Medium'
  });
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const isCEO = currentUser?.role === 'ceo';

  useEffect(() => {
    if (modalOpen || deleteModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalOpen, deleteModalOpen]);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async (force = false) => {
    setLoading(true);
    try {
      const data = await mockApi.getAllMasterSchools({}, { forceRefresh: force });
      const list = Array.isArray(data) ? data : (data?.schools && Array.isArray(data.schools) ? data.schools : []);
      setSchools(list);
    } catch (e) {
      console.error("Failed to load master schools", e);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setActionError('');
    setTimeout(() => setActionSuccess(''), 4500);
  };

  const showError = (msg) => {
    setActionError(msg);
    setActionSuccess('');
    setTimeout(() => setActionError(''), 6000);
  };

  // Filter logic
  const schoolList = Array.isArray(schools) ? schools : [];

  const districtCounts = useMemo(() => {
    const counts = {};
    for (const s of schoolList) {
      if (s?.district) {
        counts[s.district] = (counts[s.district] || 0) + 1;
      }
    }
    return counts;
  }, [schoolList]);

  const availableDistricts = useMemo(() => {
    const list = Array.from(new Set([...TAMIL_NADU_DISTRICTS, ...Object.keys(districtCounts)])).filter(Boolean);
    return list.sort((a, b) => a.localeCompare(b));
  }, [districtCounts]);

  const filteredSchools = useMemo(() => {
    return schoolList.filter(s => {
      if (!s) return false;
      const matchesDist = selectedDistrict === 'All' || s.district?.toLowerCase() === selectedDistrict.toLowerCase();
      const matchesBoard = selectedBoard === 'All' || s.board?.toLowerCase().includes(selectedBoard.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchesQ = !q || 
        (s.school_name || '').toLowerCase().includes(q) ||
        (s.area || '').toLowerCase().includes(q) ||
        (s.block_or_cluster || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q);

      return matchesDist && matchesBoard && matchesQ;
    });
  }, [schoolList, selectedDistrict, selectedBoard, searchQuery]);

  const totalPages = Math.ceil(filteredSchools.length / pageSize) || 1;
  const paginatedSchools = filteredSchools.slice((page - 1) * pageSize, page * pageSize);

  // Dropdown options for AestheticSelect
  const districtOptions = useMemo(() => {
    return [
      { value: 'All', label: `All Districts (${schoolList.length})` },
      ...availableDistricts.map(d => ({
        value: d,
        label: `${d} (${districtCounts[d] || 0} Schools)`
      }))
    ];
  }, [availableDistricts, districtCounts, schoolList.length]);

  const boardOptions = [
    { value: 'All', label: 'All Boards' },
    { value: 'CBSE', label: 'CBSE' },
    { value: 'Matriculation', label: 'Matriculation' },
    { value: 'State Board', label: 'State Board' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'International', label: 'International' }
  ];

  const modalDistrictOptions = useMemo(() => {
    return TAMIL_NADU_DISTRICTS.map(d => ({
      value: d,
      label: d
    }));
  }, []);

  const modalBoardOptions = [
    { value: 'CBSE', label: 'CBSE' },
    { value: 'Matriculation', label: 'Matriculation' },
    { value: 'State Board', label: 'State Board' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'International', label: 'International' }
  ];

  const getBoardBadgeClass = (board) => {
    const b = (board || '').toLowerCase().trim();
    if (b.includes('cbse')) {
      return "bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-xs";
    }
    if (b.includes('matric')) {
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-xs";
    }
    if (b.includes('state')) {
      return "bg-indigo-500/15 text-indigo-300 border-indigo-400/40 shadow-xs";
    }
    if (b.includes('icse')) {
      return "bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-xs";
    }
    if (b.includes('international') || b.includes('cambridge') || b.includes('ib')) {
      return "bg-rose-500/15 text-rose-300 border-rose-400/40 shadow-xs";
    }
    return "bg-teal-500/15 text-teal-300 border-teal-400/40 shadow-xs";
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDistrict !== 'All' || selectedBoard !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('All');
    setSelectedBoard('All');
    setPage(1);
  };

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csvText = await mockApi.exportMasterSchoolsCSV();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `master_schools_catalog_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Master Schools database exported to CSV successfully!");
    } catch (err) {
      showError("Failed to export CSV: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Open Add Modal ──────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingSchool(null);
    setFormData({
      school_name: '',
      district: selectedDistrict !== 'All' ? selectedDistrict : 'Chennai',
      block_or_cluster: '',
      board: 'CBSE',
      student_strength: null,
      contact_person: '',
      phone: '',
      area: '',
      priority: 'Medium'
    });
    setModalOpen(true);
  };

  // ── Open Edit Modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      school_name: school.school_name || '',
      district: school.district || 'Chennai',
      block_or_cluster: school.block_or_cluster || '',
      board: school.board || 'CBSE',
      student_strength: school.student_strength !== undefined && school.student_strength !== null ? school.student_strength : null,
      contact_person: school.contact_person || '',
      phone: school.phone || '',
      area: school.area || '',
      priority: school.priority || 'Medium'
    });
    setModalOpen(true);
  };

  // ── Handle Add / Edit Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.school_name.trim()) return;
    setSubmitting(true);

    try {
      if (isCEO) {
        if (editingSchool) {
          await mockApi.updateMasterSchool(editingSchool.id, formData);
          showSuccess(`School "${formData.school_name}" updated directly in Master Catalog!`);
        } else {
          await mockApi.createMasterSchool(formData);
          showSuccess(`New school "${formData.school_name}" added to Master Catalog!`);
        }
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: editingSchool ? "SCHOOL_EDIT" : "SCHOOL_CREATE",
          title: editingSchool ? `School Update: ${formData.school_name}` : `New School Addition: ${formData.school_name}`,
          requestedBy: currentUser?.name ? `${currentUser.name} (${currentUser.roleTitle || 'Admin'})` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            ...formData,
            id: editingSchool ? editingSchool.id : undefined,
            target_school_id: editingSchool ? editingSchool.id : undefined
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`School submission for "${formData.school_name}" submitted to CEO for approval!`);
      }

      setModalOpen(false);
      await loadSchools();
    } catch (err) {
      showError("Failed to save school: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Delete Modal ───────────────────────────────────────────────────────
  const handleOpenDelete = (school) => {
    setTargetSchool(school);
    setDeleteModalOpen(true);
  };

  // ── Handle Delete Confirm ───────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!targetSchool) return;
    setSubmitting(true);

    try {
      if (isCEO) {
        await mockApi.deleteMasterSchool(targetSchool.id);
        showSuccess(`School "${targetSchool.school_name}" deleted directly from Master Catalog.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "SCHOOL_DELETE",
          title: `School Deletion Request: ${targetSchool.school_name}`,
          requestedBy: currentUser?.name ? `${currentUser.name} (${currentUser.roleTitle || 'Admin'})` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            id: targetSchool.id,
            target_school_id: targetSchool.id,
            school_name: targetSchool.school_name,
            district: targetSchool.district
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`Deletion request for "${targetSchool.school_name}" submitted to CEO for approval!`);
      }

      setDeleteModalOpen(false);
      setTargetSchool(null);
      await loadSchools();
    } catch (err) {
      showError("Failed to delete school: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 selection:bg-amber-400 selection:text-black">
      {/* ── TOP HEADER & COMMAND ACTIONS ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#14151f]/95 via-[#0e1017]/90 to-[#0c0d15]/90 border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Luminous Top Catch Rim */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-black font-black shadow-lg shadow-amber-400/20 shrink-0">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md border font-mono",
                  isCEO ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                )}>
                  {isCEO ? "CEO Master Control" : "Admin Executive"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Tamil Nadu Master Schools Catalog
              </h2>
              <p className="text-xs text-white/55 mt-0.5 leading-relaxed max-w-xl">
                Verified database of institutional accounts, affiliation boards, cluster hierarchies, and key management contacts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => loadSchools(true)}
              disabled={loading}
              className="px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-white/[0.1] hover:border-amber-400/30 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Sync and pull latest school catalog from database"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", loading && "animate-spin")} />
              <span>{loading ? "Syncing..." : "Sync Directory"}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-white/[0.1] hover:border-amber-400/30 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Download full school directory as CSV file"
            >
              <Download className={cn("w-3.5 h-3.5 text-amber-400", exporting && "animate-bounce")} />
              <span>{exporting ? "Exporting..." : "Export Directory (CSV)"}</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-400/20 transition whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isCEO ? "Add Master School" : "Propose New School"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TOP TELEMETRY TILES (4 STATS) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl group hover:border-amber-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50 font-medium">Total Registered</span>
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <School className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1.5">
            {schoolList.length.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-white/40 font-mono mt-0.5">Live Master Database SKUs</div>
        </div>

        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl group hover:border-amber-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50 font-medium">Districts Active</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1.5">
            {availableDistricts.length}
          </div>
          <div className="text-[10px] text-white/40 font-mono mt-0.5">Across Tamil Nadu Territory</div>
        </div>

        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl group hover:border-amber-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50 font-medium">Filter Matches</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1.5">
            {filteredSchools.length.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-white/40 font-mono mt-0.5">
            {filteredSchools.length === schoolList.length ? '100% visible' : `${((filteredSchools.length / Math.max(1, schoolList.length)) * 100).toFixed(1)}% of catalog`}
          </div>
        </div>

        <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl group hover:border-amber-400/30 transition">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50 font-medium">Curricula / Boards</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono mt-1.5">
            5 Types
          </div>
          <div className="text-[10px] text-white/40 font-mono mt-0.5 truncate">CBSE • Matric • State • ICSE</div>
        </div>
      </div>

      {/* ── NOTIFICATIONS ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2.5 shadow-lg backdrop-blur-md"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SEARCH & FILTERS COMMAND BAR ─────────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-2xl relative z-30">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by school name, locality, cluster, contact, or ID..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl pl-10 pr-9 text-xs text-white placeholder:text-white/40 focus:outline-none transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* District Selector (AestheticSelect) */}
          <div className="sm:col-span-3 relative z-30 focus-within:z-40">
            <AestheticSelect
              value={selectedDistrict}
              onChange={val => {
                setSelectedDistrict(val);
                setPage(1);
              }}
              options={districtOptions}
              searchable={true}
              placeholder="Select District..."
              icon={MapPin}
              buttonClassName="min-h-[44px] bg-black/40 border-white/[0.1] hover:border-white/20"
            />
          </div>

          {/* Board Selector (AestheticSelect) */}
          <div className="sm:col-span-3 relative z-20 focus-within:z-40">
            <AestheticSelect
              value={selectedBoard}
              onChange={val => {
                setSelectedBoard(val);
                setPage(1);
              }}
              options={boardOptions}
              placeholder="Select Board..."
              icon={GraduationCap}
              buttonClassName="min-h-[44px] bg-black/40 border-white/[0.1] hover:border-white/20"
            />
          </div>
        </div>

        {/* Filter Reset pill bar if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-white/[0.06] flex-wrap gap-2">
            <div className="flex items-center gap-2 text-white/50">
              <span className="font-bold text-white">Active Filters:</span>
              {searchQuery && (
                <span className="bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                  "{searchQuery}"
                </span>
              )}
              {selectedDistrict !== 'All' && (
                <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                  District: {selectedDistrict}
                </span>
              )}
              {selectedBoard !== 'All' && (
                <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                  Board: {selectedBoard}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/25 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ── SCHOOLS DIRECTORY TABLE ──────────────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-black/50 text-white/50 uppercase text-[10px] border-b border-white/[0.08] font-bold tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-4 px-4 sm:px-5">School Institution</th>
                <th className="py-4 px-4 sm:px-5">District &amp; Cluster</th>
                <th className="py-4 px-4 sm:px-5 text-center">Board / Syllabus</th>
                <th className="py-4 px-4 sm:px-5 text-center">Student Strength</th>
                <th className="py-4 px-4 sm:px-5">Key Contact &amp; Phone</th>
                <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/50">
                    <RefreshCw className="w-7 h-7 animate-spin mx-auto text-amber-400 mb-3" />
                    <span className="text-xs font-bold text-white/70">Loading Master School Catalog...</span>
                  </td>
                </tr>
              ) : paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/50">
                    <Building2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white/70">No institutions found matching your search.</p>
                    <p className="text-[11px] text-white/40 mt-1">Try clearing the search text or selecting a different district.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear All Filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedSchools.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.03] transition-colors group">
                    {/* Name & ID */}
                    <td className="py-4 px-4 sm:px-5">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setPortfolioSchool(s)}
                          className="font-bold text-white text-xs hover:text-amber-400 text-left transition flex items-center gap-1.5 cursor-pointer leading-snug group/name"
                          title="Click to view institutional portfolio (visits, quotes, invoices)"
                        >
                          <span className="group-hover/name:underline">{s.school_name}</span>
                          <Briefcase className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover/name:opacity-100 shrink-0 transition" />
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                            {s.id}
                          </span>
                          {s.area && (
                            <span className="text-[10px] text-white/45">
                              {s.area}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* District & Cluster */}
                    <td className="py-4 px-4 sm:px-5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{s.district}</span>
                        <span className="text-[10px] text-white/45 block">{s.block_or_cluster || 'General Cluster'}</span>
                      </div>
                    </td>

                    {/* Board */}
                    <td className="py-4 px-4 sm:px-5 whitespace-nowrap text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center justify-center whitespace-nowrap font-mono",
                        getBoardBadgeClass(s.board)
                      )}>
                        {s.board || 'Matriculation'}
                      </span>
                    </td>

                    {/* Student Strength */}
                    <td className="py-4 px-4 sm:px-5 text-center">
                      {s.student_strength && Number(s.student_strength) > 0 ? (
                        <span className="font-mono font-bold text-xs text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 shadow-sm">
                          <Users className="w-3 h-3 text-amber-400" />
                          {Number(s.student_strength).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="font-mono text-white/30 text-sm font-semibold select-none">—</span>
                      )}
                    </td>

                    {/* Contact Person & Phone */}
                    <td className="py-4 px-4 sm:px-5">
                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-white/80 font-medium">
                          {s.contact_person && s.contact_person.trim() ? s.contact_person : <span className="text-white/30 font-mono">—</span>}
                        </p>
                        <p className="text-white/50 font-mono text-[10px]">
                          {s.phone && s.phone.trim() ? (
                            <a href={`tel:${s.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-amber-400 transition">
                              {s.phone}
                            </a>
                          ) : (
                            <span className="text-white/30 font-mono">—</span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPortfolioSchool(s)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                          title="View school activity portfolio"
                        >
                          <Briefcase className="w-3 h-3 text-emerald-400" />
                          <span>Portfolio</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.1] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                          title={isCEO ? "Edit school immediately" : "Submit school edit proposal to CEO"}
                        >
                          <Edit2 className="w-3 h-3 text-amber-400" />
                          <span>{isCEO ? "Edit" : "Req. Edit"}</span>
                        </button>

                        <button
                          onClick={() => handleOpenDelete(s)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer shadow-sm"
                          title={isCEO ? "Delete school from Master Catalog" : "Submit school deletion proposal to CEO"}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 sm:p-5 bg-black/45 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 font-medium">
          <span>
            Showing <strong className="text-white font-mono">{filteredSchools.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to <strong className="text-white font-mono">{Math.min(page * pageSize, filteredSchools.length)}</strong> of <strong className="text-white font-mono">{filteredSchools.length.toLocaleString('en-IN')}</strong> institutions
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.1] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="font-mono px-3 font-bold text-white text-xs bg-white/[0.04] border border-white/[0.08] py-1.5 rounded-xl">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.1] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ───────────────────────────────────────────────── */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e0f17]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl backdrop-blur-2xl text-white my-auto max-h-[90vh] overflow-y-auto relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>
                  {editingSchool 
                    ? (isCEO ? `Edit Master School: ${editingSchool.school_name}` : `Submit Edit Proposal: ${editingSchool.school_name}`)
                    : (isCEO ? "Add School Directly to Master Catalog" : "Submit New School Proposal to CEO")}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-white/70 font-bold block mb-1.5">School Name *</label>
                <input
                  required
                  type="text"
                  value={formData.school_name}
                  onChange={e => setFormData({ ...formData, school_name: e.target.value })}
                  placeholder="e.g. SBOA Matriculation Higher Secondary School"
                  className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-white/70 font-bold block mb-1.5">District *</label>
                  <AestheticSelect
                    value={formData.district}
                    onChange={val => setFormData({ ...formData, district: val })}
                    options={modalDistrictOptions}
                    searchable={true}
                    placeholder="Select District"
                    icon={MapPin}
                    size="sm"
                    buttonClassName="bg-black/40 border-white/[0.1] hover:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-white/70 font-bold block mb-1.5">Board / Affiliation</label>
                  <AestheticSelect
                    value={formData.board}
                    onChange={val => setFormData({ ...formData, board: val })}
                    options={modalBoardOptions}
                    placeholder="Select Board"
                    icon={GraduationCap}
                    size="sm"
                    buttonClassName="bg-black/40 border-white/[0.1] hover:border-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-white/70 font-bold block mb-1.5">Block / Cluster</label>
                  <input
                    type="text"
                    value={formData.block_or_cluster}
                    onChange={e => setFormData({ ...formData, block_or_cluster: e.target.value })}
                    placeholder="e.g. Madurai South"
                    className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-white/70 font-bold block mb-1.5">Area / Locality</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Anna Nagar"
                    className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-white/70 font-bold block mb-1.5">Student Strength</label>
                  <input
                    type="number"
                    value={formData.student_strength === null || formData.student_strength === undefined ? '' : formData.student_strength}
                    onChange={e => setFormData({ ...formData, student_strength: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 1200"
                    className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="text-white/70 font-bold block mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Principal / Dean"
                    className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-white/70 font-bold block mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9840123456"
                    className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-black font-black rounded-xl transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : editingSchool 
                    ? (isCEO ? "Update School Immediately" : "Submit Edit Proposal to CEO")
                    : (isCEO ? "Add School Immediately" : "Submit Addition to CEO")}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white font-bold rounded-xl transition cursor-pointer border border-white/[0.08]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE MODAL ───────────────────────────────────────────────────── */}
      {deleteModalOpen && targetSchool && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e0f17]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl backdrop-blur-2xl text-white my-auto relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {isCEO ? "Confirm School Deletion" : "Submit Deletion Proposal"}
                </h3>
                <p className="text-[11px] text-white/50">Master Directory Governance</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{targetSchool.school_name}</strong> ({targetSchool.district}) from the Master Schools Catalog?
              <span className="block text-rose-300 mt-2.5 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-medium">
                {isCEO 
                  ? "⚠️ This will delete the institution record directly from the master database." 
                  : "ℹ️ Your deletion request will be submitted to the CEO Approval Queue for final verification."}
              </span>
            </p>

            <div className="flex gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl transition shadow-lg shadow-rose-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Processing..." : isCEO ? "Delete School Immediately" : "Submit Deletion Proposal"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white font-bold rounded-xl transition cursor-pointer border border-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── INSTITUTIONAL PORTFOLIO MODAL ─────────────────────────────────── */}
      <SchoolPortfolioModal
        isOpen={!!portfolioSchool}
        onClose={() => setPortfolioSchool(null)}
        schoolId={portfolioSchool?.id}
        schoolName={portfolioSchool?.school_name}
      />
    </div>
  );
}
