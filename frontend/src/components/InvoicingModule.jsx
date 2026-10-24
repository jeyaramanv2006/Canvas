import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  AlertCircle
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-[#1c1d27] border border-white/20 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
        <p className="font-black text-gray-300 pb-1 border-b border-white/10 uppercase tracking-wider">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 font-mono">
            <span className="flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="font-bold">{entry.name}:</span>
            </span>
            <span className="font-black text-white">₹{Number(entry.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[#14151c] border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 text-left font-black text-sm text-gray-200 hover:text-white transition-colors cursor-pointer"
        >
          {isOpen ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span>{title}</span>
        </button>

        {isOpen && (
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Frequency Selector */}
            <div className="relative">
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="appearance-none bg-black/40 hover:bg-black/60 border border-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="Monthly" className="bg-[#181922] text-white">Monthly</option>
                <option value="Weekly" className="bg-[#181922] text-white">Weekly</option>
                <option value="Daily" className="bg-[#181922] text-white">Daily</option>
                <option value="Quarterly" className="bg-[#181922] text-white">Quarterly</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Chart Type Selector */}
            <div className="relative">
              <select
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                className="appearance-none bg-black/40 hover:bg-black/60 border border-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="Line Chart" className="bg-[#181922] text-white">Line Chart</option>
                <option value="Bar Chart" className="bg-[#181922] text-white">Bar Chart</option>
                <option value="Scatter Plot" className="bg-[#181922] text-white">Scatter Plot</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Chart Body */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-white/5 space-y-3">
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

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  const loadAllFinancialData = async () => {
    setLoading(true);
    try {
      const uId = currentUser?.id;
      const role = currentUser?.role;
      const [statsData, quotesData, proformaData, invsData, paysData] = await Promise.all([
        mockApi.getCFOAnalytics().catch(() => null),
        mockApi.getQuotations(),
        mockApi.getProformaInvoices(),
        mockApi.getInvoices(),
        mockApi.getPayments()
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
    setDocModalType(type);
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

  // Filtered lists
  const filteredQuotes = quotations.filter(q => {
    const matchesSearch = !searchTerm ||
      q.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.district?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    return q.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const filteredProforma = proformaInvoices.filter(p => {
    const matchesSearch = !searchTerm ||
      p.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    return p.status?.toLowerCase() === statusFilter.toLowerCase();
  });

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
  });

  const filteredPayments = payments.filter(p => {
    return !searchTerm ||
      p.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate Proforma Summary metrics
  const proformaTotal = proformaInvoices.reduce((s, p) => s + (Number(p.grand_total) || 0), 0);
  const proformaPaid = proformaInvoices.filter(p => p.status === 'Paid').reduce((s, p) => s + (Number(p.grand_total) || 0), 0);
  const proformaOverdue = proformaInvoices.filter(p => p.status === 'Overdue').reduce((s, p) => s + (Number(p.grand_total) || 0), 0);
  const proformaPending = proformaTotal - proformaPaid;

  return (
    <div className="space-y-6">

      {/* ── 1. Top Navigation Bar (Refrens-Styled Financials Tabs) ───────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#14151c] border border-white/10 p-3 sm:p-4 rounded-3xl shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          {[
            { id: 'quotes', label: 'Quotation & Estimates', count: quotations.length, icon: FileText, color: 'from-blue-500 to-indigo-600' },
            { id: 'proforma', label: 'Proforma Invoices', count: proformaInvoices.length, icon: Layers, color: 'from-purple-500 to-pink-600' },
            { id: 'invoices', label: 'Invoices', count: invoices.length, icon: Receipt, color: 'from-amber-400 to-yellow-500' },
            { id: 'payments', label: 'Payment Receipts', count: payments.length, icon: CreditCard, color: 'from-emerald-400 to-teal-500' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setExpandedRows(new Set());
                  setExpandAll(false);
                  setStatusFilter('All');
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-400/20 font-black'
                    : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-black/30 text-black' : 'bg-white/10 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {activeTab === 'quotes' && (
            <button
              onClick={() => handleCreateDocument('quote')}
              className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-400/10 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Quotation</span>
            </button>
          )}
          {activeTab === 'proforma' && (
            <button
              onClick={() => handleCreateDocument('proforma')}
              className="bg-purple-500 hover:bg-purple-400 text-white font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Proforma Invoice</span>
            </button>
          )}
          {activeTab === 'invoices' && (
            <button
              onClick={() => handleCreateDocument('invoice')}
              className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-400/10 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Tax Invoice</span>
            </button>
          )}
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

      {/* ── 2b. PROFORMA INVOICE COLLAPSIBLE ANALYTICS (As in Refrens Screenshot) ─ */}
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
          <div className="bg-[#14151c] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <button
              onClick={() => setShowProformaSummary(!showProformaSummary)}
              className="w-full flex items-center justify-between p-4 text-left font-black text-sm text-gray-200 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {showProformaSummary ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span>Proforma Invoice Summary</span>
              </div>
              <span className="text-xs text-gray-400 font-normal">
                {proformaInvoices.length} Documents · {formatINR(proformaTotal)} Total Value
              </span>
            </button>

            {showProformaSummary && (
              <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-white/5">
                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[11px] text-gray-400 font-medium">Total Proforma Value</span>
                  <div className="text-lg font-black text-white mt-1">{formatINR(proformaTotal)}</div>
                  <span className="text-[10px] text-gray-500">{proformaInvoices.length} Issued</span>
                </div>
                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[11px] text-emerald-400 font-medium">Converted / Paid</span>
                  <div className="text-lg font-black text-emerald-400 mt-1">{formatINR(proformaPaid)}</div>
                  <span className="text-[10px] text-gray-500">{proformaInvoices.filter(p => p.status === 'Paid').length} Completed</span>
                </div>
                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[11px] text-rose-400 font-medium">Overdue Proforma</span>
                  <div className="text-lg font-black text-rose-400 mt-1">{formatINR(proformaOverdue)}</div>
                  <span className="text-[10px] text-gray-500">{proformaInvoices.filter(p => p.status === 'Overdue').length} Awaiting Advance</span>
                </div>
                <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                  <span className="text-[11px] text-amber-400 font-medium">Pending Conversion</span>
                  <div className="text-lg font-black text-amber-400 mt-1">{formatINR(proformaPending)}</div>
                  <span className="text-[10px] text-gray-500">Pipeline Active</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Search, Filters & Table Toolbar ───────────────────────────────── */}
      <div className="bg-[#14151c] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-300">
              Showing <span className="text-white font-black">1 to {
                activeTab === 'quotes' ? filteredQuotes.length :
                activeTab === 'proforma' ? filteredProforma.length :
                activeTab === 'invoices' ? filteredInvoices.length : filteredPayments.length
              }</span> of <span className="text-amber-400 font-black">{
                activeTab === 'quotes' ? quotations.length :
                activeTab === 'proforma' ? proformaInvoices.length :
                activeTab === 'invoices' ? invoices.length : payments.length
              }</span> {
                activeTab === 'quotes' ? 'Quotations' :
                activeTab === 'proforma' ? 'Proforma Invoices' :
                activeTab === 'invoices' ? 'Invoices' : 'Payment Receipts'
              }
            </span>
          </div>

          {/* Search bar & Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search institution or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 w-52 sm:w-64"
              />
            </div>

            <button
              onClick={handleToggleExpandAll}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                expandAll
                  ? 'bg-amber-400 text-black border-amber-400'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              {expandAll ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{expandAll ? 'Collapse All Items' : '+ Expand Line Items'}</span>
            </button>
          </div>
        </div>

        {/* ── 4. Refrens Standard Table ─────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 w-28">Date</th>
                <th className="py-3 px-3 w-40 min-w-[140px] whitespace-nowrap">
                  {activeTab === 'quotes' ? 'Quotation #' :
                   activeTab === 'proforma' ? 'Proforma #' :
                   activeTab === 'invoices' ? 'Invoice #' : 'Receipt #'}
                </th>
                <th className="py-3 px-4 min-w-[200px]">
                  {activeTab === 'payments' ? 'Billed To / School' : 'Quoted / Billed To'}
                </th>
                <th className="py-3 px-3 text-right">Sub Total</th>
                <th className="py-3 px-3 text-right">
                  {activeTab === 'payments' ? 'Amount Paid' : 'Amount in INR'}
                </th>
                {activeTab === 'invoices' && <th className="py-3 px-3 text-right">Balance Due</th>}
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
                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span>{q.district || 'Tamil Nadu'}</span>
                              {q.contact_person && <span>· {q.contact_person}</span>}
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
                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span>{p.district || 'Tamil Nadu'}</span>
                              {p.contact_person && <span>· {p.contact_person}</span>}
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
                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span>{inv.district || 'Tamil Nadu'}</span>
                              {inv.contact_person && <span>· {inv.contact_person}</span>}
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
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setPayModalOpen(false)}
        >
          <div
            className="bg-[#181922] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 my-auto relative z-10 transition-all"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Record Payment</h3>
                  <p className="text-xs text-gray-400 font-mono">Invoice: {selectedInvoiceForPay.id}</p>
                </div>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/30 border border-white/5 p-3 rounded-2xl space-y-1">
              <div className="text-xs text-gray-400 font-medium">Billed To</div>
              <div className="text-sm font-bold text-white">{selectedInvoiceForPay.school_name}</div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-gray-400">Total: {formatINR(selectedInvoiceForPay.grand_total)}</span>
                <span className="text-rose-400 font-bold">Outstanding: {formatINR(selectedInvoiceForPay.outstanding_balance)}</span>
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
                <label className="block text-xs font-bold text-gray-300 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  max={selectedInvoiceForPay.outstanding_balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full bg-[#121318] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="Bank Transfer (NEFT)">Bank Transfer / NEFT / RTGS</option>
                  <option value="UPI (GPay / PhonePe)">UPI (GPay / PhonePe)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR192830192 / CHQ-1029"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Payment receipt remarks..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
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
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-[#181922] border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto relative z-10 transition-all"
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

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300 leading-relaxed">
              ⚠️ This document will be permanently removed. Remaining document IDs will be retained as-is with no reassignment.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
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
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        documentData={selectedDoc}
        type={
          docModalType === 'quote' ? 'Quotation' :
          docModalType === 'proforma' ? 'Proforma Invoice' : 'Tax Invoice'
        }
        mode={docModalMode}
        currentUser={currentUser}
        onSaveSuccess={loadAllFinancialData}
      />

    </div>
  );
}
