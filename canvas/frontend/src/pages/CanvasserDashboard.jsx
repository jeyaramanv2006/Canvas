import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, List, LogOut, CheckCircle2, TrendingUp, Calendar, 
  MapPin, Building2, User, Phone, Users, Edit3, Trash2, Search, Filter 
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';
import EditVisitModal from '../components/EditVisitModal';
import { cn } from '../lib/utils';

const PRODUCTS = ["Socks", "Belts", "Ties", "Shoes", "Uniforms", "Bags", "Track Pants"];
const INTEREST_LEVELS = [
  { label: 'Hot', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  { label: 'Warm', color: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  { label: 'Cold', color: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  { label: 'Not Interested', color: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' }
];
const OUTCOME_STATUSES = ["Open", "Sample Sent", "Quote Given", "Won", "Lost"];

export default function CanvasserDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'list'
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for New Visit
  const [formData, setFormData] = useState({
    school_name: '', district: '', institution_type: 'School', 
    contact_person: '', phone: '', student_strength: '', 
    product_interests: [], interest_level: 'Warm', outcome_status: 'Open', follow_up_date: '', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Editing and Modal State
  const [editingVisit, setEditingVisit] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Filters for "My Visits" tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInterest, setFilterInterest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadVisits();
  }, [user]);

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
      const interests = prev.product_interests.includes(product)
        ? prev.product_interests.filter(p => p !== product)
        : [...prev.product_interests, product];
      return { ...prev, product_interests: interests };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mockApi.addVisit(formData, user.id, user.name);
      showToast("Visit logged successfully!");
      
      // Reset form
      setFormData({
        school_name: '', district: '', institution_type: 'School', 
        contact_person: '', phone: '', student_strength: '', 
        product_interests: [], interest_level: 'Warm', outcome_status: 'Open', follow_up_date: '', notes: ''
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
    await mockApi.updateVisit(id, updatedData);
    showToast("Visit updated successfully!");
    await loadVisits();
  };

  const handleDeleteVisit = async (id) => {
    await mockApi.deleteVisit(id);
    showToast("Visit deleted successfully!");
    await loadVisits();
  };

  // Filtered visits for the user
  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      (v.school_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesInterest = filterInterest === 'all' || v.interest_level === filterInterest;
    const matchesStatus = filterStatus === 'all' || v.outcome_status === filterStatus;

    return matchesSearch && matchesInterest && matchesStatus;
  });

  return (
    <div className="pb-24 max-w-lg mx-auto min-h-screen bg-murugan-dark shadow-2xl relative border-x border-white/5">
      {/* Mobile Header */}
      <header className="bg-murugan-card border-b border-white/10 p-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-murugan-accent to-murugan-purple flex items-center justify-center font-black text-black text-xs">
              MC
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Murugan Canvass</h1>
              <p className="text-xs text-murugan-accent font-medium">{user.name}</p>
            </div>
          </div>
          <button 
            onClick={() => setUser(null)} 
            title="Sign Out"
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 text-center">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Visits</p>
            <p className="text-lg font-bold text-white mt-0.5">{visits.length}</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-2.5 border border-red-500/20 text-center">
            <p className="text-[10px] text-red-300 uppercase font-semibold">Hot Leads</p>
            <p className="text-lg font-bold text-red-400 mt-0.5">
              {visits.filter(v => v.interest_level === 'Hot').length}
            </p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-2.5 border border-emerald-500/20 text-center">
            <p className="text-[10px] text-emerald-300 uppercase font-semibold">Deals Won</p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {visits.filter(v => v.outcome_status === 'Won').length}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4">
        <AnimatePresence mode="wait">
          {/* ================= TAB 1: NEW VISIT FORM ================= */}
          {activeTab === 'new' ? (
            <motion.form 
              key="new"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Log School Visit</h2>
                <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-md border border-white/5">Step 1 of 1</span>
              </div>
              
              {/* Institution Details */}
              <div className="space-y-3">
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                  <input 
                    required 
                    placeholder="School / Institution Name" 
                    value={formData.school_name} 
                    onChange={e => setFormData({...formData, school_name: e.target.value})} 
                    className="w-full bg-murugan-card border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      required 
                      placeholder="District / Area" 
                      value={formData.district} 
                      onChange={e => setFormData({...formData, district: e.target.value})} 
                      className="w-full bg-murugan-card border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
                    />
                  </div>
                  <select 
                    value={formData.institution_type} 
                    onChange={e => setFormData({...formData, institution_type: e.target.value})} 
                    className="w-full bg-murugan-card border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent appearance-none font-medium"
                  >
                    <option value="School">School</option>
                    <option value="College">College</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Trust/Group">Trust / Group</option>
                  </select>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Person & Capacity</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      required 
                      placeholder="Principal / Contact" 
                      value={formData.contact_person} 
                      onChange={e => setFormData({...formData, contact_person: e.target.value})} 
                      className="w-full bg-murugan-card border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
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
                      className="w-full bg-murugan-card border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
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
                    className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent" 
                  />
                </div>
              </div>

              {/* Product Interests Multi-select Chips */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Interests</p>
                  <span className="text-[11px] text-murugan-accent font-medium">Multi-select</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTS.map(product => {
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
                            : "bg-murugan-card text-gray-300 border-white/10 hover:border-gray-500"
                        )}
                      >
                        {product}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Interest Level Selection */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interest Level</p>
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
                          : `bg-murugan-card ${level.border} ${level.text} border-opacity-40 hover:bg-white/5`
                      )}
                    >
                      {formData.interest_level === level.label && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{level.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Outcome Status / Deal Stage Selection */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visit Outcome / Deal Status</p>
                  <span className="text-[11px] text-gray-400 font-medium">Initial Stage</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {OUTCOME_STATUSES.map(status => {
                    const isSelected = formData.outcome_status === status;
                    return (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        key={status}
                        onClick={() => setFormData({...formData, outcome_status: status})}
                        className={cn(
                          "py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1",
                          isSelected
                            ? status === 'Won' 
                              ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20"
                              : status === 'Lost'
                              ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                              : "bg-murugan-purple text-white border-purple-400 shadow-lg shadow-purple-500/20"
                            : "bg-murugan-card text-gray-400 border-white/10 hover:border-white/20"
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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Action Follow-up</p>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input 
                    required 
                    type="date" 
                    value={formData.follow_up_date} 
                    onChange={e => setFormData({...formData, follow_up_date: e.target.value})} 
                    className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent [color-scheme:dark]" 
                  />
                </div>
                <textarea 
                  placeholder="Notes / specific sample requests / remarks" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-murugan-card border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-murugan-accent h-24 resize-none" 
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
                type="submit"
                className="w-full bg-murugan-accent text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-murugan-accent/20 hover:bg-yellow-400 transition-all text-sm disabled:opacity-50"
              >
                {submitting ? 'Saving Visit to Cloud...' : 'Submit School Visit'}
              </motion.button>
            </motion.form>
          ) : (
            /* ================= TAB 2: MY VISITS LIST & EDIT ================= */
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">My Logged Visits</h2>
                <span className="text-xs text-gray-400">{filteredVisits.length} records</span>
              </div>

              {/* Search and Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by school, district, or note..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-murugan-card border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-murugan-accent"
                  />
                </div>

                <div className="flex gap-2 text-xs">
                  <select
                    value={filterInterest}
                    onChange={e => setFilterInterest(e.target.value)}
                    className="flex-1 bg-murugan-card border border-white/10 rounded-lg p-2 text-gray-300 focus:ring-1 focus:ring-murugan-accent text-xs"
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
                    className="flex-1 bg-murugan-card border border-white/10 rounded-lg p-2 text-gray-300 focus:ring-1 focus:ring-murugan-accent text-xs"
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
                <p className="text-gray-400 text-center py-10 text-xs">Loading your field records...</p>
              ) : filteredVisits.length === 0 ? (
                <div className="text-center py-12 bg-murugan-card rounded-2xl border border-white/5 p-4">
                  <p className="text-sm text-gray-400 font-medium">No visits found.</p>
                  <p className="text-xs text-gray-600 mt-1">Tap "New Visit" below to log your first school visit.</p>
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
                      className="bg-murugan-card p-4 rounded-2xl border border-white/10 shadow-md space-y-3 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-white">{visit.school_name}</h3>
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
                            visit.outcome_status === 'Won' ? 'bg-emerald-500/20 text-emerald-400' :
                            visit.outcome_status === 'Lost' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-purple-500/20 text-purple-300'
                          )}>
                            {visit.outcome_status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Products and Contact */}
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(visit.product_interests) && visit.product_interests.map(p => (
                          <span key={p} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{p}</span>
                        ))}
                      </div>

                      {visit.notes && (
                        <p className="text-xs text-gray-300 bg-black/30 p-2 rounded-lg border border-white/5 italic">
                          "{visit.notes}"
                        </p>
                      )}
                      
                      {/* Action Footer */}
                      <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-xs">
                        <div className="text-gray-400 text-[11px]">
                          Follow-up: <span className={cn("font-semibold", isOverdue ? "text-red-400" : "text-gray-200")}>
                            {visit.follow_up_date || 'None'}
                            {isOverdue && ' (Due)'}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => setEditingVisit(visit)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg font-semibold flex items-center gap-1 transition-all"
                        >
                          <Edit3 className="w-3 h-3 text-murugan-accent" />
                          Edit / Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-murugan-card/95 backdrop-blur-lg border-t border-white/10 pb-safe z-50">
        <div className="flex p-1.5">
          <button 
            onClick={() => setActiveTab('new')}
            className={cn(
              "flex-1 py-2.5 flex flex-col items-center gap-1 rounded-xl transition-all", 
              activeTab === 'new' ? "text-murugan-accent bg-white/5 font-bold" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px]">New Visit</span>
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={cn(
              "flex-1 py-2.5 flex flex-col items-center gap-1 rounded-xl transition-all", 
              activeTab === 'list' ? "text-murugan-accent bg-white/5 font-bold" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <List className="w-5 h-5" />
            <span className="text-[10px]">My Visits ({visits.length})</span>
          </button>
        </div>
      </nav>

      {/* Edit Visit Modal for Canvasser */}
      <EditVisitModal
        isOpen={!!editingVisit}
        onClose={() => setEditingVisit(null)}
        visit={editingVisit}
        onSave={handleUpdateVisit}
        onDelete={handleDeleteVisit}
        isManager={false}
      />

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
