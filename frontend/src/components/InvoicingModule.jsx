import React, { useState, useEffect } from 'react';
import { mockApi } from '../mockApi';
import InvoiceDocumentModal from './InvoiceDocumentModal';

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

  useEffect(() => {
    loadAllFinancialData();
  }, [currentUser]);

  const loadAllFinancialData = async () => {
    setLoading(true);
    try {
      const uId = currentUser?.id;
      const role = currentUser?.role;

      const [fStats, qList, iList, pList, prdList] = await Promise.all([
        mockApi.getFinancialStats(uId, role),
        mockApi.getQuotations(uId, role),
        mockApi.getInvoices(uId, role),
        mockApi.getPayments(),
        mockApi.getProducts()
      ]);

      setStats(fStats);
      setQuotations(qList);
      setInvoices(iList);
      setPayments(pList);
      setProducts(prdList);
      setEditingProducts(prdList);
    } catch (e) {
      console.error("Failed loading financial data", e);
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
      loadAllFinancialData();
    } catch (err) {
      alert(err.message || "Failed to record payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleProductRateChange = (idx, newRate) => {
    const updated = [...editingProducts];
    updated[idx].unit_price = Number(newRate);
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
    if (invoiceFilter === 'All') return true;
    if (invoiceFilter === 'Overdue') {
      return inv.status !== 'Paid' && new Date(inv.due_date) < new Date();
    }
    return inv.status.toLowerCase() === invoiceFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      
      {/* Sub Navigation Bar & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-murugan-card border border-murugan-border p-4 rounded-2xl">
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'overview', label: '📊 Financial Overview' },
            { id: 'quotes', label: `📜 Quotations (${quotations.length})` },
            { id: 'invoices', label: `🧾 Invoices (${invoices.length})` },
            { id: 'payments', label: `💳 Payment Tracking (${payments.length})` },
            { id: 'products', label: '📦 Product Catalog' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-murugan-accent text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateQuote}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-murugan-accent border border-murugan-accent/30 rounded-xl text-xs font-bold transition flex items-center space-x-1"
          >
            <span>+ New Quotation</span>
          </button>
          <button
            onClick={handleCreateInvoice}
            className="px-3.5 py-2 bg-murugan-accent hover:bg-emerald-400 text-black rounded-xl text-xs font-extrabold shadow-lg transition flex items-center space-x-1"
          >
            <span>+ New Tax Invoice</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading financial dashboard...</div>
      ) : (
        <>
          {/* TAB 1: FINANCIAL OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400 text-5xl">₹</div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Invoiced</p>
                  <p className="text-2xl font-black text-white mt-2">
                    ₹{(stats?.totalInvoiced || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{stats?.invoicesCount || 0} Total Issued Invoices</p>
                </div>

                <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400 text-5xl">✓</div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Payments Collected</p>
                  <p className="text-2xl font-black text-emerald-400 mt-2">
                    ₹{(stats?.totalCollected || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Realized Bank & Cash Inflows</p>
                </div>

                <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-400 text-5xl">⏳</div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Outstanding Balance</p>
                  <p className="text-2xl font-black text-amber-400 mt-2">
                    ₹{(stats?.totalPending || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Pending School Receivable Dues</p>
                </div>

                <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-400 text-5xl">⚠️</div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Overdue Invoices</p>
                  <p className="text-2xl font-black text-rose-400 mt-2">
                    {stats?.overdueCount || 0}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Past Due Date Payments</p>
                </div>
              </div>

              {/* Invoicing Pipeline & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recent Invoices */}
                <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <span>🧾 Recent Invoices</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('invoices')}
                      className="text-xs text-murugan-accent hover:underline font-semibold"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {invoices.slice(0, 4).map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => handleViewDoc(inv, 'invoice')}
                        className="p-3 bg-murugan-dark/50 hover:bg-gray-800/80 border border-murugan-border rounded-xl flex items-center justify-between cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs">{inv.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              inv.status === 'Partially Paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 font-semibold mt-1">{inv.school_name}</p>
                          <p className="text-[11px] text-gray-500">{inv.district} • Due: {inv.due_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">₹{inv.grand_total.toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-amber-400">Bal: ₹{inv.pending_balance.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Payments Received */}
                <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <span>💳 Payment Collections Audit</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="text-xs text-murugan-accent hover:underline font-semibold"
                    >
                      View Log →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {payments.slice(0, 4).map(pay => (
                      <div
                        key={pay.id}
                        className="p-3 bg-murugan-dark/50 border border-murugan-border rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-emerald-400 text-xs">{pay.id}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{pay.mode}</span>
                          </div>
                          <p className="text-xs text-gray-300 font-semibold mt-1">{pay.school_name}</p>
                          <p className="text-[11px] text-gray-500">Ref: {pay.reference_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">+₹{pay.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-gray-500">{pay.date}</p>
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
            <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sales Quotations</h3>
                  <p className="text-xs text-gray-400">Generate and convert formal quotes to tax invoices</p>
                </div>
                <button
                  onClick={handleCreateQuote}
                  className="px-3.5 py-1.5 bg-murugan-accent hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition"
                >
                  + Create Quotation
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-murugan-border">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">Quote #</th>
                      <th className="p-3">School / Customer</th>
                      <th className="p-3">Canvasser</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-900/40">
                    {quotations.map(q => (
                      <tr key={q.id} className="hover:bg-gray-800/50">
                        <td className="p-3 font-bold text-murugan-accent">{q.id}</td>
                        <td className="p-3">
                          <p className="font-bold text-white">{q.school_name}</p>
                          <p className="text-[11px] text-gray-400">{q.district} • {q.contact_person}</p>
                        </td>
                        <td className="p-3">{q.canvasser_name}</td>
                        <td className="p-3">{q.date}</td>
                        <td className="p-3 text-right font-bold text-white">₹{q.grand_total.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            q.status === 'Converted to Invoice' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            q.status === 'Sent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleViewDoc(q, 'quote')}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition"
                          >
                            Print/View
                          </button>
                          {q.status !== 'Converted to Invoice' && (
                            <button
                              onClick={() => handleConvertQuoteToInvoice(q)}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition"
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
            </div>
          )}

          {/* TAB 3: TAX INVOICES */}
          {activeTab === 'invoices' && (
            <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tax Invoices & Dues</h3>
                  <p className="text-xs text-gray-400">Track invoice billing and payment fulfillment status</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 font-medium">Filter:</span>
                  {['All', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue'].map(f => (
                    <button
                      key={f}
                      onClick={() => setInvoiceFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        invoiceFilter === f
                          ? 'bg-murugan-accent text-black font-bold'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-murugan-border">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">School / Customer</th>
                      <th className="p-3">Issue Date</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 text-right">Balance Due</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-900/40">
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-800/50">
                        <td className="p-3 font-bold text-emerald-400">{inv.id}</td>
                        <td className="p-3">
                          <p className="font-bold text-white">{inv.school_name}</p>
                          <p className="text-[11px] text-gray-400">{inv.district} • {inv.contact_person}</p>
                        </td>
                        <td className="p-3">{inv.date}</td>
                        <td className="p-3">{inv.due_date}</td>
                        <td className="p-3 text-right font-bold text-white">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-semibold text-emerald-400">₹{inv.paid_amount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-bold text-amber-400">₹{inv.pending_balance.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            inv.status === 'Partially Paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleViewDoc(inv, 'invoice')}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition"
                          >
                            Print/View
                          </button>
                          {inv.pending_balance > 0 && (
                            <button
                              onClick={() => handleOpenPayModal(inv)}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition"
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
            </div>
          )}

          {/* TAB 4: PAYMENT TRACKER */}
          {activeTab === 'payments' && (
            <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payment Transaction Audit Log</h3>
                  <p className="text-xs text-gray-400">Complete record of collections, UPI references, and bank transfers</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-murugan-border">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">Receipt #</th>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">School / Customer</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Reference ID</th>
                      <th className="p-3 text-right">Amount Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-900/40">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-800/50">
                        <td className="p-3 font-bold text-emerald-400">{p.id}</td>
                        <td className="p-3 font-semibold text-gray-300">{p.invoice_id}</td>
                        <td className="p-3 font-bold text-white">{p.school_name}</td>
                        <td className="p-3">{p.date}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-gray-800 rounded text-[11px]">{p.mode}</span></td>
                        <td className="p-3 text-gray-400 font-mono text-[11px]">{p.reference_id}</td>
                        <td className="p-3 text-right font-black text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PRODUCT CATALOG MANAGER */}
          {activeTab === 'products' && (
            <div className="bg-murugan-card border border-murugan-border p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Product Master & Pricing</h3>
                  <p className="text-xs text-gray-400">Configure base selling prices and HSN codes for automatic quotation generation</p>
                </div>
                <button
                  onClick={handleSaveProducts}
                  disabled={productSaving}
                  className="px-4 py-2 bg-murugan-accent hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition"
                >
                  {productSaving ? 'Saving...' : 'Save Catalog Changes'}
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-murugan-border">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-900 text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">HSN Code</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3 text-right">Standard Rate (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-900/40">
                    {editingProducts.map((prd, idx) => (
                      <tr key={prd.id} className="hover:bg-gray-800/50">
                        <td className="p-3 font-bold text-white">{prd.name}</td>
                        <td className="p-3 text-gray-400">{prd.description}</td>
                        <td className="p-3 font-mono text-[11px]">{prd.hsn}</td>
                        <td className="p-3">{prd.unit}</td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={prd.unit_price}
                            onChange={(e) => handleProductRateChange(idx, e.target.value)}
                            className="w-24 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-right text-white font-bold focus:outline-none focus:border-murugan-accent"
                          />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-murugan-card border border-murugan-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-murugan-border pb-3">
              <h3 className="text-base font-bold text-white">Record Payment Collection</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 space-y-1 text-xs">
                <p className="text-gray-400">Customer: <span className="text-white font-bold">{selectedInvoiceForPay.school_name}</span></p>
                <p className="text-gray-400">Invoice ID: <span className="text-emerald-400 font-bold">{selectedInvoiceForPay.id}</span></p>
                <p className="text-gray-400">Total Bill: <span className="text-white font-bold">₹{selectedInvoiceForPay.grand_total.toLocaleString('en-IN')}</span></p>
                <p className="text-amber-400 font-bold">Current Pending Balance: ₹{selectedInvoiceForPay.pending_balance.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  max={selectedInvoiceForPay.pending_balance}
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-murugan-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Payment Method</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                >
                  <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT / RTGS)</option>
                  <option value="UPI (GPay / PhonePe)">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UTR / Transaction Hash"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional remarks"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-murugan-accent"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-murugan-border">
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
                  {paySubmitting ? 'Recording...' : 'Confirm Payment'}
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
