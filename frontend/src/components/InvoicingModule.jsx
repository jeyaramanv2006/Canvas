import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import { mockApi } from '../mockApi';
import InvoiceDocumentModal from './InvoiceDocumentModal';
import AestheticSelect from './AestheticSelect';
import { cn } from '../lib/utils';
import {
  FileText,
  Receipt,
  CreditCard,
  TrendingUp,
  PlusCircle,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  Plus,
  Minus,
  X,
  Eye,
  Edit2,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Tag,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// ── Refrens Style Interactive Financial Analytics Graph Component ───────────
function RefrensFinancialGraph({
  title,
  records,
  type,
  isOpen,
  onToggle,
  series1Label = 'Invoiced Amount',
  series2Label = 'Payment Received',
  series1Color = '#3B82F6',
  series2Color = '#10B981'
}) {
  const [frequency, setFrequency] = useState('Monthly'); // 'Monthly', 'Weekly', 'Quarterly', 'Daily'
  const [chartType, setChartType] = useState('Line Chart'); // 'Line Chart', 'Bar Chart', 'Scatter Plot'

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    const items = records.map(r => {
      const rawDate = r.created_at || r.recorded_at || r.date || r.voucherDate || '';
      const d = new Date(rawDate);
      const validDate = isNaN(d.getTime()) ? new Date() : d;

      let s1 = 0;
      let s2 = 0;

      if (type === 'invoice') {
        s1 = Number(r.grand_total || 0);
        s2 = Number(r.paid_amount || (r.status === 'PAID' ? r.grand_total : 0));
      } else if (type === 'quote') {
        s1 = Number(r.grand_total || 0);
        s2 = ['Quotation Accepted', 'Accepted', 'Sent', 'Quotation Seen'].includes(r.status) ? Number(r.grand_total || 0) : 0;
      } else if (type === 'proforma') {
        s1 = Number(r.grand_total || 0);
        s2 = r.status === 'Paid' ? Number(r.grand_total || 0) : 0;
      } else if (type === 'payment') {
        s1 = Number(r.amount || 0);
        s2 = (r.notes && r.notes.includes('Cancelled')) ? 0 : Number(r.amount || 0);
      }

      return { date: validDate, s1, s2 };
    }).sort((a, b) => a.date - b.date);

    const buckets = new Map();

    items.forEach(item => {
      let key = '';
      let label = '';
      const y = item.date.getFullYear();
      const m = item.date.getMonth();
      const d = item.date.getDate();

      if (frequency === 'Monthly') {
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        key = `${y}-${String(m + 1).padStart(2, '0')}`;
        label = `${monthNames[m]} ${y}`;
      } else if (frequency === 'Weekly') {
        const startOfYear = new Date(y, 0, 1);
        const weekNum = Math.ceil((((item.date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
        key = `${y}-W${weekNum}`;
        label = `W${weekNum} ${y}`;
      } else if (frequency === 'Quarterly') {
        const q = Math.floor(m / 3) + 1;
        key = `${y}-Q${q}`;
        label = `Q${q} ${y}`;
      } else if (frequency === 'Daily') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        label = `${d} ${monthNames[m]}`;
      }

      if (!buckets.has(key)) {
        buckets.set(key, { period: label, sortKey: key, series1: 0, series2: 0 });
      }
      const b = buckets.get(key);
      b.series1 += item.s1;
      b.series2 += item.s2;
    });

    return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [records, type, frequency]);

  const formatYAxis = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const frequencyOptions = [
    { id: 'Monthly', label: 'Monthly' },
    { id: 'Weekly', label: 'Weekly' },
    { id: 'Daily', label: 'Daily' },
    { id: 'Quarterly', label: 'Quarterly' }
  ];

  const chartTypeOptions = [
    { id: 'Line Chart', label: 'Line Chart' },
    { id: 'Bar Chart', label: 'Bar Chart' },
    { id: 'Scatter Plot', label: 'Scatter Plot' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-[#0f1118]/95 border border-white/20 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 z-50 backdrop-blur-2xl">
        <p className="font-black text-amber-300 pb-1 border-b border-white/10 uppercase tracking-wider font-mono">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 font-mono">
            <span className="flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="font-bold">{entry.name}:</span>
            </span>
            <span className="font-black text-white">₹{Number(entry.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl overflow-visible shadow-xl backdrop-blur-2xl transition-all relative">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 text-left font-black text-sm text-white hover:text-amber-300 transition-colors cursor-pointer select-none"
        >
          <div className={cn(
            "p-1.5 rounded-xl bg-white/[0.04] text-white/50 transition-transform duration-200",
            isOpen && "rotate-180 text-amber-400"
          )}>
            <ChevronDown className="w-4 h-4" />
          </div>
          <span className="tracking-tight">{title}</span>
        </button>

        {isOpen && (
          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap relative z-50">
            {/* Frequency Selector */}
            <div className="w-28 relative z-50">
              <AestheticSelect
                value={frequency}
                onChange={setFrequency}
                options={frequencyOptions}
                size="sm"
                buttonClassName="bg-black/40 border-white/[0.1] hover:border-white/20 font-medium py-1.5"
              />
            </div>

            {/* Chart Type Selector */}
            <div className="w-32 relative z-50">
              <AestheticSelect
                value={chartType}
                onChange={setChartType}
                options={chartTypeOptions}
                size="sm"
                buttonClassName="bg-black/40 border-white/[0.1] hover:border-white/20 font-medium py-1.5"
              />
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Chart Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] space-y-4">
          {chartData.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No financial entries recorded yet to plot graph.
            </div>
          ) : (
            <>
              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'Bar Chart' ? (
                    <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="period" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis tickFormatter={formatYAxis} stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="series1" name={series1Label} fill={series1Color} radius={[6, 6, 0, 0]} maxBarSize={40} />
                      {series2Label && (
                        <Bar dataKey="series2" name={series2Label} fill={series2Color} radius={[6, 6, 0, 0]} maxBarSize={40} />
                      )}
                    </BarChart>
                  ) : chartType === 'Scatter Plot' ? (
                    <ScatterChart margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="period" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis tickFormatter={formatYAxis} stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Scatter name={series1Label} data={chartData.map(d => ({ period: d.period, series1: d.series1, value: d.series1 }))} fill={series1Color} />
                      {series2Label && (
                        <Scatter name={series2Label} data={chartData.map(d => ({ period: d.period, series2: d.series2, value: d.series2 }))} fill={series2Color} />
                      )}
                    </ScatterChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="period" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis tickFormatter={formatYAxis} stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="series1"
                        name={series1Label}
                        stroke={series1Color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: series1Color, strokeWidth: 1, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                      {series2Label && (
                        <Line
                          type="monotone"
                          dataKey="series2"
                          name={series2Label}
                          stroke={series2Color}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: series2Color, strokeWidth: 1, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Timeline Scrollbar/Brush Indicator as in Refrens screenshot */}
              <div className="w-full h-2.5 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-between px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              </div>

              {/* Bottom Custom Legend matching Refrens */}
              <div className="flex items-center justify-center gap-6 pt-1 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: series1Color }} />
                  <span className="text-gray-300">{series1Label}</span>
                </div>
                {series2Label && (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: series2Color }} />
                    <span className="text-gray-300">{series2Label}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const PAY_MODE_OPTIONS = [
  { value: 'Bank Transfer (NEFT)', label: 'Bank Transfer / NEFT / RTGS' },
  { value: 'UPI (GPay / PhonePe)', label: 'UPI (GPay / PhonePe)' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Cash', label: 'Cash' },
];

export default function InvoicingModule({ currentUser }) {
  // Tabs: 'quotes' | 'proforma' | 'invoices' | 'payments'
  const [activeTab, setActiveTab] = useState('quotes');
  const [stats, setStats] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded row IDs for line items
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [expandAll, setExpandAll] = useState(false);

  // Collapsible cards for all sections
  const [showQuoteGraph, setShowQuoteGraph] = useState(true);
  const [showProformaSummary, setShowProformaSummary] = useState(true);
  const [showProformaGraph, setShowProformaGraph] = useState(true);
  const [showInvoiceGraph, setShowInvoiceGraph] = useState(true);
  const [showPaymentGraph, setShowPaymentGraph] = useState(true);

  // Filters & Search & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('date'); // 'date' | 'id' | 'subtotal' | 'grand_total' | 'balance'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Modal controls
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalType, setDocModalType] = useState('quote'); // 'quote' | 'proforma' | 'invoice'
  const [docModalMode, setDocModalMode] = useState('view'); // 'view' | 'create' | 'edit'
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Payment Recording Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Bank Transfer (NEFT)');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState(null);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Tag editing popover
  const [tagInputDocId, setTagInputDocId] = useState(null);
  const [tagInputValue, setTagInputValue] = useState('');

  // Lock body scroll when modals are open & handle Escape key
  useEffect(() => {
    if (payModalOpen || deleteModalOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setPayModalOpen(false);
          setDeleteModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = orig;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [payModalOpen, deleteModalOpen]);

  useEffect(() => {
    loadAllFinancialData();
  }, [currentUser]);

  const loadAllFinancialData = async (force = false) => {
    setLoading(true);
    try {
      const uId = currentUser?.id;
      const role = currentUser?.role;
      const [statsData, quotesData, proformaData, invsData, paysData] = await Promise.all([
        mockApi.getCFOAnalytics({ forceRefresh: force }).catch(() => null),
        mockApi.getQuotations({ forceRefresh: force }),
        mockApi.getProformaInvoices({ forceRefresh: force }),
        mockApi.getInvoices({ forceRefresh: force }),
        mockApi.getPayments({ forceRefresh: force })
      ]);

      setStats(statsData?.summary || { totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0 });
      setQuotations(quotesData || []);
      setProformaInvoices(proformaData || []);
      setInvoices(invsData || []);
      setPayments(paysData || []);
    } catch (e) {
      console.error("Failed loading invoicing suite data", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (expandAll) {
      setExpandedRows(new Set());
      setExpandAll(false);
    } else {
      let allIds = [];
      if (activeTab === 'quotes') allIds = quotations.map(q => q.id);
      else if (activeTab === 'proforma') allIds = proformaInvoices.map(p => p.id);
      else if (activeTab === 'invoices') allIds = invoices.map(i => i.id);
      else allIds = payments.map(p => p.id);
      setExpandedRows(new Set(allIds));
      setExpandAll(true);
    }
  };

  const formatINR = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Document Modal Triggers
  const handleCreateDocument = (type) => {
    setSelectedDoc(null);
    const normalized = (type === 'quote' || type === 'quotes' || type === 'quotation') ? 'quote' :
      (type === 'proforma' || type === 'proforma_invoice') ? 'proforma' : 'invoice';
    setDocModalType(normalized);
    setDocModalMode('create');
    setDocModalOpen(true);
  };

  const handleViewDoc = (doc, type) => {
    setSelectedDoc(doc);
    setDocModalType(type);
    setDocModalMode('view');
    setDocModalOpen(true);
  };

  const handleEditDoc = (doc, type) => {
    setSelectedDoc(doc);
    setDocModalType(type);
    setDocModalMode('edit');
    setDocModalOpen(true);
  };

  const handleDuplicateDoc = async (doc, type) => {
    try {
      const copyPayload = {
        ...doc,
        id: undefined, // auto-generates next contiguous ID
        created_at: new Date().toISOString()
      };
      if (type === 'quote') await mockApi.addQuotation(copyPayload, currentUser?.id, currentUser?.name);
      else if (type === 'proforma') await mockApi.addProformaInvoice(copyPayload, currentUser?.id, currentUser?.name);
      else await mockApi.addInvoice(copyPayload, currentUser?.id, currentUser?.name);
      await loadAllFinancialData();
    } catch (err) {
      alert("Failed to duplicate document: " + err.message);
    }
  };

  const handleConvertToInvoice = (sourceDoc, fromType) => {
    setSelectedDoc({
      ...sourceDoc,
      id: undefined, // Will receive new next sequential invoice number
      quotation_id: fromType === 'quote' ? sourceDoc.id : (sourceDoc.quotation_id || undefined),
      proforma_id: fromType === 'proforma' ? sourceDoc.id : undefined,
      doc_type: 'Tax Invoice'
    });
    setDocModalType('invoice');
    setDocModalMode('create');
    setDocModalOpen(true);
  };

  // Payment Recording
  const handleOpenPayModal = (inv) => {
    setSelectedInvoiceForPay(inv);
    setPayAmount(inv.outstanding_balance || inv.pending_balance || '');
    setPayMode('Bank Transfer (NEFT)');
    setPayRef('');
    setPayNotes('');
    setPayError(null);
    setPayModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay || !payAmount || Number(payAmount) <= 0) return;

    setPaySubmitting(true);
    setPayError(null);
    try {
      await mockApi.recordPayment(selectedInvoiceForPay.id, {
        amount: Number(payAmount),
        payment_method: payMode,
        reference_number: payRef,
        notes: payNotes,
        date: new Date().toISOString()
      });
      setPayModalOpen(false);
      await loadAllFinancialData();
    } catch (err) {
      setPayError(err.message || "Failed to record payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Delete Handlers with Gapless Auto-Resequencing
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      if (itemToDelete.type === 'quote') {
        await mockApi.deleteQuotation(itemToDelete.id);
      } else if (itemToDelete.type === 'proforma') {
        await mockApi.deleteProformaInvoice(itemToDelete.id);
      } else if (itemToDelete.type === 'invoice') {
        await mockApi.deleteInvoice(itemToDelete.id);
      } else if (itemToDelete.type === 'payment') {
        await mockApi.deletePayment(itemToDelete.id);
      }
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadAllFinancialData();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Quick Tag Management
  const handleAddTag = async (doc, type) => {
    if (!tagInputValue.trim()) return;
    const currentTags = doc.tags || [];
    const newTag = tagInputValue.trim();
    if (currentTags.includes(newTag)) {
      setTagInputDocId(null);
      setTagInputValue('');
      return;
    }
    const updatedTags = [...currentTags, newTag];
    try {
      if (type === 'quote') await mockApi.updateQuotation(doc.id, { tags: updatedTags });
      else if (type === 'proforma') await mockApi.updateProformaInvoice(doc.id, { tags: updatedTags });
      else if (type === 'invoice') await mockApi.updateInvoice(doc.id, { tags: updatedTags });
      else if (type === 'payment') await mockApi.updatePayment(doc.id, { tags: updatedTags });
      await loadAllFinancialData();
    } catch (e) {
      console.error("Failed to add tag:", e);
    } finally {
      setTagInputDocId(null);
      setTagInputValue('');
    }
  };

  const handleRemoveTag = async (doc, type, tagToRemove) => {
    const currentTags = doc.tags || [];
    const updatedTags = currentTags.filter(t => t !== tagToRemove);
    try {
      if (type === 'quote') await mockApi.updateQuotation(doc.id, { tags: updatedTags });
      else if (type === 'proforma') await mockApi.updateProformaInvoice(doc.id, { tags: updatedTags });
      else if (type === 'invoice') await mockApi.updateInvoice(doc.id, { tags: updatedTags });
      else if (type === 'payment') await mockApi.updatePayment(doc.id, { tags: updatedTags });
      await loadAllFinancialData();
    } catch (e) {
      console.error("Failed to remove tag:", e);
    }
  };

  // Sorting comparator
  const sortComparator = (a, b) => {
    let result = 0;
    if (sortField === 'date') {
      const dateA = new Date(a.created_at || a.recorded_at || a.date || 0).getTime();
      const dateB = new Date(b.created_at || b.recorded_at || b.date || 0).getTime();
      result = dateA - dateB;
    } else if (sortField === 'id') {
      const idA = (a.id || '').toString();
      const idB = (b.id || '').toString();
      result = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortField === 'subtotal') {
      const subA = Number(a.subtotal != null ? a.subtotal : (a.grand_total ? a.grand_total * 0.95 : (a.amount || 0))) || 0;
      const subB = Number(b.subtotal != null ? b.subtotal : (b.grand_total ? b.grand_total * 0.95 : (b.amount || 0))) || 0;
      result = subA - subB;
    } else if (sortField === 'grand_total') {
      const totalA = Number(a.grand_total != null ? a.grand_total : a.amount) || 0;
      const totalB = Number(b.grand_total != null ? b.grand_total : b.amount) || 0;
      result = totalA - totalB;
    } else if (sortField === 'balance') {
      const balA = Number(a.outstanding_balance) || 0;
      const balB = Number(b.outstanding_balance) || 0;
      result = balA - balB;
    }
    return sortDirection === 'desc' ? -result : result;
  };

  // Toggle sort helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered & Sorted lists
  const filteredQuotes = quotations.filter(q => {
    const matchesSearch = !searchTerm ||
      q.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.district?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    return q.status?.toLowerCase() === statusFilter.toLowerCase();
  }).sort(sortComparator);

  const filteredProforma = proformaInvoices.filter(p => {
    const matchesSearch = !searchTerm ||
      p.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    return p.status?.toLowerCase() === statusFilter.toLowerCase();
  }).sort(sortComparator);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchTerm ||
      inv.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.district?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Overdue') {
      return inv.payment_status !== 'Fully Paid' && inv.status !== 'Paid' && inv.due_date && new Date(inv.due_date) < new Date();
    }
    return (inv.payment_status || inv.status)?.toLowerCase() === statusFilter.toLowerCase();
  }).sort(sortComparator);

  const filteredPayments = payments.filter(p => {
    return !searchTerm ||
      p.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort(sortComparator);

  // Status options per tab
  const currentStatusOptions = useMemo(() => {
    if (activeTab === 'quotes') {
      return [
        { id: 'All', label: 'All Statuses' },
        { id: 'Draft', label: 'Draft' },
        { id: 'Quotation Sent', label: 'Quotation Sent' },
        { id: 'Quotation Seen', label: 'Quotation Seen' },
        { id: 'Quotation Accepted', label: 'Accepted' },
        { id: 'Pending', label: 'Pending' }
      ];
    } else if (activeTab === 'proforma') {
      return [
        { id: 'All', label: 'All Statuses' },
        { id: 'Draft', label: 'Draft' },
        { id: 'Pending', label: 'Pending' },
        { id: 'Paid', label: 'Paid' },
        { id: 'Overdue', label: 'Overdue' }
      ];
    } else if (activeTab === 'invoices') {
      return [
        { id: 'All', label: 'All Statuses' },
        { id: 'Unpaid', label: 'Unpaid' },
        { id: 'Partially Paid', label: 'Partially Paid' },
        { id: 'Fully Paid', label: 'Fully Paid' },
        { id: 'Overdue', label: 'Overdue' }
      ];
    }
    return [
      { id: 'All', label: 'All Statuses' }
    ];
  }, [activeTab]);

  const sortFieldOptions = useMemo(() => {
    const list = [
      { id: 'date', label: 'Date' },
      { id: 'id', label: activeTab === 'quotes' ? 'Quote #' : activeTab === 'proforma' ? 'Proforma #' : activeTab === 'invoices' ? 'Invoice #' : 'Receipt #' },
      { id: 'subtotal', label: 'Sub Total' },
      { id: 'grand_total', label: activeTab === 'payments' ? 'Amount Paid' : 'Grand Total' }
    ];
    if (activeTab === 'invoices') {
      list.push({ id: 'balance', label: 'Balance Due' });
    }
    return list;
  }, [activeTab]);

  // Calculate Proforma Summary metrics
  const proformaTotal = proformaInvoices.reduce((s, p) => s + (Number(p.grand_total) || 0), 0);
  const proformaPaid = proformaInvoices.filter(p => p.status === 'Paid').reduce((s, p) => s + (Number(p.grand_total) || 0), 0);
  const proformaOverdue = proformaInvoices.filter(p => p.status === 'Overdue').reduce((s, p) => s + (Number(p.grand_total) || 0), 0);
  const proformaPending = proformaTotal - proformaPaid;

  return (
    <div className="space-y-6 selection:bg-amber-400 selection:text-black">

      {/* ── 1. Clean Neat Navigation Bar ───────────────────────────────────── */}
      <div className="bg-[#0e1017]/90 border border-white/[0.08] p-1.5 sm:p-2 rounded-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
        {/* Navigation Tabs with Seamless Apple UI Pill Transition */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'quotes', label: 'Quotation', count: quotations.length, icon: FileText },
            { id: 'proforma', label: 'Proforma invoice', count: proformaInvoices.length, icon: Layers },
            { id: 'invoices', label: 'Tax invoice', count: invoices.length, icon: Receipt },
            { id: 'payments', label: 'Payment receipts', count: payments.length, icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setExpandedRows(new Set());
                  setExpandAll(false);
                  setStatusFilter('All');
                }}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer z-10",
                  isActive
                    ? "text-black font-black"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeInvoicingTabPill"
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                  />
                )}
                <Icon className={cn("w-3.5 h-3.5 relative z-10 transition-transform duration-200", isActive ? "text-black scale-105" : "text-white/50")} />
                <span className="relative z-10 tracking-tight">{tab.label}</span>
                <span className={cn(
                  "relative z-10 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold",
                  isActive ? "bg-black/20 text-black" : "bg-white/[0.06] text-white/50"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Button */}
          <button
            type="button"
            onClick={() => loadAllFinancialData(true)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 hover:border-amber-400/30 active:scale-95 disabled:opacity-50"
            title="Sync and pull latest financial records from database"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", loading && "animate-spin")} />
            <span>{loading ? "Syncing..." : "Sync"}</span>
          </button>

          {/* Create new button */}
          <button
            type="button"
            onClick={() => handleCreateDocument(activeTab === 'invoices' ? 'invoice' : activeTab === 'proforma' ? 'proforma' : 'quote')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer bg-white/[0.06] hover:bg-white/[0.12] text-white hover:text-amber-300 border border-white/15 hover:border-amber-400/40 active:scale-95 shadow-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] text-amber-400" />
            <span>Create new</span>
          </button>
        </div>
      </div>

      {/* ── 2. SECTION FINANCIAL GRAPHS (Refrens Interactive Analytics) ────── */}
      {activeTab === 'quotes' && (
        <RefrensFinancialGraph
          title="Quotation Graph"
          records={quotations}
          type="quote"
          isOpen={showQuoteGraph}
          onToggle={() => setShowQuoteGraph(!showQuoteGraph)}
          series1Label="Quoted Amount"
          series2Label="Quotation Accepted"
          series1Color="#3B82F6"
          series2Color="#10B981"
        />
      )}

      {activeTab === 'invoices' && (
        <RefrensFinancialGraph
          title="Invoice Graph"
          records={invoices}
          type="invoice"
          isOpen={showInvoiceGraph}
          onToggle={() => setShowInvoiceGraph(!showInvoiceGraph)}
          series1Label="Invoiced Amount"
          series2Label="Payment Received"
          series1Color="#3B82F6"
          series2Color="#10B981"
        />
      )}

      {/* ── 2b. PROFORMA INVOICE COLLAPSIBLE ANALYTICS (Obsidian Lucid Block) ─ */}
      {activeTab === 'proforma' && (
        <div className="space-y-3">
          <RefrensFinancialGraph
            title="Proforma Invoice Graph"
            records={proformaInvoices}
            type="proforma"
            isOpen={showProformaGraph}
            onToggle={() => setShowProformaGraph(!showProformaGraph)}
            series1Label="Proforma Invoiced"
            series2Label="Payment Received"
            series1Color="#A855F7"
            series2Color="#10B981"
          />

          {/* Summary Accordion */}
          <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setShowProformaSummary(!showProformaSummary)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-black text-sm text-white hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-xl bg-white/[0.04] text-white/50 transition-transform duration-200",
                  showProformaSummary && "rotate-180 text-amber-400"
                )}>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <span>Proforma Invoice Summary</span>
              </div>
              <span className="text-xs text-white/50 font-normal font-mono">
                {proformaInvoices.length} Documents · <strong className="text-white font-bold">{formatINR(proformaTotal)}</strong> Total Value
              </span>
            </button>

            {showProformaSummary && (
              <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-white/[0.06]">
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-2xl">
                  <span className="text-[11px] text-white/40 font-medium block">Total Proforma Value</span>
                  <div className="text-lg font-black text-white font-mono mt-1">{formatINR(proformaTotal)}</div>
                  <span className="text-[10px] text-white/50">{proformaInvoices.length} Issued</span>
                </div>
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-2xl">
                  <span className="text-[11px] text-emerald-400 font-medium block">Converted / Paid</span>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-1">{formatINR(proformaPaid)}</div>
                  <span className="text-[10px] text-white/50">{proformaInvoices.filter(p => p.status === 'Paid').length} Completed</span>
                </div>
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-2xl">
                  <span className="text-[11px] text-rose-400 font-medium block">Overdue Proforma</span>
                  <div className="text-lg font-black text-rose-400 font-mono mt-1">{formatINR(proformaOverdue)}</div>
                  <span className="text-[10px] text-white/50">{proformaInvoices.filter(p => p.status === 'Overdue').length} Awaiting Advance</span>
                </div>
                <div className="bg-black/40 border border-white/[0.06] p-4 rounded-2xl">
                  <span className="text-[11px] text-amber-400 font-medium block">Pending Conversion</span>
                  <div className="text-lg font-black text-amber-400 font-mono mt-1">{formatINR(proformaPending)}</div>
                  <span className="text-[10px] text-white/50">Pipeline Active</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Search, Filters & Table Toolbar (Lucid Block) ───────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl backdrop-blur-2xl relative z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Showing <strong className="text-white font-mono font-bold">1 to {
              activeTab === 'quotes' ? filteredQuotes.length :
              activeTab === 'proforma' ? filteredProforma.length :
              activeTab === 'invoices' ? filteredInvoices.length : filteredPayments.length
            }</strong> of <strong className="text-amber-400 font-mono font-bold">{
              activeTab === 'quotes' ? quotations.length :
              activeTab === 'proforma' ? proformaInvoices.length :
              activeTab === 'invoices' ? invoices.length : payments.length
            }</strong> {
              activeTab === 'quotes' ? 'Quotations' :
              activeTab === 'proforma' ? 'Proforma Invoices' :
              activeTab === 'invoices' ? 'Tax Invoices' : 'Payment Receipts'
            }</span>
          </div>

          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search institution or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-white/35 focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-36 relative z-40">
              <AestheticSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={currentStatusOptions}
                size="sm"
                buttonClassName="bg-black/40 border-white/[0.1] hover:border-white/20 font-medium py-2"
              />
            </div>

            {/* Sort Field */}
            <div className="w-36 relative z-40">
              <AestheticSelect
                value={sortField}
                onChange={setSortField}
                options={sortFieldOptions}
                size="sm"
                buttonClassName="bg-black/40 border-white/[0.1] hover:border-white/20 font-medium py-2"
              />
            </div>

            {/* Sort Direction Toggle */}
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Switch sort order (Current: ${sortDirection === 'asc' ? 'Ascending' : 'Descending'})`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] hover:border-white/20 transition text-xs font-mono font-bold cursor-pointer"
            >
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>ASC</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>DESC</span>
                </>
              )}
            </button>

            {/* Expand / Collapse All Toggle */}
            <button
              type="button"
              onClick={handleToggleExpandAll}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer",
                expandAll
                  ? "bg-amber-400 text-black border-amber-400 font-black shadow-md shadow-amber-400/20"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-white/70 hover:text-white"
              )}
            >
              {expandAll ? <Minus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{expandAll ? 'Collapse Items' : 'Expand Items'}</span>
            </button>
          </div>
        </div>

        {/* ── 4. Refrens Standard Table ─────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 w-28 cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Click to sort by Date"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {sortField === 'date' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-3 w-40 min-w-[140px] whitespace-nowrap cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Click to sort by Document Number"
                >
                  <div className="flex items-center gap-1.5">
                    <span>
                      {activeTab === 'quotes' ? 'Quotation #' :
                       activeTab === 'proforma' ? 'Proforma #' :
                       activeTab === 'invoices' ? 'Invoice #' : 'Receipt #'}
                    </span>
                    {sortField === 'id' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[200px]">
                  {activeTab === 'payments' ? 'Billed To / School' : 'Quoted / Billed To'}
                </th>
                <th
                  onClick={() => handleSort('subtotal')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Click to sort by Sub Total"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Sub Total</span>
                    {sortField === 'subtotal' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('grand_total')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-amber-300 transition-colors select-none"
                  title="Click to sort by Amount in INR"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>
                      {activeTab === 'payments' ? 'Amount Paid' : 'Amount in INR'}
                    </span>
                    {sortField === 'grand_total' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                    )}
                  </div>
                </th>
                {activeTab === 'invoices' && (
                  <th
                    onClick={() => handleSort('balance')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-amber-300 transition-colors select-none"
                    title="Click to sort by Balance Due"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Balance Due</span>
                      {sortField === 'balance' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                      )}
                    </div>
                  </th>
                )}
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 min-w-[120px]">Tags</th>
                <th className="py-3 px-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading live financial records from database...
                  </td>
                </tr>
              ) : (
                <>
                  {/* TAB 1: QUOTATIONS */}
                  {activeTab === 'quotes' && filteredQuotes.map((q, idx) => {
                    const isExpanded = expandedRows.has(q.id);
                    const items = q.items || [];
                    return (
                      <React.Fragment key={q.id}>
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 text-gray-300 whitespace-nowrap font-medium">{formatDate(q.created_at || q.date)}</td>
                          <td className="py-3 px-3 whitespace-nowrap w-40 min-w-[140px]">
                            <span className="inline-flex items-center justify-center min-w-[100px] px-3.5 py-1.5 rounded-xl font-mono font-black text-xs whitespace-nowrap bg-amber-400/10 border-2 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-400/10 tracking-wider">
                              {q.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white group-hover:text-amber-300 transition-colors uppercase tracking-tight">
                              {q.school_name}
                            </div>
                            <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>{q.district || 'Tamil Nadu'}</span>
                              {q.contact_person && <span>· {q.contact_person}</span>}
                              <span className="text-gray-600">·</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                q.canvasser_name === 'Refrens Import' || Number(q.canvasser_id) === 99
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                              }`}>
                                Canvasser: {q.canvasser_name || 'Refrens Import'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-400">{formatINR(q.subtotal || q.grand_total * 0.95)}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-white">{formatINR(q.grand_total)}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              q.status === 'Quotation Seen' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              q.status === 'Quotation Sent' || q.status === 'Sent' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                              q.status === 'Draft' ? 'bg-gray-500/15 text-gray-300 border border-gray-500/30' :
                              'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}>
                              {q.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1">
                              {(q.tags || []).map((t, tIdx) => (
                                <span key={tIdx} className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  <span>{t}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveTag(q, 'quote', t); }}
                                    title={`Remove ${t}`}
                                    className="text-purple-400 hover:text-rose-400 ml-0.5 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                              {tagInputDocId === q.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder="Tag..."
                                    value={tagInputValue}
                                    onChange={(e) => setTagInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(q, 'quote'); }}
                                    className="w-16 bg-black border border-amber-400 px-1 py-0.5 text-[9px] text-white rounded"
                                  />
                                  <button onClick={() => handleAddTag(q, 'quote')} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check className="w-3 h-3" /></button>
                                  <button onClick={() => setTagInputDocId(null)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setTagInputDocId(q.id); setTagInputValue(''); }}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  + Add Tags
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 text-gray-400">
                              <button
                                onClick={() => toggleRowExpand(q.id)}
                                title="Expand line items"
                                className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-amber-400/20 text-amber-400' : 'hover:bg-white/10 hover:text-white'}`}
                              >
                                {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleViewDoc(q, 'quote')}
                                title="View & Print Document"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditDoc(q, 'quote')}
                                title="Edit Quotation"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-amber-400 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleConvertToInvoice(q, 'quote')}
                                title="Convert to Tax Invoice"
                                className="p-1.5 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateDoc(q, 'quote')}
                                title="Duplicate with next sequence ID"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-blue-400 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { setItemToDelete({ id: q.id, type: 'quote', name: q.school_name }); setDeleteModalOpen(true); }}
                                title="Delete & Adjust Numbering Sequence"
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Line Items Row */}
                        {isExpanded && (
                          <tr className="bg-black/40 border-b border-white/10">
                            <td colSpan="10" className="p-4 pl-12">
                              <div className="bg-[#181922] border border-white/10 rounded-xl p-3 space-y-2">
                                <div className="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center justify-between">
                                  <span>Quotation Line Items Breakdown ({items.length} items)</span>
                                  <span className="text-amber-400 font-mono">{q.id}</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                  {items.map((it, iIdx) => (
                                    <div key={iIdx} className="py-1.5 flex items-center justify-between text-xs text-gray-300">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500 font-mono text-[10px]">#{iIdx + 1}</span>
                                        <span className="font-bold text-white">{it.name || it.item_name || 'Custom Product'}</span>
                                        {it.size && it.size !== '-' && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">Size: {it.size}</span>}
                                        {it.hsn && <span className="text-[10px] text-gray-500">HSN: {it.hsn}</span>}
                                      </div>
                                      <div className="flex items-center gap-4 font-mono text-xs">
                                        <span>{it.quantity} {it.unit || 'units'} × {formatINR(it.unit_rate || it.rate || 0)}</span>
                                        <span className="text-gray-400">GST: {it.gst_rate || 5}%</span>
                                        <span className="font-bold text-white">{formatINR(it.total || (it.quantity * (it.unit_rate || 0) * 1.05))}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* TAB 2: PROFORMA INVOICES */}
                  {activeTab === 'proforma' && filteredProforma.map((p, idx) => {
                    const isExpanded = expandedRows.has(p.id);
                    const items = p.items || [];
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 text-gray-300 whitespace-nowrap font-medium">{formatDate(p.created_at || p.date)}</td>
                          <td className="py-3 px-3 whitespace-nowrap w-40 min-w-[140px]">
                            <span className="inline-flex items-center justify-center min-w-[100px] px-3.5 py-1.5 rounded-xl font-mono font-black text-xs whitespace-nowrap bg-purple-400/10 border-2 border-purple-400/50 text-purple-300 shadow-sm shadow-purple-400/10 tracking-wider">
                              {p.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">
                              {p.school_name}
                            </div>
                            <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>{p.district || 'Tamil Nadu'}</span>
                              {p.contact_person && <span>· {p.contact_person}</span>}
                              <span className="text-gray-600">·</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                p.canvasser_name === 'Refrens Import' || Number(p.canvasser_id) === 99
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                              }`}>
                                Canvasser: {p.canvasser_name || 'Refrens Import'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-400">{formatINR(p.subtotal || p.grand_total * 0.95)}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-white">{formatINR(p.grand_total)}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                p.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                p.status === 'Overdue' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                                'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}>
                                {p.status || 'Pending'}
                              </span>
                              {p.due_date && (
                                <span className="text-[9px] text-gray-500 mt-0.5 font-mono">
                                  Due on {formatDate(p.due_date)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1">
                              {(p.tags || []).map((t, tIdx) => (
                                <span key={tIdx} className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  <span>{t}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveTag(p, 'proforma', t); }}
                                    title={`Remove ${t}`}
                                    className="text-purple-400 hover:text-rose-400 ml-0.5 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                              {tagInputDocId === p.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder="Tag..."
                                    value={tagInputValue}
                                    onChange={(e) => setTagInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(p, 'proforma'); }}
                                    className="w-16 bg-black border border-purple-400 px-1 py-0.5 text-[9px] text-white rounded"
                                  />
                                  <button onClick={() => handleAddTag(p, 'proforma')} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check className="w-3 h-3" /></button>
                                  <button onClick={() => setTagInputDocId(null)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setTagInputDocId(p.id); setTagInputValue(''); }}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  + Add Tags
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 text-gray-400">
                              <button
                                onClick={() => toggleRowExpand(p.id)}
                                title="Expand line items"
                                className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-purple-400/20 text-purple-400' : 'hover:bg-white/10 hover:text-white'}`}
                              >
                                {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleViewDoc(p, 'proforma')}
                                title="View & Print Proforma Invoice"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditDoc(p, 'proforma')}
                                title="Edit Proforma Invoice"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-purple-400 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleConvertToInvoice(p, 'proforma')}
                                title="Convert to Tax Invoice"
                                className="p-1.5 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateDoc(p, 'proforma')}
                                title="Duplicate with next sequence ID"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-blue-400 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { setItemToDelete({ id: p.id, type: 'proforma', name: p.school_name }); setDeleteModalOpen(true); }}
                                title="Delete & Adjust Numbering Sequence"
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Line Items Row */}
                        {isExpanded && (
                          <tr className="bg-black/40 border-b border-white/10">
                            <td colSpan="10" className="p-4 pl-12">
                              <div className="bg-[#181922] border border-white/10 rounded-xl p-3 space-y-2">
                                <div className="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center justify-between">
                                  <span>Proforma Invoice Line Items Breakdown ({items.length} items)</span>
                                  <span className="text-purple-400 font-mono">{p.id}</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                  {items.map((it, iIdx) => (
                                    <div key={iIdx} className="py-1.5 flex items-center justify-between text-xs text-gray-300">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500 font-mono text-[10px]">#{iIdx + 1}</span>
                                        <span className="font-bold text-white">{it.name || it.item_name || 'Custom Item'}</span>
                                        {it.size && it.size !== '-' && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">Size: {it.size}</span>}
                                        {it.hsn && <span className="text-[10px] text-gray-500">HSN: {it.hsn}</span>}
                                      </div>
                                      <div className="flex items-center gap-4 font-mono text-xs">
                                        <span>{it.quantity} {it.unit || 'units'} × {formatINR(it.unit_rate || it.rate || 0)}</span>
                                        <span className="text-gray-400">GST: {it.gst_rate || 5}%</span>
                                        <span className="font-bold text-white">{formatINR(it.total || (it.quantity * (it.unit_rate || 0) * 1.05))}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* TAB 3: INVOICES */}
                  {activeTab === 'invoices' && filteredInvoices.map((inv, idx) => {
                    const isExpanded = expandedRows.has(inv.id);
                    const items = inv.items || [];
                    const isPaid = inv.payment_status === 'Fully Paid' || inv.status === 'Paid' || inv.outstanding_balance === 0;
                    return (
                      <React.Fragment key={inv.id}>
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 text-gray-300 whitespace-nowrap font-medium">{formatDate(inv.created_at || inv.date)}</td>
                          <td className="py-3 px-3 whitespace-nowrap w-40 min-w-[140px]">
                            <span className="inline-flex items-center justify-center min-w-[100px] px-3.5 py-1.5 rounded-xl font-mono font-black text-xs whitespace-nowrap bg-amber-400/10 border-2 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-400/10 tracking-wider">
                              {inv.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white group-hover:text-amber-300 transition-colors uppercase tracking-tight">
                              {inv.school_name}
                            </div>
                            <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>{inv.district || 'Tamil Nadu'}</span>
                              {inv.contact_person && <span>· {inv.contact_person}</span>}
                              <span className="text-gray-600">·</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                inv.canvasser_name === 'Refrens Import' || Number(inv.canvasser_id) === 99
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                              }`}>
                                Canvasser: {inv.canvasser_name || 'Refrens Import'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-400">{formatINR(inv.subtotal || inv.grand_total * 0.95)}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-white">{formatINR(inv.grand_total)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                            {formatINR(inv.outstanding_balance || 0)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPaid ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              (inv.paid_amount > 0) ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              {inv.payment_status || (isPaid ? 'Fully Paid' : 'Unpaid')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1">
                              {(inv.tags || []).map((t, tIdx) => (
                                <span key={tIdx} className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  <span>{t}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveTag(inv, 'invoice', t); }}
                                    title={`Remove ${t}`}
                                    className="text-purple-400 hover:text-rose-400 ml-0.5 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                              {tagInputDocId === inv.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder="Tag..."
                                    value={tagInputValue}
                                    onChange={(e) => setTagInputValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(inv, 'invoice'); }}
                                    className="w-16 bg-black border border-amber-400 px-1 py-0.5 text-[9px] text-white rounded"
                                  />
                                  <button onClick={() => handleAddTag(inv, 'invoice')} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check className="w-3 h-3" /></button>
                                  <button onClick={() => setTagInputDocId(null)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setTagInputDocId(inv.id); setTagInputValue(''); }}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  + Add Tags
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 text-gray-400">
                              <button
                                onClick={() => toggleRowExpand(inv.id)}
                                title="Expand line items"
                                className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-amber-400/20 text-amber-400' : 'hover:bg-white/10 hover:text-white'}`}
                              >
                                {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleViewDoc(inv, 'invoice')}
                                title="View & Print Invoice"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {!isPaid && (
                                <button
                                  onClick={() => handleOpenPayModal(inv)}
                                  title="Record Payment"
                                  className="p-1.5 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditDoc(inv, 'invoice')}
                                title="Edit Invoice"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-amber-400 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateDoc(inv, 'invoice')}
                                title="Duplicate with next sequence ID"
                                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-blue-400 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { setItemToDelete({ id: inv.id, type: 'invoice', name: inv.school_name }); setDeleteModalOpen(true); }}
                                title="Delete & Adjust Numbering Sequence"
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Line Items Row */}
                        {isExpanded && (
                          <tr className="bg-black/40 border-b border-white/10">
                            <td colSpan="10" className="p-4 pl-12">
                              <div className="bg-[#181922] border border-white/10 rounded-xl p-3 space-y-2">
                                <div className="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center justify-between">
                                  <span>Tax Invoice Line Items Breakdown ({items.length} items)</span>
                                  <span className="text-amber-400 font-mono">{inv.id}</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                  {items.map((it, iIdx) => (
                                    <div key={iIdx} className="py-1.5 flex items-center justify-between text-xs text-gray-300">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500 font-mono text-[10px]">#{iIdx + 1}</span>
                                        <span className="font-bold text-white">{it.name || it.item_name || 'Custom Product Item'}</span>
                                        {it.size && it.size !== '-' && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">Size: {it.size}</span>}
                                        {it.hsn && <span className="text-[10px] text-gray-500">HSN: {it.hsn}</span>}
                                      </div>
                                      <div className="flex items-center gap-4 font-mono text-xs">
                                        <span>{it.quantity} {it.unit || 'units'} × {formatINR(it.unit_rate || it.rate || 0)}</span>
                                        <span className="text-gray-400">GST: {it.gst_rate || 5}%</span>
                                        <span className="font-bold text-white">{formatINR(it.total || (it.quantity * (it.unit_rate || 0) * 1.05))}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* TAB 4: PAYMENT RECEIPTS */}
                  {activeTab === 'payments' && filteredPayments.map((p, idx) => {
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 text-gray-300 whitespace-nowrap font-medium">{formatDate(p.recorded_at || p.date)}</td>
                        <td className="py-3 px-3 whitespace-nowrap w-40 min-w-[140px]">
                          <span className="inline-flex items-center justify-center min-w-[100px] px-3.5 py-1.5 rounded-xl font-mono font-black text-xs whitespace-nowrap bg-emerald-400/10 border-2 border-emerald-400/50 text-emerald-300 shadow-sm shadow-emerald-400/10 tracking-wider">
                            {p.id}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white group-hover:text-emerald-300 transition-colors uppercase tracking-tight">
                            {p.school_name}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <span>Ref: {p.reference_number || 'Cash/Direct'}</span>
                            {p.invoice_id && <span>· Linked Invoice: {p.invoice_id}</span>}
                            {p.notes && <span>· {p.notes}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-400">{p.payment_method || 'Bank Transfer'}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">{formatINR(p.amount)}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Received
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {(p.tags || []).map((t, tIdx) => (
                              <span key={tIdx} className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                <span>{t}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveTag(p, 'payment', t); }}
                                  title={`Remove ${t}`}
                                  className="text-purple-400 hover:text-rose-400 ml-0.5 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                            {tagInputDocId === p.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Tag..."
                                  value={tagInputValue}
                                  onChange={(e) => setTagInputValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(p, 'payment'); }}
                                  className="w-16 bg-black border border-emerald-400 px-1 py-0.5 text-[9px] text-white rounded"
                                />
                                <button onClick={() => handleAddTag(p, 'payment')} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check className="w-3 h-3" /></button>
                                <button onClick={() => setTagInputDocId(null)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setTagInputDocId(p.id); setTagInputValue(''); }}
                                className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                + Add Tags
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 text-gray-400">
                            <button
                              onClick={() => { setItemToDelete({ id: p.id, type: 'payment', name: p.school_name }); setDeleteModalOpen(true); }}
                              title="Delete Receipt & Adjust Numbering"
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Payment Recording Modal ───────────────────────────────────────── */}
      {payModalOpen && selectedInvoiceForPay && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setPayModalOpen(false)}
        >
          <div
            className="bg-[#0e1017]/95 border border-white/[0.12] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 my-auto relative z-10 transition-all backdrop-blur-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Record Payment</h3>
                  <p className="text-xs text-emerald-400/90 font-mono font-semibold">Invoice: {selectedInvoiceForPay.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setPayModalOpen(false)} 
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl space-y-2">
              <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Billed To Client</div>
              <div className="text-sm font-bold text-white">{selectedInvoiceForPay.school_name}</div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                <span className="text-gray-400">Total: {formatINR(selectedInvoiceForPay.grand_total)}</span>
                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  Outstanding: {formatINR(selectedInvoiceForPay.outstanding_balance)}
                </span>
              </div>
            </div>

            {payError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-300">Payment Amount (₹) *</label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(selectedInvoiceForPay.outstanding_balance))}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/20 transition-all cursor-pointer"
                  >
                    Pay Full Balance (₹{Number(selectedInvoiceForPay.outstanding_balance || 0).toLocaleString('en-IN')})
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  max={selectedInvoiceForPay.outstanding_balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Payment Mode</label>
                <AestheticSelect
                  value={payMode}
                  onChange={setPayMode}
                  options={PAY_MODE_OPTIONS}
                  size="md"
                  placeholder="Select payment mode..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR192830192 / CHQ-1029"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Payment receipt remarks..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {paySubmitting ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── 6. Delete Confirmation Modal (Gapless Renumbering Assurance) ───────── */}
      {deleteModalOpen && itemToDelete && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-[#0e1017]/95 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto relative z-10 transition-all backdrop-blur-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Document</h3>
                <p className="text-xs text-rose-400 font-mono font-bold">{itemToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">{itemToDelete.name || itemToDelete.id}</span>?
            </p>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300/90 leading-relaxed">
              ⚠️ This document will be permanently removed. Remaining document IDs will be retained as-is with no reassignment.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 7. Document Creation/Viewer Modal ─────────────────────────────────── */}
      <InvoiceDocumentModal
        key={`doc-modal-${docModalType}-${docModalMode}-${selectedDoc?.id || 'new'}-${docModalOpen ? '1' : '0'}`}
        isOpen={docModalOpen}
        onClose={() => {
          setDocModalOpen(false);
          setSelectedDoc(null);
        }}
        documentData={selectedDoc}
        type={
          (docModalType === 'quote' || docModalType === 'quotes' || docModalType === 'quotation') ? 'Quotation' :
          (docModalType === 'proforma' || docModalType === 'proforma_invoice') ? 'Proforma Invoice' : 'Tax Invoice'
        }
        mode={docModalMode}
        currentUser={currentUser}
        onSaveSuccess={loadAllFinancialData}
      />

    </div>
  );
}
