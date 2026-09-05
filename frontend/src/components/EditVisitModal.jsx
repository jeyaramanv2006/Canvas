import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Building2, MapPin, User, Phone, Users, Calendar, CheckCircle2, Trash2, History, FileText, Camera, Image } from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';
import EditHistoryModal from './EditHistoryModal';

const DEFAULT_PRODUCTS = ["Socks", "Belts", "Ties", "Shoes", "Uniforms", "Bags", "Track Pants"];
const INTEREST_LEVELS = [
  { label: 'Hot', color: 'bg-red-500 text-white', border: 'border-red-500' },
  { label: 'Warm', color: 'bg-orange-500 text-white', border: 'border-orange-500' },
  { label: 'Cold', color: 'bg-blue-500 text-white', border: 'border-blue-500' },
  { label: 'Not Interested', color: 'bg-gray-500 text-white', border: 'border-gray-500' }
];

const CANVASSER_STATUSES = ["Open", "Sample Sent", "Not Interested"];
const MANAGER_STATUSES = ["Open", "Sample Sent", "Quote Given", "Won", "Lost", "Not Interested"];

export default function EditVisitModal({ isOpen, onClose, visit, onSave, onDelete, isManager = false }) {
  const [formData, setFormData] = useState(null);
  const [availableProducts, setAvailableProducts] = useState(DEFAULT_PRODUCTS);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    mockApi.getProducts().then(prods => {
      if (prods && prods.length > 0) {
        setAvailableProducts(prods.map(p => p.name));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (visit) {
      setFormData({
        ...visit,
        product_interests: Array.isArray(visit.product_interests) ? [...visit.product_interests] : [],
        product_specifications: visit.product_specifications || '',
        attachments: Array.isArray(visit.attachments) ? [...visit.attachments] : [],
        follow_up_date: visit.follow_up_date || ''
      });
      setConfirmDelete(false);
    }
  }, [visit]);

  if (!isOpen || !formData) return null;

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

  const handleProductToggle = (product) => {
    setFormData(prev => {
      const exists = prev.product_interests.includes(product);
      return {
        ...prev,
        product_interests: exists 
          ? prev.product_interests.filter(p => p !== product)
          : [...prev.product_interests, product]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData.id, formData);
      onClose();
    } catch (err) {
      alert("Failed to update visit: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(formData.id);
      onClose();
    } catch (err) {
      alert("Failed to delete visit: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-murugan-card border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-murugan-accent/20 text-murugan-accent border border-murugan-accent/30">
                  {isManager ? 'Executive Control' : 'Field Record Edit'}
                </span>
                {formData.is_from_master_db ? (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    🏛️ Master DB School
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    🆕 Unlisted / Custom
                  </span>
                )}
                {formData.canvasser_name && (
                  <span className="text-xs text-gray-400">by {formData.canvasser_name}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{formData.school_name || 'Edit School Visit'}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Institution Details</h3>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  required
                  placeholder="Institution Name"
                  value={formData.school_name || ''}
                  onChange={e => setFormData({ ...formData, school_name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                  <input
                    required
                    placeholder="District"
                    value={formData.district || ''}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent"
                  />
                </div>
                <select
                  value={formData.institution_type || 'School'}
                  onChange={e => setFormData({ ...formData, institution_type: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent appearance-none"
                >
                  <option value="School">School</option>
                  <option value="College">College</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Trust/Group">Trust / Group</option>
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact & Scale</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                  <input
                    required
                    placeholder="Contact Person"
                    value={formData.contact_person || ''}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                  <input
                    required
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent"
                  />
                </div>
              </div>

              <div className="relative">
                <Users className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="number"
                  placeholder="Estimated Student Strength"
                  value={formData.student_strength || ''}
                  onChange={e => setFormData({ ...formData, student_strength: Number(e.target.value) || '' })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent"
                />
              </div>
            </div>

            {/* Products & Interest */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Products of Interest</h3>
              <div className="flex flex-wrap gap-2">
                {availableProducts.map(product => {
                  const isSelected = formData.product_interests?.includes(product);
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
                          : "bg-black/40 text-gray-400 border-white/10 hover:border-gray-500"
                      )}
                    >
                      {product}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-murugan-accent" />
                  Product Specifications & Requirements
                </h3>
                <span className="text-[10px] text-gray-400">Principal's specs</span>
              </div>
              <textarea
                rows={3}
                placeholder="Type specific material/design requirements (e.g. 100% combed cotton, 220 GSM uniform fabric, school crest on belts)..."
                value={formData.product_specifications || ''}
                onChange={e => setFormData({ ...formData, product_specifications: e.target.value })}
                className="w-full bg-black/50 border border-white/10 focus:border-murugan-accent/50 rounded-xl p-3.5 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent/30 text-sm resize-none"
              />
            </div>

            {/* Reference Photos & Sample Images */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-murugan-accent" />
                  Sample Photos & Reference Images
                </h3>
                <span className="text-xs text-gray-400">{formData.attachments?.length || 0} attached</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 bg-black/60 hover:bg-white/10 border border-dashed border-white/20 hover:border-murugan-accent rounded-xl text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-all">
                  <Image className="w-4 h-4 text-murugan-accent" />
                  <span>+ Attach Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <span className="text-xs text-gray-500">Upload sample reference photos</span>
              </div>

              {formData.attachments && formData.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {formData.attachments.map(att => (
                    <div key={att.id} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/20 bg-black shadow-md">
                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 text-white rounded-full transition-colors"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pipeline Stages */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pipeline & Deal Status</h3>
              
              <div>
                <label className="text-xs text-gray-400 block mb-2 font-medium">Interest Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INTEREST_LEVELS.map(level => {
                    const isSelected = formData.interest_level === level.label;
                    return (
                      <button
                        type="button"
                        key={level.label}
                        onClick={() => setFormData({ ...formData, interest_level: level.label })}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                          isSelected 
                            ? `${level.color} ${level.border} shadow-lg` 
                            : "bg-black/30 text-gray-400 border-white/10 hover:border-white/20"
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-gray-400 font-medium">Outcome Status</label>
                  {!isManager && (
                    <span className="text-[10px] text-gray-400 font-semibold">Quotes & Orders managed by Admin</span>
                  )}
                </div>
                <div className={cn(
                  "grid gap-2",
                  isManager ? "grid-cols-2 sm:grid-cols-6" : "grid-cols-3"
                )}>
                  {(isManager ? MANAGER_STATUSES : CANVASSER_STATUSES).map(status => {
                    const isSelected = formData.outcome_status === status;
                    return (
                      <button
                        type="button"
                        key={status}
                        onClick={() => setFormData({ ...formData, outcome_status: status })}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                          isSelected
                            ? status === 'Won' 
                              ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20"
                              : status === 'Lost'
                              ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                              : status === 'Sample Sent'
                              ? "bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20"
                              : "bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-500/20 font-bold"
                            : "bg-black/30 text-gray-400 border-white/10 hover:border-white/20"
                        )}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Follow-up & Notes */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Next Action Follow-up</h3>
                {formData.follow_up_date && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, follow_up_date: '' })}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Clear Follow-up Date
                  </button>
                )}
              </div>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={formData.follow_up_date || ''}
                  onChange={e => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent [color-scheme:dark]"
                />
              </div>

              <textarea
                placeholder="Notes / Detailed school requirements / Sample feedback"
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent h-24 resize-none text-sm placeholder:text-gray-600"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all",
                  confirmDelete 
                    ? "bg-red-600 text-white hover:bg-red-700 animate-pulse" 
                    : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                )}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? "Confirm Delete" : "Delete"}
              </button>

              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-murugan-accent font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <History className="w-4 h-4" />
                <span>Audit Trail ({formData.edit_history?.length || 0})</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || deleting}
                className="px-6 py-2.5 rounded-xl bg-murugan-accent text-black font-bold text-sm flex items-center gap-2 hover:bg-yellow-400 shadow-lg shadow-murugan-accent/20 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Audit History Timeline Modal */}
        <EditHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          visit={formData}
        />
      </div>
    </AnimatePresence>
  );
}
