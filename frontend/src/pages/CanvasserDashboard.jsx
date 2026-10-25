import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Plus, List, LogOut, CheckCircle2, TrendingUp, Calendar, 
  MapPin, Building2, User, Phone, Users, Edit3, Trash2, Search, Filter, History,
  ChevronRight, Sparkles, Target, Award, ArrowUpRight, Trophy, Image, Camera,
  FileText, X, AlertCircle, CalendarClock, Clock
} from 'lucide-react';
import { mockApi, calculateCommissionSlab } from '../mockApi';
import { AuthContext } from '../App';
import EditVisitModal from '../components/EditVisitModal';
import EditHistoryModal from '../components/EditHistoryModal';
import DynamicKPISection from '../components/DynamicKPISection';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import FollowUpsPipelineModule from '../components/FollowUpsPipelineModule';
import ErrorBoundary from '../components/ErrorBoundary';
import SchoolSearchPicker from '../components/SchoolSearchPicker';
import CompanyProductSelector from '../components/CompanyProductSelector';
import ProductBadge from '../components/ProductBadge';
import { COMPANY_DIVISIONS } from '../lib/companyProducts';
import { getRoleConfig, isCanvasser } from '../lib/rbac';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';
import AestheticSelect from '../components/AestheticSelect';
import AestheticDatePicker from '../components/AestheticDatePicker';

