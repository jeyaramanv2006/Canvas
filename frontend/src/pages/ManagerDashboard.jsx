import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Download, Users, TrendingUp, Target, Briefcase, 
  Search, Filter, Edit3, Trash2, Calendar, Phone, MapPin, 
  Building2, CheckCircle2, ChevronRight, Eye, RefreshCw, Layers, Receipt, History,
  Megaphone, Sparkles, ShieldCheck, Trophy
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';
import EditVisitModal from '../components/EditVisitModal';
import EditHistoryModal from '../components/EditHistoryModal';
import InvoicingModule from '../components/InvoicingModule';
import InvoiceDocumentModal from '../components/InvoiceDocumentModal';
import DynamicKPISection from '../components/DynamicKPISection';
import MarketingCampaignsModule from '../components/MarketingCampaignsModule';
import { isAdmin, getRoleConfig, canAccessSensitiveFinancials } from '../lib/rbac';
import { cn } from '../lib/utils';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280']; // Hot, Warm, Cold, Not Interested

export default function ManagerDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'invoicing', 'marketing', 'logs', 'team'
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

  // Modal State
  const [editingVisit, setEditingVisit] = useState(null);
  const [inspectHistoryVisit, setInspectHistoryVisit] = useState(null);
  const [docModalVisit, setDocModalVisit] = useState(null);
  const [docModalType, setDocModalType] = useState('quote');
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

    return matchesSearch && matchesDistrict && matchesCanvasser && matchesStatus;
  });

  const uniqueDistricts = Array.from(new Set(visits.map(v => v.district).filter(Boolean)));
  const uniqueCanvassers = stats?.canvasserStats || [];

  const navTabs = [
    { id: 'overview', label: '📊 Executive Analytics', icon: TrendingUp },
    { id: 'invoicing', label: '🧾 Invoicing & Financials', icon: Receipt },
    { id: 'marketing', label: '📣 Marketing Hub', icon: Megaphone },
    { id: 'logs', label: `📋 Visit Logs`, icon: History },
    { id: 'team', label: '👥 Team Leaderboard', icon: Users }
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
      <header className="bg-murugan-card/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-extrabold tracking-tight text-white">Murugan Canvass</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setUser(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
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
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2",
                    isActive 
                      ? "bg-murugan-accent text-black shadow-lg shadow-murugan-accent/20" 
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
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
              <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
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

              <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
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

        {activeTab === 'marketing' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <MarketingCampaignsModule currentUser={user} />
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-murugan-card p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">Central Field Visit Registry</h3>
                <p className="text-xs text-gray-400">{filteredVisits.length} visits matching filters</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-murugan-accent/20 transition-all self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 bg-murugan-card p-3 rounded-2xl border border-white/10">
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
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
              >
                <option value="all">All Deal Outcomes</option>
                <option value="Open">Open</option>
                <option value="Sample Sent">Sample Sent</option>
                <option value="Quote Given">Quote Given</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            {filteredVisits.length === 0 ? (
              <div className="text-center py-12 bg-murugan-card rounded-3xl border border-white/5">
                <p className="text-sm font-bold text-gray-300">No school visits found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVisits.map((visit, idx) => {
                  const isOverdue = visit.follow_up_date && new Date(visit.follow_up_date) < new Date();
                  return (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-murugan-card p-5 rounded-2xl border border-white/10 shadow-md hover:border-white/20 transition-all space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-white">{visit.school_name}</h4>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
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
                              <span>Canvassed by: <strong className="text-murugan-accent">{visit.canvasser_name || 'Canvasser'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-500" />
                              <span>{visit.contact_person} ({visit.phone})</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-4">
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
                              <Edit3 className="w-3.5 h-3.5 text-murugan-accent" /> Edit
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
            <div className="bg-murugan-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-murugan-accent" />
                    Field Canvassers Performance Leaderboard
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Rank & Canvasser</th>
                      <th className="py-3 px-4">Total Invoiced (Credited)</th>
                      <th className="py-3 px-4">Visits Completed</th>
                      <th className="py-3 px-4">Won Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(leaderboard?.rankings || stats.canvasserStats).map((canvasser) => (
                      <tr key={canvasser.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold text-white">{canvasser.name}</td>
                        <td className="py-4 px-4 font-black text-murugan-accent text-sm">{canvasser.formattedInvoiced || '₹0.00'}</td>
                        <td className="py-4 px-4 text-gray-300 font-semibold">{canvasser.totalVisits || canvasser.visits}</td>
                        <td className="py-4 px-4 text-emerald-400 font-bold">{canvasser.wonOrders || canvasser.won}</td>
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
