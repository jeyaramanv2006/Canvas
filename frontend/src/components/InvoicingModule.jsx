import React, { useState, useEffect } from 'react';
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
  X,
  Eye,
  Send
} from 'lucide-react';

export default function InvoicingModule({ currentUser }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'quotes' | 'invoices' | 'payments'
  const [stats, setStats] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state for Invoices
  const [invoiceFilter, setInvoiceFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal controls
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalType, setDocModalType] = useState('quote'); // 'quote' | 'invoice'
  const [docModalMode, setDocModalMode] = useState('view'); // 'view' | 'create'
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Payment Recording Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Bank Transfer (NEFT)');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  useEffect(() => {
    loadAllFinancialData();
  }, [currentUser]);

  const loadAllFinancialData = async () => {
    setLoading(true);
    try {
      const uId = currentUser?.id;
      const role = currentUser?.role;
      const [statsData, quotesData, invsData, paysData] = await Promise.all([
        mockApi.getFinancialStats(uId, role, currentUser),
        mockApi.getQuotations(uId, role),
        mockApi.getInvoices(uId, role),
        mockApi.getPayments()
      ]);
      setStats(statsData || { totalInvoiced: 0, totalCollected: 0, totalPending: 0, overdueCount: 0, invoicesCount: 0 });
      setQuotations(quotesData || []);
      setInvoices(invsData || []);
      setPayments(paysData || []);
    } catch (e) {
      console.error("Failed loading invoicing suite data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = () => {
    setSelectedDoc(null);
    setDocModalType('quote');
    setDocModalMode('create');
    setDocModalOpen(true);
  };

  const handleCreateInvoice = () => {
    setSelectedDoc(null);
    setDocModalType('invoice');
    setDocModalMode('create');
    setDocModalOpen(true);
  };

  const handleViewDoc = (doc, type) => {
    setSelectedDoc(doc);
    setDocModalType(type);
    setDocModalMode('view');
    setDocModalOpen(true);
  };

  const handleConvertQuoteToInvoice = (quote) => {
    setSelectedDoc(quote);
    setDocModalType('invoice');
    setDocModalMode('create');
    setDocModalOpen(true);
  };

  const handleOpenPayModal = (inv) => {
    setSelectedInvoiceForPay(inv);
    setPayAmount(inv.pending_balance || '');
    setPayMode('Bank Transfer (NEFT)');
    setPayRef('');
    setPayNotes('');
    setPayModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay || !payAmount || Number(payAmount) <= 0) return;

    setPaySubmitting(true);
    try {
      await mockApi.recordPayment(selectedInvoiceForPay.id, {
        amount: Number(payAmount),
        mode: payMode,
        reference_id: payRef,
        notes: payNotes,
        date: new Date().toISOString().split('T')[0]
      });
      setPayModalOpen(false);
      await loadAllFinancialData();
    } catch (err) {
      alert(err.message || "Failed to record payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = searchTerm === '' ||
      (inv.school_name && inv.school_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.id && inv.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.district && inv.district.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (invoiceFilter === 'All') return true;
    if (invoiceFilter === 'Overdue') {
      return inv.status !== 'Paid' && new Date(inv.due_date) < new Date();
    }
    return inv.status?.toLowerCase() === invoiceFilter.toLowerCase();
  });

  const filteredQuotes = quotations.filter(q => {
    return searchTerm === '' ||
      (q.school_name && q.school_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.id && q.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.district && q.district.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">

      {/* Sub Navigation Bar & Quick Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-br from-[#181922] to-[#121318] border border-white/10 p-3.5 sm:p-4 rounded-3xl shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          {[
            { id: 'overview', label: 'Financial Overview', icon: TrendingUp },
            { id: 'quotes', label: `Quotations (${quotations.length})`, icon: FileText },
            { id: 'invoices', label: `Invoices (${invoices.length})`, icon: Receipt },
            { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-400/20 font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Create Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end xl:self-auto">
          <button
            onClick={handleCreateQuote}
            className="px-3.5 py-2.5 bg-gray-900/90 hover:bg-gray-800 text-murugan-accent border border-murugan-accent/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
          <button
            onClick={handleCreateInvoice}
            className="px-4 py-2.5 bg-gradient-to-r from-murugan-accent to-emerald-400 hover:opacity-95 text-black rounded-xl text-xs font-extrabold shadow-md shadow-murugan-accent/20 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Tax Invoice</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-murugan-card border border-murugan-border rounded-2xl">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-murugan-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-400 font-medium">Loading commercial accounts & documents...</p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: FINANCIAL OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Commercial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 shadow-xl transition">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Invoiced</p>
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <Receipt className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white font-mono mt-3 tracking-tight whitespace-nowrap">
                    ₹{(stats?.totalInvoiced || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">{stats?.invoicesCount || 0} Total Issued Invoices</p>
                </div>

                <div className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 shadow-xl transition">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payments Collected</p>
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-3 tracking-tight whitespace-nowrap">
                    ₹{(stats?.totalCollected || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">Realized Bank & Cash Inflows</p>
                </div>

                <div className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 shadow-xl transition">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding Balance</p>
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-3 tracking-tight whitespace-nowrap">
                    ₹{(stats?.totalPending || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">Pending School Receivables</p>
                </div>

                <div className="bg-gradient-to-br from-[#1c1d27] via-[#161720] to-[#121319] border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-rose-500/40 shadow-xl transition">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overdue Invoices</p>
                    <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-3 tracking-tight whitespace-nowrap">
                    {stats?.overdueCount || 0}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">Past Due Date Accounts</p>
                </div>
              </div>

              {/* Invoicing Pipeline & Recent Collections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Invoices Card */}
                <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-murugan-accent" />
                      <span>Recent Invoices</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('invoices')}
                      className="text-xs text-murugan-accent hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {invoices.slice(0, 4).map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => handleViewDoc(inv, 'invoice')}
                        className="p-3.5 bg-black/40 hover:bg-gray-800/80 border border-white/5 hover:border-white/20 rounded-xl flex items-center justify-between cursor-pointer transition gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">{inv.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                inv.status === 'Partially Paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-200 font-semibold mt-1 truncate">{inv.school_name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{inv.district} • Due: {inv.due_date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-white font-mono whitespace-nowrap">₹{inv.grand_total.toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-amber-400 font-mono font-medium mt-0.5 whitespace-nowrap">
                            Bal: ₹{inv.pending_balance.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Collections Card */}
                <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Payment Collections Log</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="text-xs text-murugan-accent hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Full Audit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {payments.slice(0, 4).map(pay => (
                      <div
                        key={pay.id}
                        className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{pay.id}</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                              {pay.mode}
                            </span>
                          </div>
                          <p className="text-gray-300 font-medium">{pay.school_name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{pay.date} • Ref: {pay.reference_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-black text-emerald-400 text-sm">+₹{pay.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Invoice: {pay.invoice_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: QUOTATIONS LIST */}
          {activeTab === 'quotes' && (
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-murugan-accent" />
                    <span>School Quotations Repository</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Commercial proposals generated for prospect educational institutions</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search school / quote #..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-murugan-accent w-48 sm:w-64"
                    />
                  </div>
                  <button
                    onClick={handleCreateQuote}
                    className="px-3.5 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-murugan-accent/20 transition flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Quote</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs text-gray-300 min-w-[760px]">
                  <thead className="bg-black/40 text-gray-400 font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Quote #</th>
                      <th className="py-3 px-4">School / Institution</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4">Issued Date</th>
                      <th className="py-3 px-4">Valid Until</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Quote Value</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/20">
                    {filteredQuotes.map(q => (
                      <tr key={q.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{q.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-white">{q.school_name}</p>
                          <p className="text-[11px] text-gray-400">{q.contact_person} • {q.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-gray-300">{q.district}</td>
                        <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">{q.date}</td>
                        <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">{q.valid_until}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${q.status === 'Converted to Invoice' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              q.status === 'Sent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-gray-700/50 text-gray-300 border border-gray-600'
                            }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-white text-sm">
                          ₹{q.grand_total.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleViewDoc(q, 'quote')}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            title="View / Print Quotation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {q.status !== 'Converted to Invoice' && (
                            <button
                              onClick={() => handleConvertQuoteToInvoice(q)}
                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                              title="Convert to Tax Invoice"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Convert</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICES LIST */}
          {activeTab === 'invoices' && (
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-murugan-accent" />
                    <span>Tax Invoices Registry & Ledger</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Official billing records, receivable tracking, and payment collection status</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search school / invoice #..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-murugan-accent w-44 sm:w-56"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                    {['All', 'Paid', 'Partially Paid', 'Unpaid', 'Overdue'].map(f => (
                      <button
                        key={f}
                        onClick={() => setInvoiceFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${invoiceFilter === f
                            ? 'bg-murugan-accent text-black font-extrabold'
                            : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCreateInvoice}
                    className="px-3.5 py-2 bg-gradient-to-r from-murugan-accent to-emerald-400 hover:opacity-95 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-murugan-accent/20 transition flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Invoice</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs text-gray-300 min-w-[850px]">
                  <thead className="bg-black/40 text-gray-400 font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">School / Client</th>
                      <th className="py-3 px-4">Canvasser</th>
                      <th className="py-3 px-4">Date / Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Invoice Total</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/20">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{inv.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-white">{inv.school_name}</p>
                          <p className="text-[11px] text-gray-400">{inv.district} • {inv.contact_person}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[11px] font-semibold">
                            {inv.canvasser_name || 'Murugan'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                          <div>{inv.date}</div>
                          <div className="text-[10px] text-gray-500">Due: {inv.due_date}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              inv.status === 'Partially Paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-white text-sm">
                          ₹{inv.grand_total.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-amber-400 text-sm">
                          ₹{inv.pending_balance.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleViewDoc(inv, 'invoice')}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                            title="View / Print Tax Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {inv.pending_balance > 0 && (
                            <button
                              onClick={() => handleOpenPayModal(inv)}
                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                              title="Record Collection"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Collect</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENTS AUDIT TRAIL */}
          {activeTab === 'payments' && (
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Realized Payments Collection Audit Trail</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Historical verification of client remittances, bank transfers, cheques & receipts</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs text-gray-300 min-w-[700px]">
                  <thead className="bg-black/40 text-gray-400 font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">School Institution</th>
                      <th className="py-3 px-4">Payment Channel</th>
                      <th className="py-3 px-4">Reference / UTR</th>
                      <th className="py-3 px-4 text-right">Amount Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/20">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">{p.id}</td>
                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">{p.date}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{p.invoice_id}</td>
                        <td className="py-3 px-4 font-semibold text-white">{p.school_name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[11px] font-medium border border-gray-700">
                            {p.mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">{p.reference_id}</td>
                        <td className="py-3 px-4 text-right font-black font-mono text-emerald-400 whitespace-nowrap">
                          +₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}

      {/* Record Payment Modal */}
      {payModalOpen && selectedInvoiceForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#15161f] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Record Payment Collection</span>
              </h3>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div className="p-3.5 bg-black/50 rounded-xl border border-gray-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="text-white font-bold">{selectedInvoiceForPay.school_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Invoice ID:</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedInvoiceForPay.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Invoice Amount:</span>
                  <span className="text-white font-mono font-bold">₹{selectedInvoiceForPay.grand_total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-gray-700/50 pt-1.5">
                  <span className="text-amber-400 font-bold">Outstanding Balance:</span>
                  <span className="text-amber-400 font-mono font-black text-sm">₹{selectedInvoiceForPay.pending_balance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Payment Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  max={selectedInvoiceForPay.pending_balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-murugan-accent font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-murugan-accent"
                  >
                    <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="RTGS">RTGS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Transaction / Cheque Ref</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. UTR-983742"
                    className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-murugan-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional collection notes"
                  className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-murugan-border">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2 bg-murugan-accent hover:bg-emerald-400 text-black rounded-xl text-xs font-bold shadow-lg"
                >
                  {paySubmitting ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice / Quotation Modal */}
      <InvoiceDocumentModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        type={docModalType}
        mode={docModalMode}
        initialData={selectedDoc}
        currentUser={currentUser}
        onSaveSuccess={loadAllFinancialData}
      />

    </div>
  );
}
