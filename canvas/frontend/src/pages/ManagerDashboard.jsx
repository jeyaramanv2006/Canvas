import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Download, Users, TrendingUp, Target, Briefcase, 
  Search, Filter, Edit3, Trash2, Calendar, Phone, MapPin, 
  Building2, CheckCircle2, ChevronRight, Eye, RefreshCw, Layers
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';
import EditVisitModal from '../components/EditVisitModal';
import { cn } from '../lib/utils';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280']; // Hot, Warm, Cold, Not Interested

export default function ManagerDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'logs', 'team'
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
  const [viewingVisit, setViewingVisit] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

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
    await mockApi.updateVisit(id, updatedData);
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

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-murugan-dark text-white">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-murugan-accent" />
          <p className="text-gray-400 font-medium">Loading manager control room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-murugan-card border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-murugan-accent to-murugan-purple rounded-xl flex items-center justify-center shadow-lg shadow-murugan-accent/10">
                <span className="font-extrabold text-black text-lg">MC</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Murugan Canvass</h1>
                <p className="text-xs text-gray-400">Manager Command Center • {user.name}</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 bg-murugan-accent text-black hover:bg-yellow-400 rounded-xl text-xs font-bold transition-all shadow-md shadow-murugan-accent/10"
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
            {[
              { id: 'overview', label: 'Dashboard & Analytics', icon: TrendingUp },
              { id: 'logs', label: `All Canvass Logs (${visits.length})`, icon: Layers },
              { id: 'team', label: 'Field Team Performance', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-murugan-accent text-murugan-accent bg-white/5 rounded-t-lg"
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
        
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Visits Logged', value: stats.totalVisits, icon: Briefcase, color: 'text-blue-400', bg: 'from-blue-500/10 to-transparent' },
                { label: 'Active Hot Leads', value: stats.hotLeads, icon: Target, color: 'text-red-400', bg: 'from-red-500/10 to-transparent' },
                { label: 'Closed Orders (Won)', value: stats.ordersWon, icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent' },
                { label: 'Overall Win Rate', value: `${stats.winRate}%`, icon: CheckCircle2, color: 'text-murugan-accent', bg: 'from-yellow-500/10 to-transparent' },
              ].map((kpi, idx) => (
                <motion.div 
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={cn(
                    "bg-murugan-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b shadow-lg",
                    kpi.bg
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">{kpi.label}</p>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{kpi.value}</h3>
                </motion.div>
              ))}
            </div>

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
                {stats.productData.map((p, idx) => (
                  <div key={p.name} className="p-3.5 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <span className="text-xs text-gray-400 font-medium truncate">{p.name}</span>
                    <span className="text-2xl font-bold text-white mt-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= TAB 2: ALL VISIT LOGS ================= */}
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
                    placeholder="Search by school, district, contact person, or canvasser..."
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
                  <label className="text-gray-500 block mb-1">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={e => setSelectedDistrict(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
                  >
                    <option value="all">All Districts ({uniqueDistricts.length})</option>
                    {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 block mb-1">Canvasser</label>
                  <select
                    value={selectedCanvasser}
                    onChange={e => setSelectedCanvasser(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
                  >
                    <option value="all">All Field Staff</option>
                    {uniqueCanvassers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 block mb-1">Interest Level</label>
                  <select
                    value={selectedInterest}
                    onChange={e => setSelectedInterest(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
                  >
                    <option value="all">All Interests</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 block mb-1">Deal Outcome</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300 focus:ring-1 focus:ring-murugan-accent"
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

            {/* Results Count & Action Header */}
            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-gray-400">
                Showing <span className="font-bold text-white">{filteredVisits.length}</span> of {visits.length} logged visits
              </p>
            </div>

            {/* Visit Logs Table / Cards */}
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
                        {/* Left Column: School & Contact Details */}
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
                              <span>Logged by: <strong className="text-gray-200">{visit.canvasser_name || 'Field Staff'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-500" />
                              <span>{visit.contact_person} ({visit.phone})</span>
                            </div>
                          </div>

                          {/* Products Tagged */}
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

                          {/* Notes */}
                          {visit.notes && (
                            <p className="text-xs text-gray-300 bg-black/30 p-2.5 rounded-xl border border-white/5 italic">
                              "{visit.notes}"
                            </p>
                          )}
                        </div>

                        {/* Right Column: Follow-up Status & Edit Action */}
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

                          {/* Edit Button for Manager */}
                          <button
                            onClick={() => setEditingVisit(visit)}
                            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-murugan-accent rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all group shadow-sm"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-murugan-accent group-hover:scale-110 transition-transform" />
                            Edit Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ================= TAB 3: TEAM PERFORMANCE ================= */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1">Field Canvasser Leaderboard</h3>
              <p className="text-xs text-gray-400 mb-6">Track visit volume, hot leads generated, and closed orders per team member</p>

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

      {/* Reusable Edit Visit Modal for Manager */}
      <EditVisitModal
        isOpen={!!editingVisit}
        onClose={() => setEditingVisit(null)}
        visit={editingVisit}
        onSave={handleUpdateVisit}
        onDelete={handleDeleteVisit}
        isManager={true}
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
