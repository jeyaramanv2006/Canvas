import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ArrowLeft, Download, Search, CheckCircle2, 
  AlertTriangle, FileText, Receipt, Building2, Layers, DollarSign,
  TrendingUp, Calendar, CreditCard, Tag, ExternalLink, Calculator
} from 'lucide-react';
import { DRILLDOWN_HIERARCHY, CFO_REPORTS_DATA } from '../data/cfoDrilldownData';
import { cn } from '../lib/utils';

export default function FinancialDrilldownModal({
  isOpen,
  onClose,
  initialMetric = 'sales_trend',
  initialMonth = 'Jun',
  initialBucket = null,
  initialKPI = null
}) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset drill-down stack whenever modal opens or metric changes
  useEffect(() => {
    if (isOpen) {
      const metricConfig = DRILLDOWN_HIERARCHY[initialMetric] || DRILLDOWN_HIERARCHY.sales_trend;
      let rootLabel = `${metricConfig.title} (${initialMonth} 2026)`;
      if (initialKPI) rootLabel = `${initialKPI.kpi} — Variance Audit`;
      if (initialBucket) rootLabel = `Receivables: ${initialBucket} Bucket`;

      setBreadcrumbs([{ label: rootLabel, level: 0 }]);
      setCurrentLevel(0);
      setSelectedCategory(null);
      setSelectedCustomer(null);
      setSelectedProduct(null);
      setSelectedInvoice(null);
      setSearchTerm('');
    }
  }, [isOpen, initialMetric, initialMonth, initialBucket, initialKPI]);

  if (!isOpen) return null;

  const metricConfig = DRILLDOWN_HIERARCHY[initialMetric] || DRILLDOWN_HIERARCHY.sales_trend;

  const navigateToLevel = (levelIndex) => {
    setCurrentLevel(levelIndex);
    setBreadcrumbs(prev => prev.slice(0, levelIndex + 1));
    if (levelIndex === 0) {
      setSelectedCategory(null);
      setSelectedCustomer(null);
      setSelectedProduct(null);
      setSelectedInvoice(null);
    } else if (levelIndex === 1) {
      setSelectedCustomer(null);
      setSelectedProduct(null);
      setSelectedInvoice(null);
    } else if (levelIndex === 2) {
      setSelectedInvoice(null);
    }
    setSearchTerm('');
  };

  const handleDrilldownCategory = (cat) => {
    setSelectedCategory(cat);
    setCurrentLevel(1);
    setBreadcrumbs(prev => [...prev, { label: cat.name, level: 1 }]);
    setSearchTerm('');
  };

  const handleDrilldownCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCurrentLevel(2);
    setBreadcrumbs(prev => [...prev, { label: cust.name, level: 2 }]);
    setSearchTerm('');
  };

  const handleDrilldownInvoice = (inv) => {
    setSelectedInvoice(inv);
    setCurrentLevel(3);
    setBreadcrumbs(prev => [...prev, { label: inv.id || 'Invoice Details', level: 3 }]);
    setSearchTerm('');
  };

  // Export current table view
  const handleExport = () => {
    const csvContent = `data:text/csv;charset=utf-8,Drilldown Report,${breadcrumbs.map(b => b.label).join(' > ')}\nExported At,${new Date().toISOString()}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CFO_Audit_${initialMetric}_${initialMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#0f1015] border border-white/15 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-[#14151b]/80 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Calculator className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Executive Calculation & Traceability Engine
              </h2>
              <span className="text-[10px] uppercase font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Live Audit Trail
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Interactive granular breakdown: Trace from summary metrics down to individual customer orders and transaction slips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
              title="Export Current View"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Breadcrumbs Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {currentLevel > 0 && (
              <button
                onClick={() => navigateToLevel(currentLevel - 1)}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white flex items-center gap-1 font-bold text-[11px] mr-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            )}

            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
                  <button
                    onClick={() => navigateToLevel(crumb.level)}
                    disabled={isLast}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all text-left truncate max-w-[200px] sm:max-w-none",
                      isLast 
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 cursor-default" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="relative flex-shrink-0 hidden md:block">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search in breakdown..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-400 w-44"
            />
          </div>
        </div>

        {/* Calculation Trail Formula Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-200">
          <Calculator className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="font-medium truncate">
            {currentLevel === 0 && `Total Metric Trace: Verified from ${metricConfig.title} across category lines and active accounts.`}
            {currentLevel === 1 && `Sub-Category Filter: Drilled down into "${selectedCategory?.name}". Total = ${selectedCategory?.formatted || 'Verified'}.`}
            {currentLevel === 2 && `Customer Ledger: Audit trail for "${selectedCustomer?.name}". Showing verified invoice orders.`}
            {currentLevel === 3 && `Transaction Verification: Source document "${selectedInvoice?.id || 'Invoice'}" verified against bank clearance.`}
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ════════ LEVEL 0: ROOT / CATEGORY LEVEL ════════ */}
          {currentLevel === 0 && (
            <div className="space-y-4">
              {/* Sales Trend Categories */}
              {initialMetric === 'sales_trend' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metricConfig.getCategories(initialMonth)
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => handleDrilldownCategory(cat)}
                        className="p-4 rounded-2xl bg-[#1c1d27] border border-white/10 hover:border-amber-400/50 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Category Breakdown
                          </span>
                          <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">{cat.name}</h4>
                          <p className="text-xs text-gray-400">{cat.itemsCount} institutional orders active</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="text-base font-black font-mono text-white block">{cat.formatted}</span>
                            <span className="text-[11px] font-bold text-gray-400">{cat.share} of total</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Gross Profit Trend Categories */}
              {initialMetric === 'gp_trend' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metricConfig.getCategories(initialMonth)
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => handleDrilldownCategory(cat)}
                        className="p-4 rounded-2xl bg-[#1c1d27] border border-white/10 hover:border-emerald-400/50 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Margin Split
                          </span>
                          <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">{cat.name}</h4>
                          <p className="text-xs text-gray-400">Sales: ₹{(cat.sales / 100000).toFixed(2)}L • COGS: {cat.cogs}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="text-base font-black font-mono text-emerald-400 block">{cat.formatted}</span>
                            <span className="text-[11px] font-extrabold text-amber-400">{cat.gp_pct} Margin</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Collection vs Sales Customers */}
              {initialMetric === 'collection_vs_sales' && (
                <div className="space-y-2.5">
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-black/50 text-gray-400 uppercase text-[10px] border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4">Client School</th>
                          <th className="py-3 px-4">Booked Sales</th>
                          <th className="py-3 px-4">Cash Realized</th>
                          <th className="py-3 px-4">Pending Due</th>
                          <th className="py-3 px-4">Velocity</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#181922]">
                        {metricConfig.getCustomers(initialMonth)
                          .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(cust => (
                            <tr key={cust.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-white">{cust.name}</td>
                              <td className="py-3.5 px-4 font-mono text-gray-300">₹{(cust.sales/100000).toFixed(2)}L</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{cust.formatted}</td>
                              <td className="py-3.5 px-4 font-mono text-rose-400">₹{(cust.pending/100000).toFixed(2)}L</td>
                              <td className="py-3.5 px-4">
                                <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                  {cust.ratio}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => handleDrilldownCustomer(cust)}
                                  className="px-2.5 py-1 bg-amber-400 hover:bg-yellow-400 text-black font-extrabold rounded-lg text-[10px] transition"
                                >
                                  Drill Down →
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Receivables Ageing Buckets */}
              {initialMetric === 'receivables_ageing' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metricConfig.getBuckets().map(bkt => (
                    <div
                      key={bkt.id}
                      onClick={() => handleDrilldownCategory(bkt)}
                      className="p-4 rounded-2xl bg-[#1c1d27] border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border" style={{ color: bkt.color, borderColor: `${bkt.color}40`, backgroundColor: `${bkt.color}15` }}>
                          {bkt.status}
                        </span>
                        <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">{bkt.bucket}</h4>
                        <p className="text-xs text-gray-400">{bkt.accounts} institutional clients</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-base font-black font-mono text-white block">{bkt.formatted}</span>
                          <span className="text-[10px] text-gray-400">View accounts</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inventory Value Categories */}
              {initialMetric === 'inventory_value' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metricConfig.getCategories(initialMonth).map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => handleDrilldownCategory(cat)}
                      className="p-4 rounded-2xl bg-[#1c1d27] border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          Warehouse Stock
                        </span>
                        <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">{cat.name}</h4>
                        <p className="text-xs text-gray-400">{cat.location}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-base font-black font-mono text-cyan-400 block">{cat.formatted}</span>
                          <span className="text-[10px] text-gray-400">{cat.share} of inventory</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cash Flow Summary */}
              {initialMetric === 'cash_flow_trend' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-xs font-bold text-gray-400">Total Cash Inflow</p>
                      <p className="text-xl font-black text-emerald-400 font-mono mt-1">₹26.00 Lakh</p>
                      <span className="text-[10px] text-gray-400">Collections & customer deposits</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                      <p className="text-xs font-bold text-gray-400">Total Cash Outflow</p>
                      <p className="text-xl font-black text-rose-400 font-mono mt-1">₹23.00 Lakh</p>
                      <span className="text-[10px] text-gray-400">Procurement, OpEx & payroll</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                      <p className="text-xs font-bold text-gray-400">Net Surplus / Cash Flow</p>
                      <p className="text-xl font-black text-blue-400 font-mono mt-1">+₹3.00 Lakh</p>
                      <span className="text-[10px] text-emerald-400 font-bold">Positive Liquidity</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Breakdown of Cash Inflows</h3>
                  <div className="space-y-2">
                    {metricConfig.getFlowSummary(initialMonth).breakdownIn.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleDrilldownCategory({ name: item.category, ...item })}
                        className="p-3 bg-[#1c1d27] rounded-xl border border-white/10 hover:border-emerald-400/40 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <span className="font-bold text-white">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-400">{item.formatted}</span>
                          <span className="text-gray-500">({item.share})</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Breakdown of Cash Outflows</h3>
                  <div className="space-y-2">
                    {metricConfig.getFlowSummary(initialMonth).breakdownOut.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleDrilldownCategory({ name: item.category, ...item })}
                        className="p-3 bg-[#1c1d27] rounded-xl border border-white/10 hover:border-rose-400/40 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <span className="font-bold text-white">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-rose-400">{item.formatted}</span>
                          <span className="text-gray-500">({item.share})</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Month-on-Month Comparison Variance */}
              {initialMetric === 'mom_comparison' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-gray-400">Click on any financial KPI to trace its underlying variance drivers.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CFO_REPORTS_DATA.mom_comparison.map(row => (
                      <div
                        key={row.kpi}
                        onClick={() => handleDrilldownCategory({ name: row.kpi, formatted: row.thisMonth, ...row })}
                        className="p-3.5 rounded-xl bg-[#1c1d27] border border-white/10 hover:border-amber-400/40 cursor-pointer transition flex items-center justify-between text-xs shadow-md"
                      >
                        <div>
                          <p className="font-black text-white">{row.kpi}</p>
                          <p className="text-[10px] text-gray-400">Last Month: {row.lastMonth} → This Month: {row.thisMonth}</p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-[10px] font-extrabold px-2 py-0.5 rounded-md",
                            row.positive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {row.pctChange}
                          </span>
                          <span className="text-xs font-bold text-gray-300 block mt-0.5">{row.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actual vs Target Variance */}
              {initialMetric === 'actual_vs_target' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-gray-400">Click on any performance metric to audit fulfillment against budget plan.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CFO_REPORTS_DATA.actual_vs_target.map(row => (
                      <div
                        key={row.kpi}
                        onClick={() => handleDrilldownCategory({ name: row.kpi, formatted: row.actual, ...row })}
                        className="p-3.5 rounded-xl bg-[#1c1d27] border border-white/10 hover:border-emerald-400/40 cursor-pointer transition flex items-center justify-between text-xs shadow-md"
                      >
                        <div>
                          <p className="font-black text-white">{row.kpi}</p>
                          <p className="text-[10px] text-gray-400">Budget: {row.target} • Actual: {row.actual}</p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-[10px] font-extrabold px-2 py-0.5 rounded-md",
                            row.onTrack ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {row.achievement}
                          </span>
                          <span className="text-xs font-bold text-gray-300 block mt-0.5">Gap: {row.gap}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════ LEVEL 1: CUSTOMER / PRODUCT LEVEL ════════ */}
          {currentLevel === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Institutional Accounts in {selectedCategory?.name}
                </h3>
                <span className="text-xs font-bold text-gray-400">Total: {selectedCategory?.formatted}</span>
              </div>

              {initialMetric === 'receivables_ageing' ? (
                <div className="space-y-2">
                  {metricConfig.getCustomersByBucket(selectedCategory?.id).map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => handleDrilldownCustomer(cust)}
                      className="p-4 rounded-xl bg-[#1c1d27] border border-white/10 hover:border-amber-400/40 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{cust.name}</p>
                        <p className="text-[10px] text-gray-400">{cust.district} • Due for {cust.overdueDays} days</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="font-mono font-black text-rose-400 text-sm block">{cust.formatted}</span>
                          <span className="text-[10px] text-gray-400">Ref: {cust.invoiceId}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : initialMetric === 'inventory_value' ? (
                <div className="space-y-2">
                  {metricConfig.getSKUs(selectedCategory?.id).map(sku => (
                    <div key={sku.id} className="p-4 rounded-xl bg-[#1c1d27] border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{sku.name}</p>
                        <p className="text-[10px] text-gray-400">Stock Qty: {sku.qty} @ {sku.rate} • Minimum Safe Stock: {sku.minStock}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-cyan-400 text-sm block">{sku.formatted}</span>
                        <span className="text-[10px] font-bold text-emerald-400">{sku.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : initialMetric === 'gp_trend' ? (
                <div className="space-y-2">
                  {metricConfig.getProducts(selectedCategory?.id).map(prd => (
                    <div
                      key={prd.id}
                      onClick={() => handleDrilldownCustomer(prd)}
                      className="p-4 rounded-xl bg-[#1c1d27] border border-white/10 hover:border-emerald-400/40 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{prd.name}</p>
                        <p className="text-[10px] text-gray-400">Sales: ₹{(prd.sales/100000).toFixed(2)}L • COGS: ₹{(prd.cogs/100000).toFixed(2)}L</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="font-mono font-black text-emerald-400 text-sm block">{prd.formattedGP}</span>
                          <span className="text-[10px] font-bold text-amber-400">{prd.gp_pct} Margin</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : initialMetric === 'cash_flow_trend' ? (
                <div className="space-y-2">
                  {metricConfig.getTransactionsByCategory(selectedCategory?.name).map(txn => (
                    <div key={txn.id} className="p-4 rounded-xl bg-[#1c1d27] border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{txn.payee}</p>
                        <p className="text-[10px] text-gray-400">{txn.date} • {txn.desc} ({txn.mode})</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-white text-sm block">{txn.formatted}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">Cleared via Bank</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {metricConfig.getCustomers(selectedCategory?.id || 'cat-socks').map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => handleDrilldownCustomer(cust)}
                      className="p-4 rounded-xl bg-[#1c1d27] border border-white/10 hover:border-amber-400/40 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{cust.name}</p>
                        <p className="text-[10px] text-gray-400">{cust.district} • {cust.invoiceCount || 2} Invoices Dispatched</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="font-mono font-black text-white text-sm block">{cust.formatted}</span>
                          <span className="text-[10px] text-gray-400">{cust.share || '100%'} share</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ LEVEL 2: INVOICE LIST / BILLS / COST ELEMENTS ════════ */}
          {currentLevel === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  Source Invoices & Orders for {selectedCustomer?.name}
                </h3>
                <span className="text-xs font-bold text-gray-400">Total: {selectedCustomer?.formatted || 'Audited'}</span>
              </div>

              {initialMetric === 'gp_trend' ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Unit Cost & Bill of Materials Breakdown:</p>
                  {metricConfig.getCostBreakdown(selectedCustomer?.id).map((c, idx) => (
                    <div key={idx} className="p-3 bg-[#1c1d27] rounded-xl border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{c.element}</p>
                        <p className="text-[10px] text-gray-400">Supplier: {c.supplier}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-400">₹{c.cost} / unit</span>
                        <span className="text-[10px] text-gray-400 block">{c.share}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {metricConfig.getInvoices(selectedCustomer?.id).map(inv => (
                    <div
                      key={inv.id}
                      onClick={() => handleDrilldownInvoice(inv)}
                      className="p-4 rounded-xl bg-[#1c1d27] border border-white/10 hover:border-amber-400/40 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{inv.id}</span>
                          <span className={cn(
                            "text-[10px] font-extrabold px-2 py-0.5 rounded-full",
                            inv.status === 'Paid' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          )}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Dispatched on {inv.date} • Terms: {inv.paymentTerms}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="font-mono font-black text-white text-sm block">{inv.formatted}</span>
                          <span className="text-[10px] text-gray-400">Trace payments →</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ LEVEL 3: TRANSACTION & BANK RECEIPT VERIFICATION ════════ */}
          {currentLevel === 3 && (
            <div className="space-y-4">
              <div className="bg-[#1c1d27] p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      Invoice Ledger Audit: {selectedInvoice?.id}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Date: {selectedInvoice?.date} • Status: {selectedInvoice?.status}</p>
                  </div>
                  <span className="text-lg font-mono font-black text-amber-400">{selectedInvoice?.formatted}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Customer Account</p>
                    <p className="font-bold text-white text-sm">{selectedCustomer?.name}</p>
                    <p className="text-gray-400">{selectedCustomer?.district || 'Tamil Nadu'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Verification Status</p>
                    <p className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Mathematically Reconciled
                    </p>
                    <p className="text-gray-400">Audited against Murugan Cards General Ledger</p>
                  </div>
                </div>
              </div>

              {/* Transactions Recorded */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Associated Banking Clearance & Settlement Vouchers
                </h4>
                {metricConfig.getTransactions(selectedInvoice?.id).map(txn => (
                  <div key={txn.id} className="p-4 rounded-xl bg-[#1c1d27] border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">{txn.id}</span>
                        <span className="text-gray-400">• {txn.mode}</span>
                      </div>
                      <p className="text-gray-300 font-medium">Bank Reference: {txn.ref}</p>
                      <p className="text-[10px] text-gray-500">{txn.creditedTo}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-400 text-sm block">{txn.formatted}</span>
                      <span className="text-[10px] text-gray-400">{txn.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Close Bar */}
        <div className="p-4 border-t border-white/10 bg-[#14151b] flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Click any level above or use the breadcrumb bar to explore calculation lineages.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-murugan-accent hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            Close Audit View
          </button>
        </div>
      </motion.div>
    </div>
  );
}
