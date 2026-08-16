import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, LogOut, CheckCircle2, TrendingUp, Calendar, MapPin, Building2, User, Phone, Users } from 'lucide-react';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';
import { cn } from '../lib/utils';

const PRODUCTS = ["Socks", "Belts", "Ties", "Shoes", "Uniforms", "Bags", "Track Pants"];
const INTEREST_LEVELS = [
  { label: 'Hot', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  { label: 'Warm', color: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  { label: 'Cold', color: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  { label: 'Not Interested', color: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' }
];

export default function CanvasserDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'list'
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    school_name: '', district: '', institution_type: 'School', 
    contact_person: '', phone: '', student_strength: '', 
    product_interests: [], interest_level: '', follow_up_date: '', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    loadVisits();
  }, [user]);

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
    await mockApi.addVisit(formData, user.id);
    setSubmitting(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Reset form
    setFormData({
      school_name: '', district: '', institution_type: 'School', 
      contact_person: '', phone: '', student_strength: '', 
      product_interests: [], interest_level: '', follow_up_date: '', notes: ''
    });
    setActiveTab('list');
    loadVisits();
  };

  return (
    <div className="pb-20 max-w-lg mx-auto min-h-screen bg-murugan-dark shadow-2xl relative">
      {/* Header */}
      <header className="bg-murugan-card border-b border-white/5 p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Murugan Canvass</h1>
            <p className="text-sm text-murugan-accent">Hi, {user.name}</p>
          </div>
          <button onClick={() => setUser(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <LogOut className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-gray-400 mb-1">My Visits (All)</p>
            <p className="text-2xl font-bold text-white">{visits.length}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-3 border border-red-500/20">
            <p className="text-xs text-red-200 mb-1">Hot Leads</p>
            <p className="text-2xl font-bold text-red-400">
              {visits.filter(v => v.interest_level === 'Hot').length}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'new' ? (
            <motion.form 
              key="new"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Log New Visit</h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input required placeholder="Institution Name" value={formData.school_name} onChange={e => setFormData({...formData, school_name: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input required placeholder="District" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent" />
                  </div>
                  <select value={formData.institution_type} onChange={e => setFormData({...formData, institution_type: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent appearance-none">
                    <option>School</option>
                    <option>College</option>
                    <option>Distributor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-white/10">
                <p className="text-sm font-semibold text-gray-400">Contact Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input required placeholder="Contact Person" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input required type="tel" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent" />
                  </div>
                </div>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input type="number" placeholder="Est. Student Strength" value={formData.student_strength} onChange={e => setFormData({...formData, student_strength: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent" />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <p className="text-sm font-semibold text-gray-400">Product Interests</p>
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
                          "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                          isSelected ? "bg-murugan-accent text-black border-murugan-accent" : "bg-transparent text-gray-300 border-gray-600 hover:border-gray-400"
                        )}
                      >
                        {product}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <p className="text-sm font-semibold text-gray-400">Interest Level</p>
                <div className="grid grid-cols-2 gap-3">
                  {INTEREST_LEVELS.map(level => (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      key={level.label}
                      onClick={() => setFormData({...formData, interest_level: level.label})}
                      className={cn(
                        "py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all",
                        formData.interest_level === level.label ? `${level.color} border-transparent text-white shadow-lg` : `bg-murugan-card ${level.border} ${level.text} border-opacity-50 hover:bg-white/5`
                      )}
                    >
                      {formData.interest_level === level.label && <CheckCircle2 className="w-4 h-4" />}
                      <span className="font-semibold text-sm">{level.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <p className="text-sm font-semibold text-gray-400">Next Action</p>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input required type="date" value={formData.follow_up_date} onChange={e => setFormData({...formData, follow_up_date: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent [color-scheme:dark]" />
                </div>
                <textarea placeholder="Notes / Requirements" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-murugan-card border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-murugan-accent h-24 resize-none" />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
                type="submit"
                className="w-full bg-murugan-accent text-black font-bold py-4 rounded-xl shadow-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Visit'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">My Visits</h2>
              {loading ? (
                <p className="text-gray-400 text-center py-10">Loading visits...</p>
              ) : visits.length === 0 ? (
                <div className="text-center py-10 bg-murugan-card rounded-2xl border border-white/5">
                  <p className="text-gray-400">No visits logged yet.</p>
                </div>
              ) : (
                visits.map((visit, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={visit.id} 
                    className="bg-murugan-card p-4 rounded-2xl border border-white/5 shadow-md space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-white">{visit.school_name}</h3>
                        <p className="text-sm text-gray-400">{visit.district} • {visit.institution_type}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-md font-bold",
                        visit.interest_level === 'Hot' ? 'bg-red-500/20 text-red-400' :
                        visit.interest_level === 'Warm' ? 'bg-orange-500/20 text-orange-400' :
                        visit.interest_level === 'Cold' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                      )}>
                        {visit.interest_level}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {visit.product_interests.map(p => (
                        <span key={p} className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">{p}</span>
                      ))}
                    </div>
                    
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-sm">
                      <div className="text-gray-400">
                        Follow up: <span className={cn("font-medium", new Date(visit.follow_up_date) < new Date() ? "text-red-400" : "text-white")}>{visit.follow_up_date}</span>
                      </div>
                      <span className="text-murugan-accent font-medium">{visit.outcome_status}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-murugan-card/90 backdrop-blur-md border-t border-white/10 pb-safe z-50">
        <div className="flex p-2">
          <button 
            onClick={() => setActiveTab('new')}
            className={cn("flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-all", activeTab === 'new' ? "text-murugan-accent bg-white/5" : "text-gray-500 hover:text-gray-300")}
          >
            <Plus className="w-6 h-6" />
            <span className="text-[10px] font-semibold">New Visit</span>
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={cn("flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-all", activeTab === 'list' ? "text-murugan-accent bg-white/5" : "text-gray-500 hover:text-gray-300")}
          >
            <List className="w-6 h-6" />
            <span className="text-[10px] font-semibold">My Visits</span>
          </button>
        </div>
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold shadow-2xl flex items-center gap-2 z-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            Visit Saved!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
