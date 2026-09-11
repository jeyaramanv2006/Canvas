import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Search, Filter, Plus, Edit2, Trash2, MapPin, 
  Phone, Users, Sparkles, CheckCircle2, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, Download, ShieldCheck, Clock, Check
} from 'lucide-react';
import { TAMIL_NADU_DISTRICTS } from '../data/masterSchools';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';

export default function MasterSchoolsDirectoryModule({ currentUser }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetSchool, setTargetSchool] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    school_name: '',
    district: 'Chennai',
    block_or_cluster: '',
    board: 'CBSE',
    student_strength: null,
    contact_person: '',
    phone: '',
    area: '',
    priority: 'Medium'
  });
  const [actionSuccess, setActionSuccess] = useState('');

  const isCEO = currentUser?.role === 'ceo';

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getAllMasterSchools();
      const list = Array.isArray(data) ? data : (data?.schools && Array.isArray(data.schools) ? data.schools : []);
      setSchools(list);
    } catch (e) {
      console.error("Failed to load master schools", e);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  // Filter logic
  const schoolList = Array.isArray(schools) ? schools : [];
  const filteredSchools = schoolList.filter(s => {
    if (!s) return false;
    const matchesDist = selectedDistrict === 'All' || s.district?.toLowerCase() === selectedDistrict.toLowerCase();
    const matchesBoard = selectedBoard === 'All' || s.board?.toLowerCase().includes(selectedBoard.toLowerCase());
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || 
      (s.school_name || '').toLowerCase().includes(q) ||
      (s.area || '').toLowerCase().includes(q) ||
      (s.block_or_cluster || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q) ||
      (s.contact_person || '').toLowerCase().includes(q);

    return matchesDist && matchesBoard && matchesQ;
  });

  const totalPages = Math.ceil(filteredSchools.length / pageSize) || 1;
  const paginatedSchools = filteredSchools.slice((page - 1) * pageSize, page * pageSize);

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csvText = await mockApi.exportMasterSchoolsCSV();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `master_schools_catalog_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Master Schools database exported to CSV successfully!");
    } catch (err) {
      alert("Failed to export CSV: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Open Add Modal ──────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingSchool(null);
    setFormData({
      school_name: '',
      district: selectedDistrict !== 'All' ? selectedDistrict : 'Chennai',
      block_or_cluster: '',
      board: 'CBSE',
      student_strength: null,
      contact_person: '',
      phone: '',
      area: '',
      priority: 'Medium'
    });
    setModalOpen(true);
  };

  // ── Open Edit Modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      school_name: school.school_name || '',
      district: school.district || 'Chennai',
      block_or_cluster: school.block_or_cluster || '',
      board: school.board || 'CBSE',
      student_strength: school.student_strength !== undefined && school.student_strength !== null ? school.student_strength : null,
      contact_person: school.contact_person || '',
      phone: school.phone || '',
      area: school.area || '',
      priority: school.priority || 'Medium'
    });
    setModalOpen(true);
  };

  // ── Handle Add / Edit Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.school_name.trim()) return;
    setSubmitting(true);

    try {
      if (isCEO) {
        if (editingSchool) {
          await mockApi.updateMasterSchool(editingSchool.id, formData);
          showSuccess(`School "${formData.school_name}" updated directly in Master Catalog!`);
        } else {
          await mockApi.createMasterSchool(formData);
          showSuccess(`New school "${formData.school_name}" added to Master Catalog!`);
        }
      } else {
        // Admin executive submits for approval
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: editingSchool ? "SCHOOL_EDIT" : "SCHOOL_CREATE",
          title: editingSchool ? `School Update: ${formData.school_name}` : `New School Addition: ${formData.school_name}`,
          requestedBy: currentUser?.name ? `${currentUser.name} (${currentUser.roleTitle || 'Admin'})` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            ...formData,
            id: editingSchool ? editingSchool.id : undefined,
            target_school_id: editingSchool ? editingSchool.id : undefined
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`School submission for "${formData.school_name}" submitted to CEO for approval!`);
      }

      setModalOpen(false);
      await loadSchools();
    } catch (err) {
      alert("Failed to save school: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Delete Modal ───────────────────────────────────────────────────────
  const handleOpenDelete = (school) => {
    setTargetSchool(school);
    setDeleteModalOpen(true);
  };

  // ── Handle Delete Confirm ───────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!targetSchool) return;
    setSubmitting(true);

    try {
      if (isCEO) {
        await mockApi.deleteMasterSchool(targetSchool.id);
        showSuccess(`School "${targetSchool.school_name}" deleted directly from Master Catalog.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "SCHOOL_DELETE",
          title: `School Deletion Request: ${targetSchool.school_name}`,
          requestedBy: currentUser?.name ? `${currentUser.name} (${currentUser.roleTitle || 'Admin'})` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            id: targetSchool.id,
            target_school_id: targetSchool.id,
            school_name: targetSchool.school_name,
            district: targetSchool.district
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`Deletion request for "${targetSchool.school_name}" submitted to CEO for approval!`);
      }

      setDeleteModalOpen(false);
      setTargetSchool(null);
      await loadSchools();
    } catch (err) {
      alert("Failed to delete school: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-black font-black shadow-lg shadow-amber-400/20 flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">Tamil Nadu Master Schools Directory</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {schools.length} Institutions
              </span>
              <span className={cn(
                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                isCEO ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-purple-500/20 text-purple-300 border-purple-500/40"
              )}>
                {isCEO ? "CEO Command" : "Admin Executive"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Verified directory of schools across all 38 districts in Tamil Nadu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-white/10 transition cursor-pointer disabled:opacity-50"
            title="Download school directory as CSV file"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{exporting ? "Exporting..." : "Export Directory (CSV)"}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-400/20 transition whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isCEO ? "Add School" : "Propose New School"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </motion.div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by school name, area, cluster, or ID..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#16171d] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedDistrict}
            onChange={e => {
              setSelectedDistrict(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#16171d] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-400"
          >
            <option value="All">All Districts ({schools.length})</option>
            {TAMIL_NADU_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedBoard}
            onChange={e => {
              setSelectedBoard(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#16171d] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-400"
          >
            <option value="All">All Boards</option>
            <option value="CBSE">CBSE</option>
            <option value="Matriculation">Matriculation</option>
            <option value="State Board">State Board</option>
            <option value="ICSE">ICSE</option>
            <option value="International">International</option>
          </select>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-black/50 text-gray-400 uppercase text-[10px] border-b border-white/10 font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">School Institution</th>
                <th className="py-3.5 px-4">District & Cluster</th>
                <th className="py-3.5 px-4">Board</th>
                <th className="py-3.5 px-4 text-center">Student Strength</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                    Loading Master Catalog...
                  </td>
                </tr>
              ) : paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No schools found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedSchools.map(s => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    {/* Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white text-xs">{s.school_name}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                            {s.id}
                          </span>
                          {s.area && (
                            <span className="text-[10px] text-gray-400">
                              {s.area}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* District & Cluster */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-200 block">{s.district}</span>
                        <span className="text-[10px] text-gray-400 block">{s.block_or_cluster || 'General Cluster'}</span>
                      </div>
                    </td>

                    {/* Board */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-block">
                        {s.board || 'Matriculation'}
                      </span>
                    </td>

                    {/* Student Strength - Dedicated Separate Column */}
                    <td className="py-3.5 px-4 text-center">
                      {s.student_strength && Number(s.student_strength) > 0 ? (
                        <span className="font-mono font-bold text-xs text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
                          <Users className="w-3 h-3 text-amber-400" />
                          {Number(s.student_strength).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="font-mono text-gray-500 text-sm font-semibold select-none" title="Strength currently unknown">—</span>
                      )}
                    </td>

                    {/* Contact Person & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-gray-200 font-medium">
                          {s.contact_person && s.contact_person.trim() ? s.contact_person : <span className="text-gray-500 font-mono">—</span>}
                        </p>
                        <p className="text-gray-400 font-mono text-[10px]">
                          {s.phone && s.phone.trim() ? s.phone : <span className="text-gray-500 font-mono">—</span>}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                          title={isCEO ? "Edit school immediately" : "Submit school edit proposal to CEO"}
                        >
                          <Edit2 className="w-3 h-3 text-amber-400" />
                          <span>{isCEO ? "Edit" : "Req. Edit"}</span>
                        </button>

                        <button
                          onClick={() => handleOpenDelete(s)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                          title={isCEO ? "Delete school from Master Catalog" : "Submit school deletion proposal to CEO"}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>
            Showing <strong>{filteredSchools.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to <strong>{Math.min(page * pageSize, filteredSchools.length)}</strong> of <strong>{filteredSchools.length}</strong> matching schools
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 font-bold text-white">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ───────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181922] border border-white/20 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              {editingSchool 
                ? (isCEO ? `Edit Master School: ${editingSchool.school_name}` : `Submit Edit Proposal: ${editingSchool.school_name}`)
                : (isCEO ? "Add School Directly to Master Catalog" : "Submit New School Proposal to CEO")}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">School Name *</label>
                <input
                  required
                  type="text"
                  value={formData.school_name}
                  onChange={e => setFormData({ ...formData, school_name: e.target.value })}
                  placeholder="e.g. SBOA Matriculation Higher Secondary School"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">District *</label>
                  <select
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    {TAMIL_NADU_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Board / Affiliation</label>
                  <select
                    value={formData.board}
                    onChange={e => setFormData({ ...formData, board: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="Matriculation">Matriculation</option>
                    <option value="State Board">State Board</option>
                    <option value="ICSE">ICSE</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Block / Cluster</label>
                  <input
                    type="text"
                    value={formData.block_or_cluster}
                    onChange={e => setFormData({ ...formData, block_or_cluster: e.target.value })}
                    placeholder="e.g. Madurai South"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Anna Nagar"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Student Strength</label>
                  <input
                    type="number"
                    value={formData.student_strength === null || formData.student_strength === undefined ? '' : formData.student_strength}
                    onChange={e => setFormData({ ...formData, student_strength: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 1200 (or blank for —)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Fr. Jacob (Principal)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9840123456"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black rounded-xl transition cursor-pointer"
                >
                  {editingSchool 
                    ? (isCEO ? "Update School Immediately" : "Submit Edit Proposal to CEO")
                    : (isCEO ? "Add School Immediately" : "Submit Addition to CEO")}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ───────────────────────────────────────────────────── */}
      {deleteModalOpen && targetSchool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181922] border border-white/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>{isCEO ? "Confirm School Deletion" : "Submit Deletion Proposal to CEO"}</span>
            </h3>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to remove <strong>{targetSchool.school_name}</strong> ({targetSchool.district}) from the Master Schools Catalog?
              <span className="block text-rose-300 mt-2 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {isCEO 
                  ? "⚠️ This will delete the institution record directly from the master database." 
                  : "ℹ️ Your deletion request will be submitted to the CEO Approval Queue for final verification."}
              </span>
            </p>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl transition shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                {isCEO ? "Delete School Immediately" : "Submit Deletion Proposal"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
