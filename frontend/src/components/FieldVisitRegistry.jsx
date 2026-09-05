import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Users, Search, Filter, Edit3, Trash2, Phone, MapPin, 
  CheckCircle2, Receipt, History, FileText, Camera, X, RefreshCw
} from 'lucide-react';
import { mockApi } from '../mockApi';
import EditVisitModal from './EditVisitModal';
import EditHistoryModal from './EditHistoryModal';
import InvoiceDocumentModal from './InvoiceDocumentModal';
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
  const [docModalVisit, setDocModalVisit] = useState(null);
  const [docModalType, setDocModalType] = useState('quote');
  const [previewImage, setPreviewImage] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, visitsData] = await Promise.all([
        mockApi.getDashboardStats(),
        mockApi.getVisits(currentUser?.id, currentUser?.role)
      ]);
      setStats(statsData);
      setVisits(visitsData);
    } catch (e) {
      console.error("Failed loading field visits", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisit = async (id, updatedData) => {
    await mockApi.updateVisit(id, updatedData, currentUser);
    showToast("Visit updated successfully!");
    await loadData();
  };

  const handleDeleteVisit = async (id) => {
    await mockApi.deleteVisit(id);
    showToast("Visit deleted successfully!");
    await loadData();
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
    const matchesInterest = selectedInterest === 'all' || v.interest_level === selectedInterest;
    const matchesStatus = selectedStatus === 'all' || v.outcome_status === selectedStatus;
    const matchesOrigin = selectedOrigin === 'all' || 
      (selectedOrigin === 'master' && v.is_from_master_db) ||
      (selectedOrigin === 'custom' && !v.is_from_master_db);

    return matchesSearch && matchesDistrict && matchesCanvasser && matchesInterest && matchesStatus && matchesOrigin;
  });

  const handleExportCSV = () => {
    mockApi.exportToCSV(filteredVisits);
    showToast(`Exported ${filteredVisits.length} records to CSV`);
  };

  const uniqueDistricts = Array.from(new Set(visits.map(v => v.district).filter(Boolean)));
  const uniqueCanvassers = stats?.canvasserStats || [];

  if (loading && visits.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-murugan-accent" />
        <p className="text-xs text-gray-400 font-medium">Loading central field visit registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-[#181922] to-[#13141a] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-murugan-accent" />
            Central Field Visit Registry
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{filteredVisits.length} visits matching filters ({visits.length} total)</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-murugan-accent/20 transition-all self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters Bar */}
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
          className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-murugan-accent sm:col-span-1"
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

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <div className="bg-[#181922] p-12 rounded-3xl border border-white/5 text-center">
          <p className="text-sm font-bold text-gray-300">No field visits matched the current criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisits.map((visit) => (
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
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
          ))}
        </div>
      )}

      {/* Modals */}
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
        isOpen={!!docModalVisit}
        onClose={() => setDocModalVisit(null)}
        type={docModalType}
        mode="create"
        visitData={docModalVisit}
        currentUser={currentUser}
        onSaveSuccess={() => {
          showToast(docModalType === 'quote' ? "Quotation generated!" : "Invoice generated!");
          loadData();
        }}
      />

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-xl max-h-[85vh] p-2 bg-[#181922] border border-white/20 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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
