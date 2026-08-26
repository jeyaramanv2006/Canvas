import React, { useState, useEffect } from 'react';
import { mockApi } from '../mockApi';
import InvoiceDocumentModal from './InvoiceDocumentModal';
import { 
  FileText, 
  Receipt, 
  CreditCard, 
  Package, 
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
  Edit2,
  Trash2,
  Plus,
  X,
  Tag,
  Percent
} from 'lucide-react';

export default function InvoicingModule({ currentUser }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'quotes' | 'invoices' | 'payments' | 'products'
  const [stats, setStats] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
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

  // Product Catalog Editor state
  const [editingProducts, setEditingProducts] = useState([]);
  const [productSaving, setProductSaving] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    unit_price: '',
    unit: 'pcs',
    hsn: '',
    gst_rate: 18,
    description: ''
  });
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null);

  useEffect(() => {
    loadAllFinancialData();
  }, [currentUser]);

  const loadAllFinancialData = async () => {
    setLoading(true);
    try {
      const uId = currentUser?.id;
      const role = currentUser?.role;
      const [statsData, quotesData, invsData, paysData, prodsData] = await Promise.all([
        mockApi.getFinancialStats(uId, role, currentUser),
        mockApi.getQuotations(uId, role),
        mockApi.getInvoices(uId, role),
        mockApi.getPayments(),
        mockApi.getProducts()
      ]);
      setStats(statsData || { totalInvoiced: 0, totalCollected: 0, totalPending: 0, overdueCount: 0, invoicesCount: 0 });
      setQuotations(quotesData || []);
      setInvoices(invsData || []);
      setPayments(paysData || []);
      setProducts(prodsData || []);
      setEditingProducts(JSON.parse(JSON.stringify(prodsData || [])));
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

  const handleOpenAddProduct = () => {
    setProductForm({
      name: '',
      unit_price: '',
      unit: 'pcs',
      hsn: '',
      gst_rate: 18,
      description: ''
    });
    setProductModalMode('add');
    setSelectedProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setSelectedProduct(prod);
    setProductForm({
      name: prod.name || '',
      unit_price: prod.unit_price || '',
      unit: prod.unit || 'pcs',
      hsn: prod.hsn || '',
      gst_rate: prod.gst_rate || 18,
      description: prod.description || ''
    });
    setProductModalMode('edit');
    setProductModalOpen(true);
  };

  const handleSaveProductModalSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert("Product name is required");
      return;
    }
    setProductSaving(true);
    try {
      if (productModalMode === 'add') {
        await mockApi.addProduct(productForm);
      } else if (selectedProduct) {
        await mockApi.updateProduct(selectedProduct.id, productForm);
      }
      setProductModalOpen(false);
      await loadAllFinancialData();
    } catch (err) {
      alert(err.message || "Failed to save product");
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    setProductSaving(true);
    try {
      await mockApi.deleteProduct(prodId);
      setDeleteProductConfirm(null);
      await loadAllFinancialData();
    } catch (err) {
      alert(err.message || "Failed to delete product");
    } finally {
      setProductSaving(false);
    }
  };

  const handleProductRateChange = (index, value) => {
    const updated = [...editingProducts];
    updated[index].unit_price = Number(value);
    setEditingProducts(updated);
  };

  const handleSaveProducts = async () => {
    setProductSaving(true);
    try {
      await mockApi.saveProducts(editingProducts);
      setProducts(editingProducts);
      alert("Product catalog updated successfully!");
    } catch (e) {
      alert("Failed to save product catalog");
    } finally {
      setProductSaving(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = searchTerm === '' || 
      inv.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.district && inv.district.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (invoiceFilter === 'All') return true;
    if (invoiceFilter === 'Overdue') {
      return inv.status !== 'Paid' && new Date(inv.due_date) < new Date();
    }
    return inv.status.toLowerCase() === invoiceFilter.toLowerCase();
  });

  const filteredQuotes = quotations.filter(q => {
    return searchTerm === '' || 
      q.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
            { id: 'products', label: 'Product Master', icon: Package }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isActive
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
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
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
                        className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400 text-xs">{pay.id}</span>
                            <span className="text-[10px] text-gray-300 bg-gray-800/80 px-2 py-0.5 rounded-md font-medium">{pay.mode}</span>
                          </div>
                          <p className="text-xs text-gray-200 font-semibold mt-1 truncate">{pay.school_name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate">Ref: {pay.reference_id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-emerald-400 font-mono whitespace-nowrap">+₹{pay.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{pay.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: QUOTATIONS */}
          {activeTab === 'quotes' && (
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-4 sm:p-6 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-murugan-accent" />
                    <span>Commercial Sales Quotations</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Generate, view, and convert price quotes to tax invoices</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search quote or school..."
                      className="pl-8 pr-3 py-1.5 bg-black/40 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-murugan-accent w-48 sm:w-60"
                    />
                  </div>
                  <button
                    onClick={handleCreateQuote}
                    className="px-3.5 py-1.5 bg-murugan-accent hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition shrink-0"
                  >
                    + Create Quote
                  </button>
                </div>
              </div>

              {filteredQuotes.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No quotations match the search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-murugan-border">
                  <table className="w-full text-left text-xs text-gray-300 min-w-[760px]">
                    <thead className="bg-gray-900/90 text-gray-400 font-semibold border-b border-gray-800">
                      <tr>
                        <th className="py-3 px-4">Quote #</th>
                        <th className="py-3 px-4">School / Customer</th>
                        <th className="py-3 px-4">Canvasser</th>
                        <th className="py-3 px-4">Quote Date</th>
                        <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 bg-black/20">
                      {filteredQuotes.map(q => (
                        <tr key={q.id} className="hover:bg-gray-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-murugan-accent">{q.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-white">{q.school_name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{q.district} • {q.contact_person}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-200">{q.canvasser_name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-300">{q.date}</td>
                          <td className="py-3 px-4 text-right font-black font-mono text-white whitespace-nowrap">
                            ₹{q.grand_total.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-sm ${
                              q.status === 'Converted to Invoice' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                              q.status === 'Sent' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                              'bg-gray-500/15 text-gray-300 border border-gray-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                q.status === 'Converted to Invoice' ? 'bg-emerald-400' :
                                q.status === 'Sent' ? 'bg-blue-400' :
                                'bg-gray-400'
                              }`} />
                              {q.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => handleViewDoc(q, 'quote')}
                              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition"
                            >
                              Print / View
                            </button>
                            {q.status !== 'Converted to Invoice' && (
                              <button
                                onClick={() => handleConvertQuoteToInvoice(q)}
                                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition"
                              >
                                Convert → Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TAX INVOICES */}
          {activeTab === 'invoices' && (
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-4 sm:p-6 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Tax Invoices & Receivable Dues</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Track billing, payment fulfillment, and canvasser commissions</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search invoice # or school..."
                      className="pl-8 pr-3 py-1.5 bg-black/40 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-murugan-accent w-48 sm:w-56"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-gray-800 overflow-x-auto">
                    {['All', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue'].map(f => (
                      <button
                        key={f}
                        onClick={() => setInvoiceFilter(f)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                          invoiceFilter === f
                            ? 'bg-murugan-accent text-black font-bold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No invoices found matching current filter or search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-murugan-border">
                  <table className="w-full text-left text-xs text-gray-300 min-w-[880px]">
                    <thead className="bg-gray-900/90 text-gray-400 font-semibold border-b border-gray-800">
                      <tr>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">School / Customer</th>
                        <th className="py-3 px-4">Canvasser</th>
                        <th className="py-3 px-4">Issue / Due Date</th>
                        <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                        <th className="py-3 px-4 text-right">Paid (₹)</th>
                        <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 bg-black/20">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-gray-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{inv.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-white">{inv.school_name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{inv.district} • {inv.contact_person}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-200">{inv.canvasser_name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-gray-300">
                            <p>{inv.date}</p>
                            <p className="text-gray-500">Due: {inv.due_date}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-black font-mono text-white whitespace-nowrap">
                            ₹{inv.grand_total.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-mono text-emerald-400 whitespace-nowrap">
                            ₹{inv.paid_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-mono text-amber-400 whitespace-nowrap">
                            ₹{inv.pending_balance.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-sm ${
                              inv.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                              inv.status === 'Partially Paid' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                inv.status === 'Paid' ? 'bg-emerald-400' :
                                inv.status === 'Partially Paid' ? 'bg-amber-400 animate-pulse' :
                                'bg-rose-400'
                              }`} />
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => handleViewDoc(inv, 'invoice')}
                              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition"
                            >
                              Print / View
                            </button>
                            {inv.pending_balance > 0 && (
                              <button
                                onClick={() => handleOpenPayModal(inv)}
                                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition"
                              >
                                + Record Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENT TRACKER */}
          {activeTab === 'payments' && (
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-4 sm:p-6 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Payment Collections Audit Log</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Complete record of receipts, bank transfers, and UPI settlements</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-murugan-border">
                <table className="w-full text-left text-xs text-gray-300 min-w-[750px]">
                  <thead className="bg-gray-900/90 text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">School / Customer</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Transaction Ref</th>
                      <th className="py-3 px-4 text-right">Amount Collected (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-black/20">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{p.id}</td>
                        <td className="py-3 px-4 font-mono font-medium text-gray-300">{p.invoice_id}</td>
                        <td className="py-3 px-4 font-bold text-white">{p.school_name}</td>
                        <td className="py-3 px-4 font-mono text-gray-300">{p.date}</td>
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

          {/* TAB 5: PRODUCT CATALOG MANAGER */}
          {activeTab === 'products' && (
            <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] border border-white/10 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-murugan-accent" />
                    <span>Product Catalog & Base Pricing Master</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Manage products, add new SKUs, alter standard rates, update HSN tax codes or delete obsolete items</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2.5 bg-gradient-to-r from-murugan-accent to-yellow-400 hover:opacity-95 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-murugan-accent/20 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                  <button
                    onClick={handleSaveProducts}
                    disabled={productSaving}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl border border-white/10 transition shrink-0"
                  >
                    {productSaving ? 'Saving...' : 'Save Table Rates'}
                  </button>
                </div>
              </div>

              {editingProducts.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs bg-black/20 rounded-2xl border border-white/5 space-y-3">
                  <Package className="w-10 h-10 mx-auto text-gray-600" />
                  <p className="text-sm font-semibold text-gray-300">No products found in catalog</p>
                  <button
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2 bg-murugan-accent text-black text-xs font-bold rounded-xl"
                  >
                    Add First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs text-gray-300 min-w-[760px]">
                    <thead className="bg-black/40 text-gray-400 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Product SKU / Name</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">HSN Code</th>
                        <th className="py-3 px-4">Unit</th>
                        <th className="py-3 px-4">GST Rate</th>
                        <th className="py-3 px-4 text-right">Standard Unit Price (₹)</th>
                        <th className="py-3 px-4 text-right">Manage Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-black/20">
                      {editingProducts.map((prd, idx) => (
                        <tr key={prd.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-murugan-accent" />
                              <span className="font-extrabold text-white text-xs">{prd.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-400 max-w-xs truncate">{prd.description || '-'}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-gray-300">
                            <span className="bg-black/50 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                              {prd.hsn || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-300 capitalize">{prd.unit || 'pcs'}</td>
                          <td className="py-3.5 px-4 text-emerald-400 font-mono font-bold">{prd.gst_rate || 18}%</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1 bg-black/50 border border-white/15 rounded-xl px-2.5 py-1 focus-within:border-murugan-accent transition">
                              <span className="text-gray-400 font-mono text-xs">₹</span>
                              <input
                                type="number"
                                value={prd.unit_price}
                                onChange={(e) => handleProductRateChange(idx, e.target.value)}
                                className="w-24 bg-transparent text-right text-white font-bold font-mono text-xs focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(prd)}
                              className="p-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                              title="Edit product specifications"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Alter</span>
                            </button>
                            <button
                              onClick={() => setDeleteProductConfirm(prd)}
                              className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </>
      )}

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#15161f] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-murugan-accent" />
                <span>{productModalMode === 'add' ? 'Add New Catalog Product' : 'Alter Product Details'}</span>
              </h3>
              <button 
                onClick={() => setProductModalOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Premium School Socks"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Standard Rate (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={productForm.unit_price}
                      onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-murugan-accent font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Billing Unit *</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-murugan-accent"
                  >
                    <option value="pairs">pairs</option>
                    <option value="pcs">pcs (pieces)</option>
                    <option value="sets">sets</option>
                    <option value="box">box</option>
                    <option value="doz">doz (dozen)</option>
                    <option value="meters">meters</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={productForm.hsn}
                    onChange={(e) => setProductForm({ ...productForm, hsn: e.target.value })}
                    placeholder="e.g. 6115"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-murugan-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={productForm.gst_rate}
                    onChange={(e) => setProductForm({ ...productForm, gst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-murugan-accent"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard)</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="e.g. 100% combed cotton, customized jacquard logo"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="px-5 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold rounded-xl text-xs shadow-lg shadow-murugan-accent/20 transition"
                >
                  {productSaving ? 'Saving...' : productModalMode === 'add' ? 'Add to Catalog' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#15161f] border border-rose-500/30 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Delete Catalog Product</h3>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 bg-black/40 p-3 rounded-xl border border-white/5">
              Are you sure you want to delete <span className="font-extrabold text-white">{deleteProductConfirm.name}</span> from the master product catalog?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={productSaving}
                onClick={() => handleDeleteProduct(deleteProductConfirm.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-rose-600/30 transition"
              >
                {productSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
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
