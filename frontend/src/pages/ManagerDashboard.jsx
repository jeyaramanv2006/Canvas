import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Download, Users, TrendingUp, Target, Briefcase, 
  Search, Filter, Edit3, Trash2, Calendar, Phone, MapPin, 
  Building2, CheckCircle2, ChevronRight, Eye, RefreshCw, Layers, Receipt, History,
  Sparkles, ShieldCheck, Trophy, FileText, Camera, Image, X
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';
import EditVisitModal from '../components/EditVisitModal';
import EditHistoryModal from '../components/EditHistoryModal';
import InvoicingModule from '../components/InvoicingModule';
import InvoiceDocumentModal from '../components/InvoiceDocumentModal';
import DynamicKPISection from '../components/DynamicKPISection';
import { isAdmin, getRoleConfig, canAccessSensitiveFinancials } from '../lib/rbac';
import { cn } from '../lib/utils';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280']; // Hot, Warm, Cold, Not Interested

export default function ManagerDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'invoicing', 'logs', 'team'
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search for Logs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCanvasser, setSelectedCanvasser] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all'); // 'all', 'master', 'custom'

  // Modal State
  const [editingVisit, setEditingVisit] = useState(null);
  const [inspectHistoryVisit, setInspectHistoryVisit] = useState(null);
  const [docModalVisit, setDocModalVisit] = useState(null);
  const [docModalType, setDocModalType] = useState('quote');
  const [previewImage, setPreviewImage] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const roleConfig = getRoleConfig(user);
  const canSeeFinances = canAccessSensitiveFinancials(user);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, visitsData, lboardData] = await Promise.all([
        mockApi.getDashboardStats(),
        mockApi.getVisits(user.id, user.role),
        mockApi.getCanvasserLeaderboard()
      ]);
      setStats(statsData);
      setVisits(visitsData);
      setLeaderboard(lboardData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisit = async (id, updatedData) => {
    await mockApi.updateVisit(id, updatedData, user);
    showToast("Visit updated successfully!");
    await loadAllData();
  };

  const handleDeleteVisit = async (id) => {
    await mockApi.deleteVisit(id);
    showToast("Visit deleted successfully!");
    await loadAllData();
  };

  const handleExportCSV = () => {
    mockApi.exportToCSV(filteredVisits);
    showToast(`Exported ${filteredVisits.length} records to CSV`);
  };

  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      (v.school_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.canvasser_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistrict = selectedDistrict === 'all' || v.district === selectedDistrict;
    const matchesCanvasser = selectedCanvasser === 'all' || String(v.canvasser_id) === String(selectedCanvasser);
    const matchesStatus = selectedStatus === 'all' || v.outcome_status === selectedStatus;
    const matchesOrigin = selectedOrigin === 'all' || 
      (selectedOrigin === 'master' && v.is_from_master_db) ||
      (selectedOrigin === 'custom' && !v.is_from_master_db);

    return matchesSearch && matchesDistrict && matchesCanvasser && matchesStatus && matchesOrigin;
  });

  const uniqueDistricts = Array.from(new Set(visits.map(v => v.district).filter(Boolean)));
  const uniqueCanvassers = stats?.canvasserStats || [];

  const navTabs = [
    { id: 'overview', label: 'Executive Analytics', icon: TrendingUp },
    { id: 'invoicing', label: 'Invoicing & Financials', icon: Receipt },
    { id: 'logs', label: `Visit Logs (${visits.length})`, icon: History },
    { id: 'team', label: 'Team Leaderboard', icon: Users }
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-murugan-dark text-white">
        <p>Loading executive portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-16 selection:bg-murugan-accent selection:text-black">
      <header className="bg-[#14151b]/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center font-black text-black text-sm shadow-lg shadow-amber-400/20">
                MC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white">Murugan Canvass</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Executive Room
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sudhan (General Manager)</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Executive Control</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setUser(null)}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 relative",
                    isActive 
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-xl shadow-amber-400/20 font-black scale-[1.02]" 
                      : "bg-[#1c1d25] text-gray-400 hover:text-white hover:bg-[#252632] border border-white/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <DynamicKPISection currentUser={user} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-murugan-accent" />
                    School Pipeline Lead Temperature
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.interestData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.interestData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} 
                        itemStyle={{ color: '#ffffff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  {stats.interestData.map((d, i) => (
                    <div key={d.name} className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <div>
                        <p className="text-gray-400 text-[10px]">{d.name}</p>
                        <p className="font-bold text-white text-xs">{d.value} Schools</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-murugan-accent" />
                    District Market Penetration
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.districtData.slice(0, 5)} layout="vertical">
                      <XAxis type="number" stroke="#6b7280" fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={90} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} 
                        itemStyle={{ color: '#ffffff' }}
                      />
                      <Bar dataKey="visits" fill="#eab308" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-400 pt-2">
                  Top performing districts with active field canvasser penetration.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'invoicing' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <InvoicingModule currentUser={user} />
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-[#181922] to-[#13141a] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-murugan-accent" />
                  Central Field Visit Registry
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{filteredVisits.length} visits matching filters</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-murugan-accent/20 transition-all self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 bg-gradient-to-br from-[#181922] to-[#13141a] p-3.5 rounded-2xl border border-white/10 shadow-md">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search school, district, notes, canvasser..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
                />
              </div>

              <select
                value={selectedOrigin}
                onChange={e => setSelectedOrigin(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
              >
                <option value="all">All Sources</option>
                <option value="master">🏛️ Master DB Schools</option>
                <option value="custom">🆕 Newly Discovered</option>
              </select>

              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
              >
                <option value="all">All Districts</option>
                {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={selectedCanvasser}
                onChange={e => setSelectedCanvasser(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
              >
                <option value="all">All Canvassers</option>
                {uniqueCanvassers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select
                value={selectedInterest}
                onChange={e => setSelectedInterest(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
              >
                <option value="all">All Interests</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
                <option value="Not Interested">Not Interested</option>
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
              >
                <option value="all">All Outcomes</option>
                <option value="Open">Open</option>
                <option value="Sample Sent">Sample Sent</option>
                <option value="Quote Given">Quote Given</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            {filteredVisits.length === 0 ? (
              <div className="bg-murugan-card p-12 rounded-3xl border border-white/5 text-center">
                <p className="text-sm font-bold text-gray-300">No field visits matched the current criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVisits.map((visit, idx) => {
                  return (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] p-5 rounded-2xl border border-white/10 hover:border-amber-500/30 shadow-xl hover:shadow-2xl transition-all space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-white">{visit.school_name}</h4>
                            {visit.is_from_master_db ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                                🏛️ Master DB
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                                🆕 Newly Discovered
                              </span>
                            )}
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              visit.outcome_status === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              visit.outcome_status === 'Lost' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              visit.outcome_status === 'Sample Sent' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              visit.outcome_status === 'Quote Given' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            )}>
                              {visit.outcome_status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-500" />
                              <span>{visit.district} • {visit.institution_type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-500" />
                              <span>Canvassed by: <strong className="text-murugan-accent">{visit.canvasser_name || 'Canvasser'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-500" />
                              <span>{visit.contact_person} ({visit.phone})</span>
                            </div>
                          </div>

                          {/* Product Interests Tags */}
                          {Array.isArray(visit.product_interests) && visit.product_interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {visit.product_interests.map(p => (
                                <span key={p} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-medium">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Product Specifications Note */}
                          {visit.product_specifications && (
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                                <FileText className="w-3 h-3" />
                                <span>Product Specifications Requested:</span>
                              </div>
                              <p className="text-xs text-gray-200">{visit.product_specifications}</p>
                            </div>
                          )}

                          {/* Sample Photo Attachments */}
                          {Array.isArray(visit.attachments) && visit.attachments.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                <Camera className="w-3 h-3 text-murugan-accent" />
                                Reference Photos ({visit.attachments.length})
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

                          {/* Audit Trail Info */}
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

                          <div className="flex flex-wrap items-center gap-2 mt-4 pt-2 border-t border-white/5">
                            <button
                              onClick={() => { setDocModalType('quote'); setDocModalVisit(visit); }}
                              className="px-3 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-murugan-accent/10 transition-all"
                            >
                              <Receipt className="w-3.5 h-3.5" /> + Issue Quote
                            </button>
                            <button
                              onClick={() => { setDocModalType('invoice'); setDocModalVisit(visit); }}
                              className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-400" /> + Tax Invoice
                            </button>
                            <button
                              onClick={() => setEditingVisit(visit)}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-murugan-accent" /> Edit Record
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-murugan-accent" />
                    Field Canvassers Performance & Commission Leaderboard
                  </h3>
                  <p className="text-xs text-gray-400">Live rankings and tiered commission slab tracking (1% to 5%)</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[720px]">
                  <thead className="bg-black/40">
                    <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Rank & Canvasser</th>
                      <th className="py-3 px-4">Total Invoiced (Credited)</th>
                      <th className="py-3 px-4">Commission Slab</th>
                      <th className="py-3 px-4">Commission Earned</th>
                      <th className="py-3 px-4">Visits Logged</th>
                      <th className="py-3 px-4">Won Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/20">
                    {(leaderboard?.rankings || stats?.canvasserStats || []).map((canvasser) => (
                      <tr key={canvasser.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-white/5 text-gray-300 flex items-center justify-center text-xs font-bold font-mono">
                            #{canvasser.rank || 1}
                          </span>
                          <span>{canvasser.name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-black font-mono text-murugan-accent whitespace-nowrap">{canvasser.formattedInvoiced || '₹0.00'}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            {canvasser.commissionRate || 1}% Slab
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black font-mono text-emerald-400 whitespace-nowrap">
                          {canvasser.formattedCommission || '₹0'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-300 font-semibold">{canvasser.totalVisits || canvasser.visits || 0}</td>
                        <td className="py-3.5 px-4 text-emerald-400 font-bold">{canvasser.wonOrders || canvasser.won || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <EditVisitModal isOpen={!!editingVisit} onClose={() => setEditingVisit(null)} visit={editingVisit} onSave={handleUpdateVisit} onDelete={handleDeleteVisit} isManager={true} />
      <EditHistoryModal isOpen={!!inspectHistoryVisit} onClose={() => setInspectHistoryVisit(null)} visit={inspectHistoryVisit} />
      <InvoiceDocumentModal
        isOpen={!!docModalVisit}
        onClose={() => setDocModalVisit(null)}
        type={docModalType}
        mode="create"
        visitData={docModalVisit}
        currentUser={user}
        onSaveSuccess={() => {
          showToast(docModalType === 'quote' ? "Quotation generated!" : "Invoice generated!");
          loadAllData();
        }}
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

      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-2 z-50">
            <CheckCircle2 className="w-5 h-5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
