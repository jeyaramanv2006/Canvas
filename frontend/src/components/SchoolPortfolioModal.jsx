import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Calendar, Phone, Users, MapPin, CheckCircle2, Clock,
  Receipt, FileText, Camera, Eye, X, ChevronRight, AlertCircle,
  Briefcase, DollarSign, UserCheck, ShieldCheck, Tag, ExternalLink,
  ChevronDown, CheckCircle
} from 'lucide-react';
import { mockApi } from '../mockApi';
import { cn } from '../lib/utils';
import ProductBadge from './ProductBadge';

export default function SchoolPortfolioModal({ isOpen, onClose, schoolId, schoolName, onOpenVisitDetails }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('visits'); // 'visits', 'quotes', 'invoices'
  const [selectedVisitForDetails, setSelectedVisitForDetails] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isOpen && schoolId) {
      loadPortfolio();
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, schoolId]);

  const loadPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mockApi.getSchoolPortfolio(schoolId);
      setData(res);
    } catch (err) {
      console.error('Failed to load school portfolio', err);
      setError(err.message || 'Failed to load institutional portfolio');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const school = data?.school || {};
  const metrics = data?.metrics || {};
  const visits = data?.visits || [];
  const quotations = data?.quotations || [];
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-5xl bg-gradient-to-br from-[#161720] via-[#121319] to-[#0c0d12] border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#161722]/80 backdrop-blur-md flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-400/10">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-md">
                  {school.id || schoolId}
                </span>
                {school.board && (
                  <span className="text-[11px] font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                    {school.board}
                  </span>
                )}
                {school.priority && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    school.priority === 'High' ? "bg-rose-500/15 text-rose-300 border border-rose-500/30" :
                    school.priority === 'Medium' ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                    "bg-gray-500/15 text-gray-300 border border-gray-500/30"
                  )}>
                    {school.priority} Priority
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {school.school_name || schoolName || 'Institutional School Portfolio'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {school.district || 'Tamil Nadu'} {school.block_or_cluster ? `• ${school.block_or_cluster}` : ''}
                </span>
                {school.student_strength && (
                  <span className="flex items-center gap-1 text-amber-300 font-mono">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    {Number(school.student_strength).toLocaleString('en-IN')} Students
                  </span>
                )}
                {school.contact_person && (
                  <span className="text-gray-300">
                    Contact: <strong>{school.contact_person}</strong> {school.phone ? `(${school.phone})` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Close Portfolio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-gray-300">Loading School Activity & Commercial History...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-300 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
              <p className="font-bold">{error}</p>
              <button
                onClick={loadPortfolio}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Executive Metrics Overview Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Visits Metric */}
                <div className="p-4 rounded-2xl bg-[#181924] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium">Total Field Visits</span>
                    <Calendar className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-white font-mono">{metrics.totalVisits || 0}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {metrics.uniqueCanvassers?.length > 0
                      ? `By: ${metrics.uniqueCanvassers.join(', ')}`
                      : 'No visits logged yet'}
                  </p>
                </div>

                {/* Quotations Metric */}
                <div className="p-4 rounded-2xl bg-[#181924] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium">Quotes Generated</span>
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-blue-300 font-mono">{metrics.totalQuotations || 0}</p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    ₹{(metrics.quotationsValue || 0).toLocaleString('en-IN')} total value
                  </p>
                </div>

                {/* Invoices Metric */}
                <div className="p-4 rounded-2xl bg-[#181924] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium">Invoices Issued</span>
                    <Receipt className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-emerald-300 font-mono">{metrics.totalInvoices || 0}</p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    ₹{(metrics.invoicedValue || 0).toLocaleString('en-IN')} billed
                  </p>
                </div>

                {/* Collection Balance Metric */}
                <div className="p-4 rounded-2xl bg-[#181924] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium">Outstanding Due</span>
                    <DollarSign className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className={cn(
                    "text-2xl font-black font-mono",
                    (metrics.outstandingBalance || 0) > 0 ? "text-amber-400" : "text-emerald-400"
                  )}>
                    ₹{(metrics.outstandingBalance || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono">
                    ₹{(metrics.paidAmount || 0).toLocaleString('en-IN')} collected
                  </p>
                </div>
              </div>

              {/* Navigation Tabs Inside Portfolio */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                  onClick={() => setActiveTab('visits')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer",
                    activeTab === 'visits'
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Visits History ({visits.length})
                </button>

                <button
                  onClick={() => setActiveTab('quotes')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer",
                    activeTab === 'quotes'
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Quotations ({quotations.length})
                </button>

                <button
                  onClick={() => setActiveTab('invoices')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer",
                    activeTab === 'invoices'
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Invoices & Payments ({invoices.length})
                </button>
              </div>

              {/* ── TAB 1: VISITS TIMELINE ─────────────────────────────────── */}
              {activeTab === 'visits' && (
                <div className="space-y-3">
                  {visits.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-white/5 rounded-2xl border border-white/5">
                      <Calendar className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                      <p className="font-semibold text-sm">No field visits logged for this school yet.</p>
                      <p className="text-xs text-gray-500 mt-1">Canvassers will log visits when meeting the institution.</p>
                    </div>
                  ) : (
                    visits.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="p-4 sm:p-5 rounded-2xl bg-[#171822] border border-white/10 hover:border-amber-400/30 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                              Visited by: {v.canvasser_name || 'Canvasser'}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-gray-500" />
                              {new Date(v.created_at || Date.now()).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Interest Level Badge */}
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border",
                              v.interest_level === 'Hot' ? "bg-rose-500/15 text-rose-300 border-rose-500/30" :
                              v.interest_level === 'Warm' ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                              v.interest_level === 'Cold' ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                              "bg-gray-500/15 text-gray-300 border-gray-500/30"
                            )}>
                              {v.interest_level || 'Warm'}
                            </span>

                            {/* Outcome Status Badge */}
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                              v.outcome_status === 'Won' ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                              v.outcome_status === 'Quote Given' ? "bg-purple-500/15 text-purple-300 border-purple-500/30" :
                              v.outcome_status === 'Sample Sent' ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                              v.outcome_status === 'Lost' ? "bg-rose-500/15 text-rose-300 border-rose-500/30" :
                              "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            )}>
                              {v.outcome_status || 'Open'}
                            </span>
                          </div>
                        </div>

                        {/* Contact details at time of visit */}
                        <div className="flex items-center gap-4 text-xs text-gray-300 flex-wrap bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <span>Contact Person: <strong className="text-white">{v.contact_person}</strong></span>
                          {v.phone && (
                            <a 
                              href={`tel:${v.phone}`}
                              className="text-amber-400 hover:underline flex items-center gap-1 font-mono"
                            >
                              <Phone className="w-3 h-3" />
                              {v.phone}
                            </a>
                          )}
                          {v.follow_up_date && (
                            <span className="text-purple-300 font-medium flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-purple-400" />
                              Follow-up Date: {v.follow_up_date}
                            </span>
                          )}
                        </div>

                        {/* Product Interests */}
                        {Array.isArray(v.product_interests) && v.product_interests.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-gray-400 font-semibold">Interested Products:</span>
                            {v.product_interests.map(prod => (
                              <ProductBadge key={prod} product={prod} />
                            ))}
                          </div>
                        )}

                        {/* Product Specs Requested */}
                        {v.product_specifications && (
                          <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                            <strong className="text-amber-400">Specifications:</strong> {v.product_specifications}
                          </p>
                        )}

                        {/* Notes */}
                        {v.notes && (
                          <p className="text-xs text-gray-300 italic bg-black/30 p-2.5 rounded-xl border border-white/5">
                            "{v.notes}"
                          </p>
                        )}

                        {/* Reference photos */}
                        {Array.isArray(v.attachments) && v.attachments.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Camera className="w-3 h-3 text-amber-400" />
                              Sample Photos ({v.attachments.length})
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {v.attachments.map((att, i) => (
                                <div
                                  key={att.id || i}
                                  onClick={() => setPreviewImage(att.url)}
                                  className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 cursor-pointer hover:border-amber-400 hover:scale-105 transition shadow-sm bg-black"
                                >
                                  <img src={att.url} alt={att.name || 'Sample'} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions row */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-gray-500">Visit Ref #{v.id}</span>
                          <button
                            onClick={() => setSelectedVisitForDetails(v)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 hover:text-amber-200 border border-white/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>View Full Visit Record</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── TAB 2: QUOTATIONS ──────────────────────────────────────── */}
              {activeTab === 'quotes' && (
                <div className="space-y-3">
                  {quotations.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-white/5 rounded-2xl border border-white/5">
                      <FileText className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                      <p className="font-semibold text-sm">No quotations generated for this school.</p>
                      <p className="text-xs text-gray-500 mt-1">Quotations created by canvassers or admin will show here.</p>
                    </div>
                  ) : (
                    quotations.map(q => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-[#171822] border border-white/10 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-400/10 border border-blue-400/25 px-2 py-0.5 rounded">
                                {q.id}
                              </span>
                              <span className="text-xs font-bold text-white">
                                ₹{Number(q.grand_total || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold">
                                {q.status || 'Sent'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400">
                              Issued by <strong className="text-gray-300">{q.canvasser_name}</strong> on {new Date(q.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>

                          <div className="text-xs text-gray-400 text-right">
                            <p>Contact: {q.contact_person} ({q.phone})</p>
                            <p className="text-[10px] text-gray-500">Subtotal: ₹{Number(q.subtotal || 0).toLocaleString('en-IN')} | Tax: ₹{Number(q.tax_amount || 0).toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Items listed */}
                        {Array.isArray(q.items) && q.items.length > 0 && (
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Quoted Line Items ({q.items.length})</p>
                            <div className="space-y-1">
                              {q.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs text-gray-300">
                                  <span>{item.name || item.product_name} <span className="text-gray-500">× {item.quantity} {item.unit || 'pcs'}</span></span>
                                  <span className="font-mono text-gray-200">₹{Number(item.total || (item.quantity * item.unit_price) || 0).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── TAB 3: INVOICES & PAYMENTS ─────────────────────────────── */}
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-white/5 rounded-2xl border border-white/5">
                      <Receipt className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                      <p className="font-semibold text-sm">No invoices issued for this school yet.</p>
                      <p className="text-xs text-gray-500 mt-1">Invoices and commercial collections will appear here.</p>
                    </div>
                  ) : (
                    invoices.map(inv => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl bg-[#171822] border border-white/10 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2 py-0.5 rounded">
                                {inv.id}
                              </span>
                              <span className="text-xs font-bold text-white font-mono">
                                Grand Total: ₹{Number(inv.grand_total || 0).toLocaleString('en-IN')}
                              </span>
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                inv.payment_status === 'Paid' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                                inv.payment_status === 'Partial' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                                "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              )}>
                                {inv.payment_status || 'Unpaid'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400">
                              Issued by <strong className="text-gray-300">{inv.canvasser_name}</strong> on {new Date(inv.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>

                          <div className="text-xs font-mono text-right">
                            <p className="text-emerald-400">Paid: ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}</p>
                            <p className="text-rose-400">Balance: ₹{Number(inv.outstanding_balance || 0).toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Payments recorded under this invoice */}
                        {payments.filter(p => p.invoice_id === inv.id).length > 0 && (
                          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Recorded Receipts
                            </p>
                            {payments.filter(p => p.invoice_id === inv.id).map(pmt => (
                              <div key={pmt.id} className="flex items-center justify-between text-xs text-gray-300 font-mono">
                                <span>{pmt.payment_method} • Ref: {pmt.reference_number || 'N/A'}</span>
                                <span className="text-emerald-400 font-bold">+₹{Number(pmt.amount).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>School Ref: <strong>{school.id || schoolId}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition cursor-pointer"
          >
            Close Portfolio
          </button>
        </div>
      </motion.div>

      {/* Detail Inspector Modal for Specific Visit */}
      <AnimatePresence>
        {selectedVisitForDetails && (
          <div 
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedVisitForDetails(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#171822] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 my-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                    Visit Record #{selectedVisitForDetails.id}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    {selectedVisitForDetails.school_name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Logged by <strong className="text-gray-200">{selectedVisitForDetails.canvasser_name}</strong> on {new Date(selectedVisitForDetails.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVisitForDetails(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Contact Information</span>
                  <p className="text-white font-semibold">{selectedVisitForDetails.contact_person}</p>
                  <a href={`tel:${selectedVisitForDetails.phone}`} className="text-amber-400 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedVisitForDetails.phone}
                  </a>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase">Status & Interest</span>
                  <p className="text-emerald-400 font-bold">Status: {selectedVisitForDetails.outcome_status}</p>
                  <p className="text-amber-300">Interest: {selectedVisitForDetails.interest_level}</p>
                  {selectedVisitForDetails.follow_up_date && (
                    <p className="text-purple-300 font-mono text-[11px]">Follow-up: {selectedVisitForDetails.follow_up_date}</p>
                  )}
                </div>
              </div>

              {/* Products */}
              {Array.isArray(selectedVisitForDetails.product_interests) && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-300">Target Products:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedVisitForDetails.product_interests.map(p => (
                      <ProductBadge key={p} product={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {selectedVisitForDetails.product_specifications && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-amber-400">Specifications & Custom Requirements:</span>
                  <p className="text-xs text-gray-200">{selectedVisitForDetails.product_specifications}</p>
                </div>
              )}

              {/* Notes */}
              {selectedVisitForDetails.notes && (
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-gray-400">Meeting Notes:</span>
                  <p className="text-xs text-gray-200 italic">"{selectedVisitForDetails.notes}"</p>
                </div>
              )}

              {/* Photos */}
              {Array.isArray(selectedVisitForDetails.attachments) && selectedVisitForDetails.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-300">Photos Attached:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedVisitForDetails.attachments.map((att, i) => (
                      <img
                        key={i}
                        src={att.url}
                        alt="Visit photo"
                        className="w-16 h-16 rounded-xl object-cover border border-white/20 cursor-pointer"
                        onClick={() => setPreviewImage(att.url)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedVisitForDetails(null)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 z-[10001] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-xl max-h-[85vh] bg-[#14151e] border border-white/20 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain" />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
