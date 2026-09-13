import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, AlertCircle, Building2, MapPin, Search, Sparkles, 
  Award, ArrowRight, ShieldCheck, Link2, PlusCircle, CheckCircle2,
  Phone, User, Users, FileText, ExternalLink, HelpCircle
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';

export default function VerifySchoolDiscoveryModal({ isOpen, onClose, visit, onVerified }) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'new'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMasterSchool, setSelectedMasterSchool] = useState(null);
  const [bonusAmount, setBonusAmount] = useState(1000);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state for creating genuine new school
  const [newSchoolForm, setNewSchoolForm] = useState({
    school_name: '',
    district: '',
    block_or_cluster: '',
    zone: 'Tamil Nadu',
    board: 'Matriculation',
    area: '',
    student_strength: '',
    contact_person: '',
    phone: '',
    priority: 'High'
  });

  useEffect(() => {
    if (visit) {
      setSearchQuery(visit.school_name || '');
      setSelectedMasterSchool(null);
      setNotes('');
      setError(null);
      setBonusAmount(1000);
      setNewSchoolForm({
        school_name: visit.school_name || '',
        district: visit.district || '',
        block_or_cluster: visit.cluster_or_block || 'General Block',
        zone: 'Tamil Nadu',
        board: 'Matriculation',
        area: visit.district || '',
        student_strength: visit.student_strength || '',
        contact_person: visit.contact_person || '',
        phone: visit.phone || '',
        priority: 'High'
      });
      performSearch(visit.school_name, visit.district);
    }
  }, [visit]);

  const performSearch = async (term, district) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // First try searching with district filter
      let res = await mockApi.getMasterSchools({
        q: term.trim(),
        district: district || 'all',
        limit: 10
      });

      let schools = res?.schools || [];

      // If no results in same district, search across all districts as fallback
      if (schools.length === 0 && district) {
        const globalRes = await mockApi.getMasterSchools({
          q: term.trim(),
          limit: 10
        });
        schools = globalRes?.schools || [];
      }

      setSearchResults(schools);
    } catch (err) {
      console.warn('Error searching master schools:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery, visit?.district);
  };

  const handleLinkExisting = async () => {
    if (!selectedMasterSchool) {
      setError('Please select a Master DB school to link.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await mockApi.verifySchoolDiscovery(visit.id, {
        action: 'LINK_EXISTING',
        master_school_id: selectedMasterSchool.id,
        notes: notes.trim() || `Resolved typo: Linked to existing Master DB school "${selectedMasterSchool.school_name}" (${selectedMasterSchool.id})`
      });

      if (onVerified) onVerified(res.visit || res);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to link school');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveNewSchool = async () => {
    if (!newSchoolForm.school_name.trim() || !newSchoolForm.district.trim()) {
      setError('School name and district are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await mockApi.verifySchoolDiscovery(visit.id, {
        action: 'APPROVE_NEW_SCHOOL',
        school_data: newSchoolForm,
        bonus_amount: Number(bonusAmount) || 1000,
        notes: notes.trim() || `Verified as genuine new school. Added to Master Catalog and awarded discovery bonus.`
      });

      if (onVerified) onVerified(res.visit || res);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to approve new school');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-gradient-to-b from-[#1c1d27] to-[#13141a] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Verify Discovered School</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  New Discovery
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Logged by <strong className="text-white">{visit.canvasser_name}</strong> on {visit.created_at ? new Date(visit.created_at).toLocaleDateString('en-IN') : 'Recent Visit'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvasser Input Summary Card */}
        <div className="p-4 sm:p-5 bg-amber-500/5 border-b border-amber-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">Entered School Name:</span>
              <strong className="text-amber-300 font-extrabold text-sm">{visit.school_name}</strong>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-500" /> {visit.district}</span>
              {visit.contact_person && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-500" /> {visit.contact_person}</span>}
              {visit.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-500" /> {visit.phone}</span>}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-right self-stretch sm:self-auto">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Discovery Bonus</span>
            <span className="text-emerald-400 font-black text-xs">₹1,000 on Verification</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('link'); setError(null); }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
              activeTab === 'link'
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Link2 className="w-4 h-4" />
            <span>1. Link to Existing Master School (Typo Resolution)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('new'); setError(null); }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
              activeTab === 'new'
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <PlusCircle className="w-4 h-4" />
            <span>2. Confirm Genuine New School (+₹1,000 Bonus)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'link' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  If the canvasser made a spelling mistake or typo, search for the official school record below and link it. This updates the visit to the canonical Master DB name and doesn't issue a new school bonus.
                </p>
              </div>

              {/* Live Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search Master DB by name, area, or school ID..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    performSearch(e.target.value, visit?.district);
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold rounded-lg transition-all"
                >
                  Search
                </button>
              </form>

              {/* Search Results */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
                  <span>Potential Master DB Matches ({searchResults.length})</span>
                  {searching && <span className="text-amber-400 animate-pulse">Searching catalog...</span>}
                </div>

                {searchResults.length === 0 && !searching ? (
                  <div className="p-6 bg-black/30 border border-white/5 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-gray-400">No close matches found in Master DB for this search term.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('new')}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                    >
                      Switch to "Confirm Genuine New School" tab <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {searchResults.map(school => {
                      const isSelected = selectedMasterSchool?.id === school.id;
                      return (
                        <div
                          key={school.id}
                          onClick={() => setSelectedMasterSchool(school)}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs",
                            isSelected
                              ? "bg-blue-500/15 border-blue-500/50 shadow-md"
                              : "bg-black/40 border-white/5 hover:border-white/20"
                          )}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-white">{school.school_name}</h5>
                              <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">{school.id}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 flex items-center gap-2">
                              <span>{school.district}</span>
                              {school.board && <span>• {school.board}</span>}
                              {school.block_or_cluster && <span>• {school.block_or_cluster}</span>}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold border border-white/10">
                                Select
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Resolution Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Corrected spelling typo in school name"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Confirming this as a genuine new institution will officially add it to the <strong>Master Schools Catalog</strong> and award a <strong>₹{Number(bonusAmount).toLocaleString('en-IN')} New Discovery Bonus</strong> to <strong>{visit.canvasser_name}</strong>.
                </p>
              </div>

              {/* Master School Entry Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Official School Name *</label>
                  <input
                    type="text"
                    value={newSchoolForm.school_name}
                    onChange={e => setNewSchoolForm({ ...newSchoolForm, school_name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">District *</label>
                  <input
                    type="text"
                    value={newSchoolForm.district}
                    onChange={e => setNewSchoolForm({ ...newSchoolForm, district: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Block or Cluster</label>
                  <input
                    type="text"
                    value={newSchoolForm.block_or_cluster}
                    onChange={e => setNewSchoolForm({ ...newSchoolForm, block_or_cluster: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Education Board</label>
                  <select
                    value={newSchoolForm.board}
                    onChange={e => setNewSchoolForm({ ...newSchoolForm, board: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    <option value="Matriculation">Matriculation</option>
                    <option value="CBSE">CBSE</option>
                    <option value="State Board">State Board</option>
                    <option value="ICSE">ICSE</option>
                    <option value="International">International / IGCSE</option>
                    <option value="College">College / Higher Ed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Estimated Students</label>
                  <input
                    type="number"
                    value={newSchoolForm.student_strength}
                    onChange={e => setNewSchoolForm({ ...newSchoolForm, student_strength: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="e.g. 1500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Contact Person</label>
                  <input
                    type="text"
                    value={newSchoolForm.contact_person}
                    onChange={e => setNewSchoolForm({ ...newSchoolForm, contact_person: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="Principal / Admin"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={newSchoolForm.phone}
                    onChange={e => setNewSchoolForm({ ...newSchoolForm, phone: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>

              {/* Bonus Amount Config */}
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-white block">Canvasser Discovery Bonus</label>
                  <p className="text-[11px] text-gray-400">Award credited to {visit.canvasser_name} upon approval</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">₹</span>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={e => setBonusAmount(Number(e.target.value) || 0)}
                    className="w-28 bg-black/60 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-extrabold text-right focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Verification Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase">Verification Notes</label>
                <input
                  type="text"
                  placeholder="e.g., Verified via school website and phone call"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>

          {activeTab === 'link' ? (
            <button
              type="button"
              disabled={!selectedMasterSchool || submitting}
              onClick={handleLinkExisting}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              <span>{submitting ? 'Linking...' : 'Confirm & Link Typo'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleApproveNewSchool}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>{submitting ? 'Adding & Crediting...' : `Approve & Add to Master (+₹${Number(bonusAmount).toLocaleString('en-IN')})`}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