const DEFAULT_PRODUCTS = ["Socks", "Belts", "Ties", "Shoes", "Uniforms", "Bags", "Track Pants"];
const INTEREST_LEVELS = [
  { label: 'Hot', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/40' },
  { label: 'Warm', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/40' },
  { label: 'Cold', color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/40' },
  { label: 'Not Interested', color: 'bg-gray-600', text: 'text-gray-400', border: 'border-gray-600/40' }
];

// Canvassers can only choose between Open, Sample Sent, and Not Interested
const CANVASSER_OUTCOME_STATUSES = ["Open", "Sample Sent", "Not Interested"];

export default function CanvasserDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'new', 'list', 'leaderboard'
  const [visits, setVisits] = useState([]);
  const [availableProducts, setAvailableProducts] = useState(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);

  // Form State for New Visit
  const [formData, setFormData] = useState({
    school_name: '', district: '', institution_type: 'School', 
    contact_person: '', phone: '', student_strength: '', 
    product_interests: [], product_specifications: '', attachments: [],
    interest_level: 'Warm', outcome_status: 'Open', follow_up_date: '', noFollowUp: false, notes: '',
    is_from_master_db: false, master_school_id: null, cluster_or_block: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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

  // Editing and Modal State
  const [editingVisit, setEditingVisit] = useState(null);
  const [inspectHistoryVisit, setInspectHistoryVisit] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }
  const [formError, setFormError] = useState(null);

  // Filters for "My Visits" tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInterest, setFilterInterest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const roleConfig = getRoleConfig(user);

  // Follow-up dates calculation for badge & overview
  const followUpStats = React.useMemo(() => {
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

    let dueToday = 0;
    let dueTomorrow = 0;
    let overdue = 0;
    let totalScheduled = 0;

    visits.forEach(v => {
      if (v.follow_up_date && typeof v.follow_up_date === 'string' && v.follow_up_date.trim() !== '') {
        const fDate = v.follow_up_date.slice(0, 10);
        totalScheduled++;
        if (fDate === today) dueToday++;
        else if (fDate === tomorrow) dueTomorrow++;
        else if (fDate < today) overdue++;
      }
    });

    return { dueToday, dueTomorrow, overdue, totalScheduled, attentionCount: dueToday + overdue };
  }, [visits]);

  const navTabs = [
    { id: 'dashboard', label: 'Overview', mobileLabel: 'Overview', icon: LayoutDashboard },
    { id: 'new', label: 'Log Visit', mobileLabel: 'Log Visit', icon: Plus },
    { 
      id: 'followups', 
      label: 'Follow-ups', 
      mobileLabel: 'Follow-ups', 
      icon: CalendarClock,
      badge: followUpStats.attentionCount > 0 ? followUpStats.attentionCount : null
    },
    { id: 'list', label: 'My Visits', mobileLabel: 'Visits', icon: List },
    { id: 'leaderboard', label: 'Leaderboard', mobileLabel: 'Ranks', icon: Trophy }
  ];

  useEffect(() => {
    loadVisits();
    loadCatalogProducts();
  }, [user]);

  const loadCatalogProducts = async () => {
    try {
      const prods = await mockApi.getProducts();
      if (prods && prods.length > 0) {
        setAvailableProducts(prods.map(p => p.name));
      }
    } catch (e) {
      console.error("Failed to load catalog products", e);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getVisits({ canvasser_id: user?.id });
      setVisits(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load canvasser visits:", e);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (product) => {
    setFormData(prev => {
      const exists = prev.product_interests.includes(product);
      const interests = exists 
        ? prev.product_interests.filter(p => p !== product)
        : [...prev.product_interests, product];
      return { ...prev, product_interests: interests };
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        const compressedUrl = await compressImage(file);
        if (!compressedUrl) continue;
        const newAttachment = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          name: file.name,
          url: compressedUrl,
          type: file.type || 'image/jpeg',
          timestamp: new Date().toISOString()
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      } catch (err) {
        console.warn('Image processing warning:', err);
      }
    }
    e.target.value = '';
  };

  const handleRemoveAttachment = (attId) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.school_name || !formData.school_name.trim()) {
      setFormError("Please provide the School Name before saving.");
      return;
    }
    if (!formData.district || !formData.district.trim()) {
      setFormError("Please select or enter the District.");
      return;
    }
    if (!formData.contact_person || !formData.contact_person.trim()) {
      setFormError("Please provide the Contact Person (Principal / Correspondent / Admin).");
      return;
    }
    if (!formData.phone || !formData.phone.trim()) {
      setFormError("Please provide a Contact Phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        follow_up_date: formData.noFollowUp ? null : (formData.follow_up_date || null)
      };
      await mockApi.addVisit(payload, user.id, user.name);
      showToast("School visit logged successfully!", "success");
      
      setFormData({
        school_name: '', district: '', institution_type: 'School', 
        contact_person: '', phone: '', student_strength: '', 
        product_interests: [], product_specifications: '', attachments: [],
        interest_level: 'Warm', outcome_status: 'Open', follow_up_date: '', noFollowUp: false, notes: '',
        is_from_master_db: false, master_school_id: null, cluster_or_block: ''
      });
      setFormError(null);
      setActiveTab('list');
      await loadVisits();
    } catch (err) {
      setFormError(err.message || "Failed to save visit. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVisit = async (id, updatedData) => {
    try {
      await mockApi.updateVisit(id, updatedData, user);
      showToast("Visit updated successfully!", "success");
      await loadVisits();
    } catch (err) {
      showToast(err.message || "Failed to update visit", "error");
    }
  };

  const handleDeleteVisit = async (id) => {
    try {
      await mockApi.deleteVisit(id);
      showToast("Visit deleted successfully!", "success");
      await loadVisits();
    } catch (err) {
      showToast(err.message || "Failed to delete visit", "error");
    }
  };

  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      (v.school_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.product_specifications || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesInterest = filterInterest === 'all' || v.interest_level === filterInterest;
    const matchesStatus = filterStatus === 'all' || v.outcome_status === filterStatus;

    return matchesSearch && matchesInterest && matchesStatus;
  });

  const hotVisits = visits.filter(v => v.interest_level === 'Hot');
  const wonVisits = visits.filter(v => v.outcome_status === 'Won');

  if (loading && visits.length === 0) {
    return (
      <div className="min-h-screen vivid-void-canvas flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vivid-void-canvas text-white pb-24 selection:bg-amber-300 selection:text-black">
      {/* Top Header & Desktop Nav with Lucid Block Glass & Apple Spring Tabs */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0c0d15]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[70px]">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="h-10 w-20 sm:h-11 sm:w-24 rounded-xl overflow-hidden border border-[#d9b763]/25 bg-[#171615] flex items-center justify-center flex-shrink-0 shadow-inner">
                <img 
                  src="/logo.jpg" 
                  alt="MG The One" 
                  className="w-full h-full object-cover scale-[1.38]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase leading-none">
                    The One
                  </h1>
                  <span className="text-white/20 hidden sm:inline">/</span>
                  <span className="text-[11px] font-semibold text-amber-400/90 whitespace-nowrap tracking-wide">
                    {user?.roleTitle || 'Canvasser'}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 font-medium flex items-center gap-1.5 mt-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">{user?.name || 'Field Canvasser'}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40 text-[10px]">Field Operations</span>
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs with Apple-grade Fluid Spring Layout */}
            <div className="hidden md:flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <div className="inline-flex p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                {navTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap z-10",
                        isActive
                          ? "text-black font-black"
                          : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="canvasserActiveTopTab"
                          className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl shadow-[0_2px_12px_rgba(251,191,36,0.28)] -z-10"
                          transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                        />
                      )}
                      <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-200", isActive ? "text-black scale-105" : "text-white/50")} />
                      <span className="relative z-10 tracking-tight">{tab.label}</span>
                      {tab.badge && (
                        <span className={cn(
                          "relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-black",
                          isActive ? "bg-black text-amber-400" : "bg-rose-500 text-white animate-pulse"
                        )}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button 
                onClick={() => setUser(null)} 
                title="Sign Out"
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0 text-white/60" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-8 space-y-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* ================= TAB 1: DEDICATED DASHBOARD OVERVIEW ================= */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Quick Action Banner */}
                <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#161420]/90 via-[#0e1017]/90 to-[#0c0d15]/90 border border-amber-500/30 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                  {/* Luminous Top Catch & Accent Radial Light */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                  <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Field Sales Terminal</span>
                      <span className="text-white/20">·</span>
                      <span className="text-[11px] text-white/40">Live</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-white mt-2 tracking-tight">
                      Log Today's School Visits
                    </h2>
                    <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-md leading-relaxed">
                      Record school interactions and configure apparel requirements.
                    </p>

                    <div className="flex gap-3 sm:gap-4 mt-5 flex-wrap items-center">
                      <button
                        onClick={() => setActiveTab('new')}
                        className="h-12 px-6 sm:px-7 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer min-w-[170px] tracking-wide"
                      >
                        <Plus className="w-4 h-4 stroke-[2.8]" />
                        <span>Log New Visit</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('followups')}
                        className="h-12 px-5 sm:px-6 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 font-bold text-xs sm:text-sm rounded-2xl border border-blue-500/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-md min-w-[170px]"
                      >
                        <CalendarClock className="w-4 h-4 text-blue-400" />
                        <span>Follow-ups Queue</span>
                        {followUpStats.attentionCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-md shadow-rose-500/40 animate-pulse ml-1">
                            {followUpStats.attentionCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveTab('leaderboard')}
                        className="h-12 px-5 sm:px-6 bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/[0.1] flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-md min-w-[150px]"
                      >
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>Leaderboard</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic Field Performance KPI Cards */}
                <DynamicKPISection currentUser={user} refreshTrigger={visits.length} />

                {/* Priority Follow-ups Quick Tracker Widget */}
                <div className="bg-[#0c0d15]/85 p-5 sm:p-6 rounded-3xl border border-white/[0.08] shadow-2xl backdrop-blur-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                        <CalendarClock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white tracking-tight">
                          Priority Follow-ups Queue
                        </h3>
                        <p className="text-[11px] text-white/40">Actionable appointments scheduled across accounts</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab('followups')}
                      className="text-xs text-amber-400 font-bold hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20"
                    >
                      <span>Open Queue ({followUpStats.totalScheduled})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('followups')}
                      className="p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 rounded-2xl text-left transition-all duration-200 hover:scale-[1.01] cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          Due Today
                        </span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-rose-400 mt-2 block">{followUpStats.dueToday}</span>
                      <span className="text-[11px] text-white/50 block mt-1 font-medium">Urgent client visits & calls</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('followups')}
                      className="p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-400/40 rounded-2xl text-left transition-all duration-200 hover:scale-[1.01] cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Tomorrow
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 uppercase font-semibold">
                          Next Day
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 block">{followUpStats.dueTomorrow}</span>
                      <span className="text-[11px] text-white/50 block mt-1 font-medium">Upcoming scheduled reviews</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('followups')}
                      className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 rounded-2xl text-left transition-all duration-200 hover:scale-[1.01] cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-red-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          Overdue
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 uppercase font-semibold">
                          Action req.
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-red-400 mt-2 block">{followUpStats.overdue}</span>
                      <span className="text-[11px] text-white/50 block mt-1 font-medium">Missed target dates</span>
                    </button>
                  </div>
                </div>

                {/* Pipeline Quick Summary Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lead Pipeline Breakdown */}
                  <div className="bg-[#0c0d15]/85 p-5 rounded-3xl border border-white/[0.08] shadow-2xl backdrop-blur-2xl space-y-3.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
                          <Target className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-white">Lead Pipeline Breakdown</h3>
                      </div>
                      <button 
                        onClick={() => setActiveTab('list')}
                        className="text-xs text-amber-400 font-bold hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({visits.length})</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-4 bg-gradient-to-br from-red-500/15 to-transparent border border-red-500/25 rounded-2xl relative overflow-hidden">
                        <span className="text-xs font-bold text-red-300 block">Hot Leads</span>
                        <span className="text-2xl sm:text-3xl font-black text-red-400 mt-1.5 block">{hotVisits.length}</span>
                        <span className="text-[10px] text-white/50 mt-1 block">Ready for quotation / samples</span>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-emerald-500/15 to-transparent border border-emerald-500/25 rounded-2xl relative overflow-hidden">
                        <span className="text-xs font-bold text-emerald-300 block">Deals Won</span>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1.5 block">{wonVisits.length}</span>
                        <span className="text-[10px] text-white/50 mt-1 block">Successfully converted accounts</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent School Visits */}
                  <div className="bg-[#0c0d15]/85 p-5 rounded-3xl border border-white/[0.08] shadow-2xl backdrop-blur-2xl space-y-3.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/[0.06] text-white/70">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-white">Recent Field Activity</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('list')}
                        className="text-xs text-white/50 hover:text-white font-medium transition-colors"
                      >
                        See all records
                      </button>
                    </div>

                    <div className="space-y-2">
                      {visits.length === 0 ? (
                        <div className="py-6 text-center text-xs text-white/40">
                          No recent visits logged yet
                        </div>
                      ) : (
                        visits.slice(0, 3).map((visit) => (
                          <div 
                            key={visit.id}
                            onClick={() => setActiveTab('list')}
                            className="p-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-amber-400/30 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{visit.school_name}</h4>
                              <p className="text-[11px] text-white/40 mt-0.5 truncate">{visit.district} • {visit.contact_person}</p>
                            </div>
                            <span className={cn(
                              "text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap shrink-0",
                              visit.interest_level === 'Hot' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              visit.interest_level === 'Warm' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 
                              'bg-white/[0.06] text-white/60 border border-white/[0.08]'
                            )}>
                              {visit.outcome_status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* ================= TAB 2: CLEAN NEW VISIT FORM ================= */}
          {activeTab === 'new' && (
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6 bg-[#0c0d15]/85 border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Log School Visit</h2>
                  <p className="text-xs text-white/50 mt-0.5">Record school interaction and configure quotation requirements</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    New Entry
                  </span>
                </div>
              </div>
            
              {/* Institution Selection via Master Database Picker */}
              <div>
                <SchoolSearchPicker
                  selectedSchoolName={formData.school_name}
                  selectedDistrict={formData.district}
                  selectedInstitutionType={formData.institution_type}
                  isFromMasterDb={formData.is_from_master_db}
                  masterSchoolId={formData.master_school_id}
                  onSchoolChange={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      school_name: data.school_name,
                      district: data.district,
                      institution_type: data.institution_type || prev.institution_type,
                      is_from_master_db: data.is_from_master_db,
                      master_school_id: data.master_school_id,
                      cluster_or_block: data.cluster_or_block || '',
                      contact_person: (data.contact_person !== undefined && data.contact_person !== null && data.contact_person !== '') 
                        ? data.contact_person 
                        : (data.is_from_master_db ? prev.contact_person : prev.contact_person),
                      phone: (data.phone !== undefined && data.phone !== null && data.phone !== '') 
                        ? data.phone 
                        : (data.is_from_master_db ? prev.phone : prev.phone),
                      student_strength: (data.student_strength !== undefined && data.student_strength !== null && data.student_strength !== '') 
                        ? data.student_strength 
                        : (data.is_from_master_db ? prev.student_strength : prev.student_strength)
                    }));
                  }}
                />
              </div>

              {/* Contact Details */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Contact Person &amp; Strength</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                    <input 
                      required 
                      placeholder="Contact Person (e.g. Principal)" 
                      value={formData.contact_person} 
                      onChange={e => setFormData({...formData, contact_person: e.target.value})} 
                      className="w-full bg-black/40 border border-white/[0.08] hover:border-white/20 focus:border-amber-400/80 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner" 
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                    <input 
                      required 
                      type="tel" 
                      placeholder="Phone Number" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-black/40 border border-white/[0.08] hover:border-white/20 focus:border-amber-400/80 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner" 
                    />
                  </div>
                </div>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                  <input 
                    type="number" 
                    placeholder="Est. Student Strength (e.g. 1500)" 
                    value={formData.student_strength} 
                    onChange={e => setFormData({...formData, student_strength: Number(e.target.value) || ''})} 
                    className="w-full bg-black/40 border border-white/[0.08] hover:border-white/20 focus:border-amber-400/80 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner" 
                  />
                </div>
              </div>

              {/* Product Interests Multi-select Chips by Company Division */}
              <div className="pt-4 border-t border-white/[0.08]">
                <CompanyProductSelector 
                  selectedProducts={formData.product_interests}
                  onToggleProduct={handleProductToggle}
                />
              </div>

              {/* Product Specifications & Custom Requirements */}
              <div className="space-y-2 pt-4 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Product Specifications &amp; Custom Requirements
                  </p>
                  <span className="text-[10px] text-white/40">Principal's specs</span>
                </div>
                <textarea 
                  rows={3}
                  placeholder="Type specific material or design requirements (e.g. 100% combed cotton, 220 GSM uniform fabric, double-ribbed socks with school crest, customized buckle)..." 
                  value={formData.product_specifications} 
                  onChange={e => setFormData({...formData, product_specifications: e.target.value})} 
                  className="w-full bg-black/40 border border-white/[0.08] hover:border-white/20 focus:border-amber-400/80 rounded-2xl p-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none transition-all shadow-inner" 
                />
              </div>

              {/* Sample Photos / Reference Image Attachment */}
              <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Sample Photos &amp; Reference Images
                  </p>
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-bold">
                    {formData.attachments?.length || 0} attached
                  </span>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="cursor-pointer px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-amber-400/60 rounded-xl text-xs font-bold text-white/80 hover:text-white flex items-center gap-2 transition-all">
                    <Image className="w-4 h-4 text-amber-400" />
                    <span>+ Attach Sample Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                  <span className="text-[11px] text-white/40">Attach photos of school uniforms, socks, or design samples</span>
                </div>

                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {formData.attachments.map(att => (
                      <div key={att.id} className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-white/20 bg-black shadow-md">
                        <img 
                          src={att.url} 
                          alt={att.name} 
                          onClick={() => setPreviewImage(att.url)}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interest Level Selection */}
              <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Interest Level</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {INTEREST_LEVELS.map(level => (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      key={level.label}
                      onClick={() => setFormData({...formData, interest_level: level.label})}
                      className={cn(
                        "py-3 px-3 rounded-2xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer",
                        formData.interest_level === level.label 
                          ? `${level.color} border-transparent text-white shadow-lg` 
                          : `bg-black/30 ${level.border} ${level.text} hover:bg-white/[0.04]`
                      )}
                    >
                      {formData.interest_level === level.label && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{level.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Outcome Status / Deal Stage Selection (Restricted for Canvassers) */}
              <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Visit Outcome</p>
                  <span className="text-[10px] text-white/40">Quotes &amp; orders are processed by Admin</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {CANVASSER_OUTCOME_STATUSES.map(status => {
                    const isSelected = formData.outcome_status === status;
                    return (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        key={status}
                        onClick={() => setFormData({...formData, outcome_status: status})}
                        className={cn(
                          "py-3 px-2 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                          isSelected
                            ? status === 'Sample Sent'
                              ? "bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20 font-black"
                              : status === 'Not Interested'
                              ? "bg-gray-700 text-white border-gray-500 font-bold"
                              : "bg-gradient-to-r from-amber-400 to-amber-300 text-black border-amber-300 shadow-lg shadow-amber-400/20 font-black"
                            : "bg-black/30 text-white/50 border-white/[0.08] hover:border-white/20 hover:text-white"
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{status}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up & Field Notes */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Next Action Follow-up</p>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50 hover:text-white transition-colors">
                    <input 
                      type="checkbox"
                      checked={formData.noFollowUp}
                      onChange={e => setFormData({
                        ...formData, 
                        noFollowUp: e.target.checked,
                        follow_up_date: e.target.checked ? '' : formData.follow_up_date
                      })}
                      className="rounded border-white/20 bg-black text-amber-400 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>No Follow-up Needed</span>
                  </label>
                </div>

                {!formData.noFollowUp && (
                  <AestheticDatePicker
                    value={formData.follow_up_date || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, follow_up_date: val }))}
                    placeholder="Select scheduled follow-up date..."
                  />
                )}

                <textarea 
                  placeholder="Additional field notes / principal discussion summary..." 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-black/40 border border-white/[0.08] hover:border-white/20 focus:border-amber-400/80 rounded-2xl p-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20 h-24 resize-none transition-all shadow-inner" 
                />
              </div>

              {/* In-App Inline Form Error Banner */}
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-red-400 text-xs shadow-lg backdrop-blur-md"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{formError}</div>
                  <button 
                    type="button" 
                    onClick={() => setFormError(null)} 
                    className="text-red-400/60 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              {/* Submit Button with Lucid Gradient */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black py-4 rounded-2xl shadow-xl shadow-amber-400/20 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? 'Saving School Visit...' : 'Submit School Visit'}
              </motion.button>
            </form>
          )}

          {/* ================= TAB 3: MY VISITS LIST & EDIT ================= */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">My Field Visits</h2>
                  <p className="text-xs text-white/50">{filteredVisits.length} recorded visits</p>
                </div>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Visit
                </button>
              </div>

              {/* Search and Filters with Lucid Glass */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search by school, district, contact person..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0c0d15]/80 border border-white/[0.08] hover:border-white/20 focus:border-amber-400/80 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner backdrop-blur-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <AestheticSelect
                    value={filterInterest}
                    onChange={setFilterInterest}
                    size="sm"
                    options={[
                      { id: 'all', label: 'All Interests' },
                      { id: 'Hot', label: 'Hot' },
                      { id: 'Warm', label: 'Warm' },
                      { id: 'Cold', label: 'Cold' },
                      { id: 'Not Interested', label: 'Not Interested' }
                    ]}
                  />

                  <AestheticSelect
                    value={filterStatus}
                    onChange={setFilterStatus}
                    size="sm"
                    options={[
                      { id: 'all', label: 'All Statuses' },
                      { id: 'Order Won', label: 'Order Won' },
                      { id: 'Sample Submitted', label: 'Sample Submitted' },
                      { id: 'Follow-up Needed', label: 'Follow-up Needed' },
                      { id: 'Pending Decision', label: 'Pending Decision' },
                      { id: 'Lost', label: 'Lost' }
                    ]}
                  />
                </div>
              </div>

              {/* List of Visits */}
              {loading ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-white/40 text-xs">Loading field records...</p>
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="text-center py-14 bg-[#0c0d15]/80 rounded-3xl border border-white/[0.08] p-6 backdrop-blur-xl space-y-2">
                  <p className="text-sm text-white font-bold">No visits found.</p>
                  <p className="text-xs text-white/40">Tap "New Visit" to log your school visit.</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-black text-xs rounded-xl shadow-md shadow-amber-400/20 cursor-pointer"
                  >
                    Log Visit Now
                  </button>
                </div>
              ) : (
                filteredVisits.map((visit, idx) => {
                  const isOverdue = visit.follow_up_date && new Date(visit.follow_up_date) < new Date();
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={visit.id} 
                      className="bg-[#0f1118] hover:bg-[#131622] p-5 sm:p-6 rounded-3xl border border-white/[0.08] hover:border-amber-400/30 shadow-xl space-y-3.5 relative transition-all duration-200"
                    >
                      {/* Header: School Name, Sub-info, and Clean Status Group */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-white tracking-tight truncate">{visit.school_name}</h3>
                            {visit.is_from_master_db ? (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Verified DB
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                New Discovery
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
                            <span>{visit.district}</span>
                            {visit.institution_type && (
                              <>
                                <span className="text-white/20">·</span>
                                <span>{visit.institution_type}</span>
                              </>
                            )}
                            {visit.student_strength && (
                              <>
                                <span className="text-white/20">·</span>
                                <span className="text-white/70">{visit.student_strength} students</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Elegant Status Indicators (Uncluttered) */}
                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          {/* Interest Level */}
                          <span className={cn(
                            "flex items-center gap-1.5 font-bold tracking-wide",
                            visit.interest_level === 'Hot' ? 'text-rose-400' :
                            visit.interest_level === 'Warm' ? 'text-amber-400' :
                            visit.interest_level === 'Cold' ? 'text-blue-400' : 'text-white/40'
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              visit.interest_level === 'Hot' ? 'bg-rose-400 animate-pulse' :
                              visit.interest_level === 'Warm' ? 'bg-amber-400' :
                              visit.interest_level === 'Cold' ? 'bg-blue-400' : 'bg-white/40'
                            )} />
                            {visit.interest_level}
                          </span>

                          <span className="text-white/20">|</span>

                          {/* Outcome Status */}
                          <span className={cn(
                            "font-bold tracking-tight",
                            visit.outcome_status === 'Won' ? 'text-emerald-400' :
                            visit.outcome_status === 'Lost' ? 'text-rose-400' :
                            'text-purple-300'
                          )}>
                            {visit.outcome_status}
                          </span>
                        </div>
                      </div>

                      {/* Contact Person & Direct Phone Call */}
                      <div className="flex items-center justify-between text-xs text-white/70 flex-wrap gap-2 pt-1 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-white/40" />
                          <span className="font-medium text-white/90">{visit.contact_person || 'Management'}</span>
                          {visit.phone && (
                            <>
                              <span className="text-white/20">·</span>
                              <a href={`tel:${visit.phone}`} className="text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold">
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

                      {/* Product Specifications (Minimalist Left Accent - No Clunky Box) */}
                      {visit.product_specifications && (
                        <div className="border-l-2 border-amber-400/40 pl-3.5 py-1 text-xs text-white/80 space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider text-amber-400/90 block font-bold">
                            Requirements &amp; Specifications
                          </span>
                          <p className="leading-relaxed text-white/75">{visit.product_specifications}</p>
                        </div>
                      )}

                      {/* Meeting Notes (Clean Left Border Quote) */}
                      {visit.notes && (
                        <div className="border-l-2 border-white/20 pl-3.5 py-0.5 text-xs text-white/60 italic leading-relaxed">
                          "{visit.notes}"
                        </div>
                      )}

                      {/* Photo Thumbnails */}
                      {Array.isArray(visit.attachments) && visit.attachments.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="text-[10px] uppercase text-white/40 flex items-center gap-1 mr-1 font-semibold">
                            <Camera className="w-3 h-3 text-amber-400" />
                            Photos ({visit.attachments.length}):
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

                      {/* Card Footer: Follow-up & Audit & Actions */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-3 text-[11px] text-white/50">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            Follow-up: <strong className={cn(isOverdue ? "text-rose-400 font-bold" : "text-white/80")}>
                              {visit.follow_up_date || 'None'}
                              {isOverdue && ' (Overdue)'}
                            </strong>
                          </span>

                          {visit.last_edited_by_name && (
                            <>
                              <span className="text-white/20 hidden sm:inline">·</span>
                              <button
                                type="button"
                                onClick={() => setInspectHistoryVisit(visit)}
                                className="text-white/40 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer text-[10px] font-medium"
                                title="Inspect audit history"
                              >
                                <History className="w-3 h-3 text-white/30" />
                                <span>Edited by {visit.last_edited_by_name} ({visit.edit_history?.length || 0})</span>
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => setEditingVisit(visit)}
                          className="px-3.5 py-1.5 bg-white/[0.05] hover:bg-amber-400/15 text-white/80 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Visit</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= TAB: PRIORITY FOLLOW-UPS ================= */}
          {activeTab === 'followups' && (
            <ErrorBoundary>
              <FollowUpsPipelineModule currentUser={user} canvasserScoped={true} />
            </ErrorBoundary>
          )}

          {/* ================= TAB 4: CANVASSER PERFORMANCE LEADERBOARD ================= */}
          {activeTab === 'leaderboard' && (
            <ErrorBoundary>
              <CanvasserLeaderboard currentUser={user} />
            </ErrorBoundary>
          )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#0c0d15]/90 backdrop-blur-2xl border-t border-white/[0.08] pb-safe z-50 px-2 py-2 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto p-1 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-2 flex flex-col items-center gap-1 rounded-xl transition-colors text-center z-10", 
                  isActive 
                    ? "text-amber-300 font-black" 
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="canvasserActiveBottomTab"
                    className="absolute inset-0 bg-amber-400/15 border border-amber-400/35 rounded-xl shadow-[0_0_12px_rgba(251,191,36,0.15)] -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                  />
                )}
                <div className="relative">
                  <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-200", isActive && "scale-110")} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black px-1 py-0.2 rounded-full min-w-[14px] text-center shadow">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight truncate max-w-full relative z-10">{tab.mobileLabel || tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Edit Visit Modal */}
      <EditVisitModal
        isOpen={!!editingVisit}
        onClose={() => setEditingVisit(null)}
        visit={editingVisit}
        onSave={handleUpdateVisit}
        onDelete={handleDeleteVisit}
        isManager={false}
      />

      {/* Audit History Inspector Modal */}
      <EditHistoryModal
        isOpen={!!inspectHistoryVisit}
        onClose={() => setInspectHistoryVisit(null)}
        visit={inspectHistoryVisit}
      />

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {previewImage && createPortal(
          <div 
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-xl max-h-[85vh] p-2 bg-murugan-card border border-white/20 rounded-3xl shadow-2xl overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-white/20 text-white rounded-full transition-colors z-10"
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
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 z-50 whitespace-nowrap backdrop-blur-md",
              toast.type === 'error'
                ? "bg-red-600/95 text-white shadow-red-600/30 border border-red-400/30"
                : "bg-emerald-500/95 text-white shadow-emerald-500/30 border border-emerald-400/30"
            )}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
