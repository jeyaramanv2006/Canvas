import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Download, Users, TrendingUp, Target, Briefcase, 
  Search, Filter, Edit3, Trash2, Calendar, Phone, MapPin, 
  Building2, CheckCircle2, ChevronRight, Eye, RefreshCw, Layers, Receipt, History,
  Megaphone, Sparkles, ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';
import EditVisitModal from '../components/EditVisitModal';
import EditHistoryModal from '../components/EditHistoryModal';
import InvoicingModule from '../components/InvoicingModule';
import DynamicKPISection from '../components/DynamicKPISection';
import MarketingCampaignsModule from '../components/MarketingCampaignsModule';
import { isAdmin, getRoleConfig, canAccessSensitiveFinancials } from '../lib/rbac';
import { cn } from '../lib/utils';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280']; // Hot, Warm, Cold, Not Interested

export default function ManagerDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'invoicing', 'marketing', 'logs', 'team'
  const [stats, setStats] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search for Logs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCanvasser, setSelectedCanvasser] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [editingVisit, setEditingVisit] = useState(null);
  const [inspectHistoryVisit, setInspectHistoryVisit] = useState(null);
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
      const [statsData, visitsData] = await Promise.all([
        mockApi.getDashboardStats(),
        mockApi.getVisits(user.id, user.role)
      ]);
      setStats(statsData);
      setVisits(visitsData);
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

  // Filtered visits logic
  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      (v.school_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.canvasser_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistrict = selectedDistrict === 'all' || v.district === selectedDistrict;
    const matchesCanvasser = selectedCanvasser === 'all' || String(v.canvasser_id) === String(selectedCanvasser);
    const matchesInterest = selectedInterest === 'all' || v.interest_level === selectedInterest;
    const matchesStatus = selectedStatus === 'all' || v.outcome_status === selectedStatus;

    return matchesSearch && matchesDistrict && matchesCanvasser && matchesInterest && matchesStatus;
  });

  const uniqueDistricts = Array.from(new Set(visits.map(v => v.district).filter(Boolean)));
  const uniqueCanvassers = stats?.canvasserStats || [];

  const navTabs = [
    { id: 'overview', label: '📊 Executive Analytics', icon: TrendingUp },
    { id: 'invoicing', label: '🧾 Invoicing & Financials', icon: Receipt },
    { id: 'marketing', label: '📣 Marketing Hub', icon: Megaphone },
    { id: 'logs', label: `📋 All Visit Logs (${visits.length})`, icon: Layers },
    { id: 'team', label: '👥 Field Team Leaderboard', icon: Users }
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-murugan-dark text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-murugan-accent" />
          <p className="text-gray-400 font-medium">Loading executive portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-16 selection:bg-murugan-accent selection:text-black">
      {/* Top Navigation Bar */}
      <header className="bg-murugan-card/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20">
                <span className="font-black text-black text-base tracking-tight">MC</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-white">Murugan Canvass</h1>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Executive Portal
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  <span className="text-gray-200 font-semibold">{user.name}</span> • {user.roleTitle || 'Executive Director'}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 bg-murugan-accent text-black hover:bg-yellow-400 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-murugan-accent/20"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span> ({filteredVisits.length})
              </button>
              <button 
                onClick={() => setUser(null)} 
                title="Sign Out"
                className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-t border-white/5 pt-1 overflow-x-auto scrollbar-none">
            {navTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-murugan-accent text-murugan-accent bg-white/5 rounded-t-xl"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* ================= TAB 1: OVERVIEW & LEADERSHIP KPIS ================= */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Dynamic Role-Based KPI Section for Admin */}
            <DynamicKPISection currentUser={user} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interest Breakdown Doughnut Chart */}
              <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Pipeline Interest Breakdown</h3>
                    <p className="text-xs text-gray-400">Distribution of leads by urgency stage</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.interestData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.interestData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/5">
                  {stats.interestData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs text-gray-300">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index] }} />
                      <span className="truncate">{entry.name}: <strong className="text-white">{entry.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Districts Bar Chart */}
              <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">District Expansion Traction</h3>
                    <p className="text-xs text-gray-400">Ranked by volume of logged institution visits</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.districtData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#777" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#777" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                      />
                      <Bar dataKey="visits" fill="#FFD700" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-gray-400 mt-4 pt-4 border-t border-white/5">
                  Top performing territory: <span className="text-murugan-accent font-bold">{stats.districtData[0]?.name || 'N/A'}</span> ({stats.districtData[0]?.visits || 0} visits)
                </p>
              </div>
            </div>

            {/* Product Demand Breakdown */}
            <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1">Product Demand in Field</h3>
              <p className="text-xs text-gray-400 mb-4">Total lead inquiries tagged per apparel category</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {stats.productData.map((p) => (
                  <div key={p.name} className="p-3.5 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/20 transition-all">
                    <span className="text-xs text-gray-400 font-medium truncate">{p.name}</span>
                    <span className="text-2xl font-black text-white mt-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 2: INVOICING & FINANCIALS ================= */}
        {activeTab === 'invoicing' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <InvoicingModule currentUser={user} />
          </motion.div>
        )}

        {/* ================= TAB 3: MARKETING HUB ================= */}
        {activeTab === 'marketing' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MarketingCampaignsModule currentUser={user} />
          </motion.div>
        )}

        {/* ================= TAB 4: ALL VISIT LOGS ================= */}
        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Filter and Search Bar Card */}
            <div className="bg-murugan-card p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by school, district, contact person, or canvasser name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent"
                  />
                </div>
                {(searchQuery || selectedDistrict !== 'all' || selectedCanvasser !== 'all' || selectedInterest !== 'all' || selectedStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDistrict('all');
                      setSelectedCanvasser('all');
                      setSelectedInterest('all');
                      setSelectedStatus('all');
                    }}
                    className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Multi Filters Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1 font-medium">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={e => setSelectedDistrict(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
                  >
                    <option value="all">All Districts ({uniqueDistricts.length})</option>
                    {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-medium">Canvasser</label>
                  <select
                    value={selectedCanvasser}
                    onChange={e => setSelectedCanvasser(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
                  >
                    <option value="all">All Canvassers</option>
                    {uniqueCanvassers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-medium">Interest Level</label>
                  <select
                    value={selectedInterest}
                    onChange={e => setSelectedInterest(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
                  >
                    <option value="all">All Interests</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-medium">Deal Outcome</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
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
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-gray-400">
                Showing <span className="font-bold text-white">{filteredVisits.length}</span> of {visits.length} logged visits
              </p>
            </div>

            {/* Visit Logs List */}
            {filteredVisits.length === 0 ? (
              <div className="bg-murugan-card p-12 text-center rounded-3xl border border-white/10">
                <p className="text-gray-400 font-medium">No matching visit logs found.</p>
                <p className="text-xs text-gray-600 mt-1">Try relaxing your search query or filter selections.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVisits.map((visit) => {
                  const isOverdue = visit.follow_up_date && new Date(visit.follow_up_date) < new Date();
                  
                  return (
                    <motion.div
                      layout
                      key={visit.id}
                      className="bg-murugan-card border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 transition-all shadow-md hover:shadow-xl"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base sm:text-lg font-bold text-white">{visit.school_name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-medium">
                              {visit.institution_type}
                            </span>
                            <span className={cn(
                              "text-xs px-2.5 py-0.5 rounded-full font-bold",
                              visit.interest_level === 'Hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              visit.interest_level === 'Warm' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              visit.interest_level === 'Cold' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            )}>
                              {visit.interest_level}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-md font-bold",
                              visit.outcome_status === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              visit.outcome_status === 'Lost' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            )}>
                              {visit.outcome_status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-500" />
                              <span>{visit.district}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-500" />
                              <span>Logged by: <strong className="text-murugan-accent">{visit.canvasser_name || 'Canvasser'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-500" />
                              <span>{visit.contact_person} ({visit.phone})</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-xs text-gray-500">Products:</span>
                            {Array.isArray(visit.product_interests) && visit.product_interests.map(p => (
                              <span key={p} className="text-xs bg-black/40 border border-white/5 px-2 py-0.5 rounded text-murugan-accent font-medium">
                                {p}
                              </span>
                            ))}
                            {visit.student_strength && (
                              <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400">
                                ~{visit.student_strength} students
                              </span>
                            )}
                          </div>
                          
                          {visit.notes && (
                            <p className="text-xs text-gray-300 bg-black/30 p-2.5 rounded-xl border border-white/5 italic">
                              "{visit.notes}"
                            </p>
                          )}

                          {visit.last_edited_by_name && (
                            <div className="flex items-center justify-between text-[11px] text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                              <span>Modified by <strong className="text-gray-200">{visit.last_edited_by_name}</strong> ({visit.last_edited_by_role || 'Staff'})</span>
                              <button
                                type="button"
                                onClick={() => setInspectHistoryVisit(visit)}
                                className="text-murugan-accent font-semibold hover:underline flex items-center gap-1"
                              >
                                <History className="w-3.5 h-3.5" />
                                Audit Trail ({visit.edit_history?.length || 0})
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex md:flex-col justify-between items-end md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                          <div className="text-right">
                            <span className="text-[11px] text-gray-500 block">Follow-up Date</span>
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5",
                              isOverdue ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-gray-300"
                            )}>
                              {visit.follow_up_date || 'None set'}
                              {isOverdue && ' (Overdue)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setInspectHistoryVisit(visit)}
                              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-murugan-accent flex items-center gap-1 transition-all"
                            >
                              <History className="w-3.5 h-3.5" />
                              Audit
                            </button>
                            <button
                              onClick={() => setEditingVisit(visit)}
                              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-murugan-accent rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all group shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-murugan-accent group-hover:scale-110 transition-transform" />
                              Edit Details
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

        {/* ================= TAB 5: TEAM PERFORMANCE ================= */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1">Field Canvassers Performance Leaderboard</h3>
              <p className="text-xs text-gray-400 mb-6">Track visit volume, hot leads generated, and closed orders per Canvasser</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Canvasser Name</th>
                      <th className="py-3 px-4">Total Visits Logged</th>
                      <th className="py-3 px-4">Hot Leads</th>
                      <th className="py-3 px-4">Won Orders</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.canvasserStats.map((canvasser) => (
                      <tr key={canvasser.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-murugan-accent font-bold text-xs">
                            {canvasser.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {canvasser.name}
                        </td>
                        <td className="py-4 px-4 text-gray-300 font-semibold">{canvasser.visits} visits</td>
                        <td className="py-4 px-4 text-red-400 font-bold">{canvasser.hot} hot</td>
                        <td className="py-4 px-4 text-emerald-400 font-bold">{canvasser.won} won</td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedCanvasser(canvasser.id);
                              setActiveTab('logs');
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-murugan-accent inline-flex items-center gap-1 transition-all"
                          >
                            View Logs
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* Reusable Edit Visit Modal */}
      <EditVisitModal
        isOpen={!!editingVisit}
        onClose={() => setEditingVisit(null)}
        visit={editingVisit}
        onSave={handleUpdateVisit}
        onDelete={handleDeleteVisit}
        isManager={true}
      />

      {/* Audit History Inspector Modal */}
      <EditHistoryModal
        isOpen={!!inspectHistoryVisit}
        onClose={() => setInspectHistoryVisit(null)}
        visit={inspectHistoryVisit}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-2 z-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
