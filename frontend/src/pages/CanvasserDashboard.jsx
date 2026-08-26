import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Plus, List, LogOut, CheckCircle2, TrendingUp, Calendar, 
  MapPin, Building2, User, Phone, Users, Edit3, Trash2, Search, Filter, History,
  ChevronRight, Sparkles, Target, Award, ArrowUpRight, Trophy, Image, Camera,
  FileText, X, AlertCircle
} from 'lucide-react';
import { mockApi, calculateCommissionSlab } from '../mockApi';
import { AuthContext } from '../App';
import EditVisitModal from '../components/EditVisitModal';
import EditHistoryModal from '../components/EditHistoryModal';
import DynamicKPISection from '../components/DynamicKPISection';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import SchoolSearchPicker from '../components/SchoolSearchPicker';
import { getRoleConfig, isCanvasser } from '../lib/rbac';
import { cn } from '../lib/utils';

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

  // Editing and Modal State
  const [editingVisit, setEditingVisit] = useState(null);
  const [inspectHistoryVisit, setInspectHistoryVisit] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Filters for "My Visits" tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInterest, setFilterInterest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const roleConfig = getRoleConfig(user);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard Overview', mobileLabel: 'Overview', icon: LayoutDashboard },
    { id: 'new', label: 'Log School Visit', mobileLabel: 'Log Visit', icon: Plus },
    { id: 'list', label: 'My Visits', mobileLabel: 'My Visits', icon: List },
    { id: 'leaderboard', label: 'Team Leaderboard', mobileLabel: 'Leaderboard', icon: Trophy }
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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadVisits = async () => {
    setLoading(true);
    const data = await mockApi.getVisits(user.id, user.role);
    setVisits(data);
    setLoading(false);
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const newAttachment = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          name: file.name,
          url: uploadEvent.target.result,
          type: file.type,
          timestamp: new Date().toISOString()
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attId) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        follow_up_date: formData.noFollowUp ? null : (formData.follow_up_date || null)
      };
      await mockApi.addVisit(payload, user.id, user.name);
      showToast("School visit logged successfully!");
      
      setFormData({
        school_name: '', district: '', institution_type: 'School', 
        contact_person: '', phone: '', student_strength: '', 
        product_interests: [], product_specifications: '', attachments: [],
        interest_level: 'Warm', outcome_status: 'Open', follow_up_date: '', noFollowUp: false, notes: '',
        is_from_master_db: false, master_school_id: null, cluster_or_block: ''
      });
      setActiveTab('list');
      await loadVisits();
    } catch (err) {
      alert("Failed to save visit: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVisit = async (id, updatedData) => {
    await mockApi.updateVisit(id, updatedData, user);
    showToast("Visit updated successfully!");
    await loadVisits();
  };

  const handleDeleteVisit = async (id) => {
    await mockApi.deleteVisit(id);
    showToast("Visit deleted successfully!");
    await loadVisits();
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
      <div className="min-h-screen bg-murugan-dark flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-murugan-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-xs">Loading field canvassing terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-24 selection:bg-murugan-accent selection:text-black">
      {/* Top Header & Desktop Nav */}
      <header className="bg-murugan-card/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-md shadow-amber-400/20">
                MC
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight">Murugan Canvass</h1>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user.name}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-amber-400 font-semibold">{user.roleTitle || 'Field Sales'}</span>
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10">
              {navTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                      isActive
                        ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-400/20 font-black"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setUser(null)} 
              title="Sign Out"
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white border border-white/5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile sub-tabs scrollbar for quick top navigation */}
          <div className="flex md:hidden space-x-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                      ? "bg-murugan-accent text-black shadow-md font-black"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.mobileLabel || tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AnimatePresence mode="wait">
          
          {/* ================= TAB 1: DEDICATED DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Quick Action Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-murugan-card to-murugan-card border border-amber-500/30 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    Field Sales Workspace
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-2">Ready to log today's visits?</h2>
                  <p className="text-xs text-gray-300 mt-1 max-w-xs">
                    Capture school details, tag apparel interests, and issue instant formal quotations.
                  </p>
                  <div className="flex gap-2.5 mt-4">
                    <button
                      onClick={() => setActiveTab('new')}
                      className="px-4 py-2.5 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-murugan-accent/20 flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Log New Visit
                    </button>
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
                    >
                      <Trophy className="w-4 h-4 text-murugan-accent" />
                      Leaderboard
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Field Performance KPI Cards */}
              <DynamicKPISection currentUser={user} />

              {/* Pipeline Quick Summary */}
              <div className="bg-murugan-card p-5 rounded-3xl border border-white/10 shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-murugan-accent" />
                    Lead Pipeline Breakdown
                  </h3>
                  <button 
                    onClick={() => setActiveTab('list')}
                    className="text-xs text-murugan-accent font-semibold hover:underline flex items-center gap-1"
                  >
                    View All ({visits.length})
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <span className="text-[11px] font-semibold text-red-300 block">Hot Leads</span>
                    <span className="text-2xl font-black text-red-400 mt-1 block">{hotVisits.length}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Ready for sample/quote</span>
                  </div>
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <span className="text-[11px] font-semibold text-emerald-300 block">Deals Won</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">{wonVisits.length}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Converted orders</span>
                  </div>
                </div>
              </div>

              {/* Recent School Visits */}
              <div className="bg-murugan-card p-5 rounded-3xl border border-white/10 shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-murugan-accent" />
                    Recent Field Activity
                  </h3>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="text-xs text-gray-400 hover:text-white font-medium"
                  >
                    See all
                  </button>
                </div>

                <div className="space-y-2.5">
                  {visits.slice(0, 3).map((visit) => (
                    <div 
                      key={visit.id}
                      onClick={() => setActiveTab('list')}
                      className="p-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/15 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">{visit.school_name}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">{visit.district} • {visit.contact_person}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        visit.interest_level === 'Hot' ? 'bg-red-500/20 text-red-400' :
                        visit.interest_level === 'Warm' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'
                      )}>
                        {visit.outcome_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= TAB 2: CLEAN NEW VISIT FORM ================= */}
          {activeTab === 'new' && (
            <motion.form 
              key="new"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit} 
              className="space-y-5 bg-murugan-card border border-white/10 p-5 rounded-3xl shadow-xl"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Log School Visit</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Enter visit outcome and school requirements</p>
                </div>
                <span className="text-[11px] font-bold bg-murugan-accent/10 text-murugan-accent border border-murugan-accent/20 px-2.5 py-1 rounded-xl">
                  Field Entry
                </span>
              </div>
              
              {/* Institution Selection via Master Database Picker */}
              <div className="pt-2">
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
                      institution_type: data.institution_type,
                      is_from_master_db: data.is_from_master_db,
                      master_school_id: data.master_school_id,
                      cluster_or_block: data.cluster_or_block || ''
                    }));
                  }}
                />
              </div>

              {/* Contact Details */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Contact Person & Strength</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      required 
                      placeholder="Contact Person (e.g. Principal)" 
                      value={formData.contact_person} 
                      onChange={e => setFormData({...formData, contact_person: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      required 
                      type="tel" 
                      placeholder="Phone Number" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
                    />
                  </div>
                </div>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input 
                    type="number" 
                    placeholder="Est. Student Strength (e.g. 1500)" 
                    value={formData.student_strength} 
                    onChange={e => setFormData({...formData, student_strength: Number(e.target.value) || ''})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
                  />
                </div>
              </div>

              {/* Product Interests Multi-select Chips */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Product Interests</p>
                  <span className="text-[11px] text-murugan-accent font-medium">Tap to Select</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableProducts.map(product => {
                    const isSelected = formData.product_interests.includes(product);
                    return (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        key={product}
                        onClick={() => handleProductToggle(product)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          isSelected 
                            ? "bg-murugan-accent text-black border-murugan-accent shadow-md shadow-murugan-accent/20" 
                            : "bg-black/40 text-gray-300 border-white/10 hover:border-gray-500"
                        )}
                      >
                        {product}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Product Specifications & Custom Requirements */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-murugan-accent" />
                    Product Specifications & Custom Requirements
                  </p>
                  <span className="text-[10px] text-gray-400">Principal's specs</span>
                </div>
                <textarea 
                  rows={3}
                  placeholder="Type specific material or design requirements (e.g. 100% combed cotton, 220 GSM uniform fabric, double-ribbed socks with school crest, customized buckle)..." 
                  value={formData.product_specifications} 
                  onChange={e => setFormData({...formData, product_specifications: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 focus:border-murugan-accent/50 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent/30 resize-none" 
                />
              </div>

              {/* Sample Photos / Reference Image Attachment */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-murugan-accent" />
                    Sample Photos & Reference Images
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formData.attachments?.length || 0} attached
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 bg-black/60 hover:bg-white/10 border border-dashed border-white/20 hover:border-murugan-accent rounded-xl text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-all">
                    <Image className="w-4 h-4 text-murugan-accent" />
                    <span>+ Attach Sample Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                  <span className="text-[11px] text-gray-400">Attach photos of previous uniform/sock samples</span>
                </div>

                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {formData.attachments.map(att => (
                      <div key={att.id} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/20 bg-black shadow-md">
                        <img 
                          src={att.url} 
                          alt={att.name} 
                          onClick={() => setPreviewImage(att.url)}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 text-white rounded-full transition-colors"
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
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Interest Level</p>
                <div className="grid grid-cols-2 gap-2">
                  {INTEREST_LEVELS.map(level => (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      key={level.label}
                      onClick={() => setFormData({...formData, interest_level: level.label})}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold",
                        formData.interest_level === level.label 
                          ? `${level.color} border-transparent text-white shadow-lg` 
                          : `bg-black/40 ${level.border} ${level.text} hover:bg-white/5`
                      )}
                    >
                      {formData.interest_level === level.label && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{level.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Outcome Status / Deal Stage Selection (Restricted for Canvassers) */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Visit Outcome</p>
                  <span className="text-[10px] text-gray-400">Quotes/Orders handled by Admin</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CANVASSER_OUTCOME_STATUSES.map(status => {
                    const isSelected = formData.outcome_status === status;
                    return (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        key={status}
                        onClick={() => setFormData({...formData, outcome_status: status})}
                        className={cn(
                          "py-2.5 px-2 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1",
                          isSelected
                            ? status === 'Sample Sent'
                              ? "bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20"
                              : status === 'Not Interested'
                              ? "bg-gray-700 text-white border-gray-500"
                              : "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20"
                            : "bg-black/40 text-gray-400 border-white/10 hover:border-white/20"
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
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Next Action Follow-up</p>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-white">
                    <input 
                      type="checkbox"
                      checked={formData.noFollowUp}
                      onChange={e => setFormData({
                        ...formData, 
                        noFollowUp: e.target.checked,
                        follow_up_date: e.target.checked ? '' : formData.follow_up_date
                      })}
                      className="rounded border-white/20 bg-black text-murugan-accent focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>No Follow-up Needed</span>
                  </label>
                </div>

                {!formData.noFollowUp && (
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      type="date" 
                      value={formData.follow_up_date} 
                      onChange={e => setFormData({...formData, follow_up_date: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent [color-scheme:dark]" 
                    />
                  </div>
                )}

                <textarea 
                  placeholder="Additional field notes / principal discussion summary..." 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent h-20 resize-none" 
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
                type="submit"
                className="w-full bg-murugan-accent text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-murugan-accent/20 hover:bg-yellow-400 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Saving School Visit...' : 'Submit School Visit'}
              </motion.button>
            </motion.form>
          )}

          {/* ================= TAB 3: MY VISITS LIST & EDIT ================= */}
          {activeTab === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-white">My Field Visits</h2>
                  <p className="text-xs text-gray-400">{filteredVisits.length} recorded visits</p>
                </div>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-3 py-1.5 bg-murugan-accent hover:bg-yellow-400 text-black font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-murugan-accent/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Visit
                </button>
              </div>

              {/* Search and Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by school, district, contact person..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-murugan-card border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
                  />
                </div>

                <div className="flex gap-2 text-xs">
                  <select
                    value={filterInterest}
                    onChange={e => setFilterInterest(e.target.value)}
                    className="flex-1 bg-murugan-card border border-white/10 rounded-xl p-2.5 text-gray-300 focus:ring-1 focus:ring-murugan-accent text-xs"
                  >
                    <option value="all">All Interests</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="flex-1 bg-murugan-card border border-white/10 rounded-xl p-2.5 text-gray-300 focus:ring-1 focus:ring-murugan-accent text-xs"
                  >
                    <option value="all">All Outcomes</option>
                    <option value="Open">Open</option>
                    <option value="Sample Sent">Sample Sent</option>
                    <option value="Quote Given">Quote Given</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              {/* List of Visits */}
              {loading ? (
                <p className="text-gray-400 text-center py-10 text-xs">Loading field records...</p>
              ) : filteredVisits.length === 0 ? (
                <div className="text-center py-12 bg-murugan-card rounded-3xl border border-white/5 p-5">
                  <p className="text-sm text-gray-300 font-bold">No visits found.</p>
                  <p className="text-xs text-gray-500 mt-1">Tap "New Visit" to log your school visit.</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-3 px-4 py-2 bg-murugan-accent text-black font-bold text-xs rounded-xl"
                  >
                    Log Visit Now
                  </button>
                </div>
              ) : (
                filteredVisits.map((visit, idx) => {
                  const isOverdue = visit.follow_up_date && new Date(visit.follow_up_date) < new Date();
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      key={visit.id} 
                      className="bg-murugan-card p-4 rounded-2xl border border-white/10 shadow-md space-y-3 relative overflow-hidden hover:border-white/20 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white">{visit.school_name}</h3>
                            {visit.is_from_master_db ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                                🏛️ DB School
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                                🆕 New Discovery
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{visit.district} • {visit.institution_type}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                            visit.interest_level === 'Hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            visit.interest_level === 'Warm' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            visit.interest_level === 'Cold' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                            'bg-gray-500/20 text-gray-400'
                          )}>
                            {visit.interest_level}
                          </span>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-bold",
                            visit.outcome_status === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            visit.outcome_status === 'Lost' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          )}>
                            {visit.outcome_status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Contact & Products */}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        <span>{visit.contact_person} ({visit.phone})</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(visit.product_interests) && visit.product_interests.map(p => (
                          <span key={p} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-medium">{p}</span>
                        ))}
                      </div>

                      {visit.product_specifications && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                            <FileText className="w-3 h-3" />
                            <span>Product Specifications:</span>
                          </div>
                          <p className="text-xs text-gray-200">{visit.product_specifications}</p>
                        </div>
                      )}

                      {/* Photo Attachments */}
                      {Array.isArray(visit.attachments) && visit.attachments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-murugan-accent" />
                            Sample Photos ({visit.attachments.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {visit.attachments.map((att, i) => (
                              <div 
                                key={att.id || i} 
                                onClick={() => setPreviewImage(att.url)}
                                className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 cursor-pointer hover:border-murugan-accent hover:scale-105 transition-all shadow-md bg-black"
                              >
                                <img src={att.url} alt={att.name || 'Sample'} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {visit.notes && (
                        <p className="text-xs text-gray-300 bg-black/30 p-2.5 rounded-xl border border-white/5 italic">
                          "{visit.notes}"
                        </p>
                      )}

                      {/* Audit Trail Metadata */}
                      {visit.last_edited_by_name && (
                        <div className="flex items-center justify-between text-[10px] text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-xl">
                          <span>Modified by <strong className="text-gray-200">{visit.last_edited_by_name}</strong></span>
                          <button
                            type="button"
                            onClick={() => setInspectHistoryVisit(visit)}
                            className="text-murugan-accent font-semibold hover:underline flex items-center gap-1"
                          >
                            <History className="w-3 h-3" />
                            Audit History ({visit.edit_history?.length || 0})
                          </button>
                        </div>
                      )}
                      
                      {/* Action Footer */}
                      <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-xs">
                        <div className="text-gray-400 text-[11px]">
                          Follow-up: <span className={cn("font-bold", isOverdue ? "text-red-400" : "text-gray-200")}>
                            {visit.follow_up_date || 'None scheduled'}
                            {isOverdue && ' (Due)'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingVisit(visit)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-murugan-accent" />
                            Edit Visit
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ================= TAB 4: CANVASSER PERFORMANCE LEADERBOARD ================= */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <CanvasserLeaderboard currentUser={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#14151b]/95 backdrop-blur-2xl border-t border-white/10 pb-safe z-50 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-2 flex flex-col items-center gap-1 rounded-2xl transition-all relative", 
                  isActive 
                    ? "text-amber-400 bg-amber-500/10 font-black border border-amber-500/30 shadow-lg shadow-amber-500/10" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-tight">{tab.mobileLabel || tab.label}</span>
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
        {previewImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-xl max-h-[85vh] p-2 bg-murugan-card border border-white/20 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={previewImage} alt="Sample Preview" className="max-w-full max-h-[75vh] object-contain rounded-2xl mx-auto" />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 z-50 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
