import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Target,
  Briefcase,
  Sparkles,
  Award,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileCheck,
  Trophy,
  Receipt,
  Truck,
  Package,
  Users,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Download,
  RefreshCw,
  Phone,
  Building2,
  Clock,
  ChevronRight,
  AlertTriangle,
  PieChart,
  Megaphone,
  ShoppingBag,
  Sliders,
  Check,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { mockApi, calculateCommissionSlab } from '../mockApi';
import { cn } from '../lib/utils';

export default function CEODashboardOverview({ currentUser, onOpenApprovals, onNavigateTab }) {
  const [data, setData] = useState(null);
  const [rawEntities, setRawEntities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeScope, setTimeScope] = useState('All'); // 'All' | 'Q3' | 'Month'
  const [exportNotice, setExportNotice] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [hubData, invoices, visits, quotations, payments] = await Promise.all([
        mockApi.getCEODashboardHubData(),
        mockApi.getInvoices().catch(() => []),
        mockApi.getVisits().catch(() => []),
        mockApi.getQuotations().catch(() => []),
        mockApi.getPayments().catch(() => [])
      ]);
      setData(hubData);
      setRawEntities({
        invoices: Array.isArray(invoices) ? invoices : [],
        visits: Array.isArray(visits) ? visits : [],
        quotations: Array.isArray(quotations) ? quotations : [],
        payments: Array.isArray(payments) ? payments : []
      });
    } catch (err) {
      console.error('Failed to load CEO dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Dynamically compute time-scoped data across all KPIs and domain hubs
  const scopedData = useMemo(() => {
    if (!data) return null;
    if (timeScope === 'All' && !rawEntities) return data;

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const isMatchScope = (item) => {
      if (timeScope === 'All') return true;
      const dateStr = item?.created_at || item?.date || item?.recorded_at || item?.timestamp;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const m = d.getMonth();
      const y = d.getFullYear();
      if (timeScope === 'Month') {
        return m === curMonth && y === curYear;
      }
      if (timeScope === 'Q3') {
        // Quarter 3: July (6), August (7), September (8)
        return m >= 6 && m <= 8 && y === curYear;
      }
      return true;
    };

    if (!rawEntities) {
      return data;
    }

    const filteredInvoices = rawEntities.invoices.filter(isMatchScope);
    const filteredVisits = rawEntities.visits.filter(isMatchScope);
    const filteredQuotes = rawEntities.quotations.filter(isMatchScope);
    const filteredPayments = rawEntities.payments.filter(isMatchScope);

    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
    const totalCollected = filteredInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
    const totalReceivables = filteredInvoices.reduce((sum, i) => sum + (Number(i.outstanding_balance) || 0), 0);
    const estCOGS = Math.round(totalInvoiced * 0.52);
    const grossProfit = Math.max(0, totalInvoiced - estCOGS);
    const grossMarginPct = totalInvoiced > 0 ? ((grossProfit / totalInvoiced) * 100).toFixed(1) : '48.0';
    const opex = Math.round(totalInvoiced * 0.24);
    const netProfit = Math.max(0, grossProfit - opex);
    const netMarginPct = totalInvoiced > 0 ? ((netProfit / totalInvoiced) * 100).toFixed(1) : '24.0';

    const ordersWon = filteredVisits.filter(v => (v.outcome_status || '').toLowerCase() === 'won').length + filteredInvoices.length;
    const hotLeads = filteredVisits.filter(v => (v.interest_level || '').toLowerCase() === 'hot').length;
    const warmLeads = filteredVisits.filter(v => (v.interest_level || '').toLowerCase() === 'warm').length;
    const coldLeads = filteredVisits.filter(v => (v.interest_level || '').toLowerCase() === 'cold').length;
    const notInterestedLeads = filteredVisits.filter(v => (v.interest_level || '').toLowerCase().includes('not interested')).length;

    const activeQuotes = filteredQuotes.filter(q => (q.status || '').toLowerCase() !== 'rejected' && (q.status || '').toLowerCase() !== 'cancelled');
    const activeQuotesValue = activeQuotes.reduce((sum, q) => sum + (Number(q.grand_total) || 0), 0);
    const totalPipelineValue = activeQuotesValue + (hotLeads * 120000) + (warmLeads * 65000);

    const formatL = (val) => `₹${((Number(val) || 0) / 100000).toFixed(2)}L`;

    let overdueCount = 0;
    let overdueAmount = 0;
    const overdueInvoices = [];
    const agingBuckets = {
      current: { label: '0 - 30 Days', count: 0, amount: 0 },
      days31_60: { label: '31 - 60 Days', count: 0, amount: 0 },
      days61_90: { label: '61 - 90 Days', count: 0, amount: 0 },
      days90Plus: { label: '90+ Days', count: 0, amount: 0 }
    };

    filteredInvoices.forEach(inv => {
      const balance = Number(inv.outstanding_balance) || 0;
      if (balance > 0) {
        const createdDate = new Date(inv.created_at || inv.date || Date.now());
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        if (inv.due_date && new Date(inv.due_date) < now) {
          overdueCount++;
          overdueAmount += balance;
          overdueInvoices.push(inv);
        }
        if (ageInDays <= 30) {
          agingBuckets.current.count++;
          agingBuckets.current.amount += balance;
        } else if (ageInDays <= 60) {
          agingBuckets.days31_60.count++;
          agingBuckets.days31_60.amount += balance;
        } else if (ageInDays <= 90) {
          agingBuckets.days61_90.count++;
          agingBuckets.days61_90.amount += balance;
        } else {
          agingBuckets.days90Plus.count++;
          agingBuckets.days90Plus.amount += balance;
        }
      }
    });

    const clientMap = {};
    filteredInvoices.forEach(i => {
      const name = i.school_name || 'School Client';
      if (!clientMap[name]) {
        clientMap[name] = {
          name,
          district: i.district || 'Chennai',
          totalBilled: 0,
          totalPaid: 0,
          outstanding: 0,
          invoiceCount: 0
        };
      }
      clientMap[name].totalBilled += Number(i.grand_total) || 0;
      clientMap[name].totalPaid += Number(i.paid_amount) || 0;
      clientMap[name].outstanding += Number(i.outstanding_balance) || 0;
      clientMap[name].invoiceCount += 1;
    });
    const topCustomers = Object.values(clientMap).sort((a, b) => b.totalBilled - a.totalBilled);

    const canvasserRoster = (data.people?.canvasserRoster || []).map(rep => {
      const repVisits = filteredVisits.filter(v => v.canvasser_id === rep.id || v.canvasser_name === rep.name);
      const repWon = repVisits.filter(v => (v.outcome_status || '').toLowerCase() === 'won').length;
      const repInvoices = filteredInvoices.filter(i => i.canvasser_id === rep.id || i.canvasser_name === rep.name);
      const repInvoiced = repInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      const newSchoolsCount = repInvoices.filter(inv => {
        const matchingVisit = filteredVisits.find(v => v.id === inv.visit_id || (v.school_name === inv.school_name && (v.canvasser_id === rep.id || v.canvasser_name === rep.name)));
        return matchingVisit && matchingVisit.is_from_master_db === 0;
      }).length;
      const slabInfo = calculateCommissionSlab(repInvoiced, newSchoolsCount);
      return {
        ...rep,
        visits: repVisits.length,
        won: repWon,
        invoiced: repInvoiced,
        commission: slabInfo.commission,
        commissionFormatted: slabInfo.formattedCommission,
        rate: slabInfo.rate,
        tier: slabInfo.tier,
        slabLabel: slabInfo.slabLabel
      };
    }).sort((a, b) => b.invoiced - a.invoiced);

    const totalCommissionsPayable = canvasserRoster.reduce((sum, r) => sum + (r.commission || 0), 0);
    const uniqueVisited = new Set(filteredVisits.map(v => v.school_name || v.school_id)).size;

    let scopedMonthlyTrend = data.reporting?.monthlyTrend || [];
    if (timeScope === 'Month') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      scopedMonthlyTrend = scopedMonthlyTrend.filter(m => m.month === monthNames[curMonth]);
      if (scopedMonthlyTrend.length === 0) {
        scopedMonthlyTrend = [{
          month: monthNames[curMonth],
          billed: totalInvoiced,
          collected: totalCollected,
          visits: filteredVisits.length
        }];
      }
    } else if (timeScope === 'Q3') {
      scopedMonthlyTrend = scopedMonthlyTrend.filter(m => ['Jul', 'Aug', 'Sep'].includes(m.month));
    }

    const scopeLabel = timeScope === 'Month' ? 'This Month' : timeScope === 'Q3' ? 'Quarter 3' : 'All-Time';

    const executiveKPIs = [
      {
        id: 'kpi_rev',
        title: `Total Revenue (${scopeLabel})`,
        value: formatL(totalInvoiced),
        rawValue: totalInvoiced,
        change: timeScope === 'Month' ? 'Current Month' : timeScope === 'Q3' ? 'Q3 Performance' : '+18.4% vs LM',
        trend: 'up',
        subtext: `${filteredInvoices.length} Invoices Billed (Live DB)`,
        isFabricated: false,
        status: 'success'
      },
      {
        id: 'kpi_gp',
        title: 'Gross Profit & Margin',
        value: formatL(grossProfit),
        rawValue: grossProfit,
        change: `${grossMarginPct}% Margin`,
        trend: 'up',
        subtext: `Formula: Revenue - (Revenue × 52% Production COGS)`,
        isFabricated: true,
        formulaText: 'Revenue - (Revenue × 0.52)',
        status: 'warning'
      },
      {
        id: 'kpi_np',
        title: 'Net Profit (EBITDA)',
        value: formatL(netProfit),
        rawValue: netProfit,
        change: `${netMarginPct}% Margin`,
        trend: 'up',
        subtext: `Formula: Gross Profit - (Revenue × 24% Opex Model)`,
        isFabricated: true,
        formulaText: 'Gross Profit - (Revenue × 0.24)',
        status: 'warning'
      },
      {
        id: 'kpi_cash',
        title: 'Cash Inflow (Collections)',
        value: formatL(totalCollected),
        rawValue: totalCollected,
        change: totalInvoiced > 0 ? `${((totalCollected / totalInvoiced) * 100).toFixed(1)}% Cleared` : '0% Cleared',
        trend: 'up',
        subtext: `${filteredPayments.length} Payments Cleared (Live DB)`,
        isFabricated: false,
        status: 'success'
      },
      {
        id: 'kpi_ar',
        title: 'Accounts Receivable',
        value: formatL(totalReceivables),
        rawValue: totalReceivables,
        change: overdueInvoices.length > 0 ? `${overdueInvoices.length} Overdue` : totalReceivables > 0 ? 'Pending' : 'Settled',
        trend: overdueInvoices.length > 0 ? 'down' : 'up',
        subtext: `Outstanding: ${formatL(totalReceivables)} (Live DB)`,
        isFabricated: false,
        status: overdueInvoices.length > 0 ? 'warning' : 'success'
      },
      {
        id: 'kpi_orders',
        title: 'Orders Won & Invoiced',
        value: `${ordersWon} Accounts`,
        rawValue: ordersWon,
        change: `Win Rate: ${filteredVisits.length > 0 ? Math.round((ordersWon / filteredVisits.length) * 100) : 0}%`,
        trend: 'up',
        subtext: `${filteredVisits.length} Visits Logged (${scopeLabel})`,
        isFabricated: false,
        status: 'success'
      },
      {
        id: 'kpi_pipeline',
        title: 'Sales Pipeline Value',
        value: formatL(totalPipelineValue),
        rawValue: totalPipelineValue,
        change: `${filteredQuotes.length} Quotes Issued`,
        trend: 'up',
        subtext: `Live Quotes (${formatL(activeQuotesValue)}) + Leads (Hot × ₹1.2L + Warm × ₹65K)`,
        isFabricated: true,
        formulaText: 'Active Quotes + (Hot × ₹1.2L) + (Warm × ₹65K)',
        status: 'warning'
      }
    ];

    return {
      ...data,
      executiveKPIs,
      sales: {
        ...data.sales,
        totalPipelineValue,
        activeQuotesValue,
        quotationsCount: filteredQuotes.length,
        visitedCustomers: uniqueVisited,
        convertedCustomers: topCustomers.length,
        avgDealValue: filteredInvoices.length > 0 ? Math.round(totalInvoiced / filteredInvoices.length) : 0,
        highestDealValue: filteredInvoices.reduce((max, i) => Math.max(max, Number(i.grand_total) || 0), 0),
        winRate: filteredVisits.length > 0 ? Math.round((ordersWon / filteredVisits.length) * 100) : 0,
        quarterlyTarget: 3500000,
        targetProgress: totalInvoiced > 0 ? Math.min(100, Math.round((totalInvoiced / 3500000) * 100)) : 0
      },
      finance: {
        ...data.finance,
        totalInvoiced,
        totalCollected,
        totalReceivables,
        collectionRate: totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0',
        commissionsPayable: totalCommissionsPayable,
        estimatedCOGS: estCOGS,
        grossMarginPct,
        netMarginPct,
        agingBuckets,
        overdueCount,
        overdueAmount
      },
      operations: {
        ...data.operations,
        totalOrders: ordersWon,
        activeInvoices: filteredInvoices.length,
        sampleSentCount: filteredVisits.filter(v => (v.outcome_status || '').toLowerCase().includes('sample')).length,
        quoteGivenCount: filteredVisits.filter(v => (v.outcome_status || '').toLowerCase().includes('quote')).length
      },
      customers: {
        ...data.customers,
        visitedCount: uniqueVisited,
        penetrationRate: ((uniqueVisited / (data.customers?.masterSchoolsTotal || 2561)) * 100).toFixed(1),
        topCustomers: topCustomers.slice(0, 6)
      },
      procurement: {
        ...data.procurement,
        estCOGS
      },
      marketing: {
        ...data.marketing,
        totalVisits: filteredVisits.length,
        hotLeads,
        warmLeads,
        coldLeads,
        notInterestedLeads,
        leadConversionRate: filteredVisits.length > 0 ? Math.round((ordersWon / filteredVisits.length) * 100) : 0
      },
      people: {
        ...data.people,
        canvasserRoster
      },
      reporting: {
        ...data.reporting,
        monthlyTrend: scopedMonthlyTrend,
        summary: {
          totalBilled: totalInvoiced,
          totalCollected,
          totalOutstanding: totalReceivables,
          grossProfit,
          netProfit,
          visitsTotal: filteredVisits.length
        }
      }
    };
  }, [data, rawEntities, timeScope]);

  const handleExportMIS = () => {
    const reportData = scopedData || data;
    if (!reportData) return;
    const rows = [
      ['Murugan Groups "The One" — CEO Executive MIS Report'],
      ['Generated On', new Date().toLocaleString()],
      ['Time Scope', timeScope],
      [],
      ['EXECUTIVE KPIS'],
      ['KPI', 'Value', 'Status', 'Benchmark / Target'],
      ['Total Revenue (Billed)', reportData.executiveKPIs[0]?.value, 'On Track', 'Target: ₹35.00L'],
      ['Gross Profit & Margin', reportData.executiveKPIs[1]?.value, 'Healthy', reportData.executiveKPIs[1]?.change],
      ['Net Profit (EBITDA)', reportData.executiveKPIs[2]?.value, 'Profitable', reportData.executiveKPIs[2]?.change],
      ['Cash Inflow (Collections)', reportData.executiveKPIs[3]?.value, 'Cleared', `${reportData.finance?.collectionRate}% Rate`],
      ['Accounts Receivable', reportData.executiveKPIs[4]?.value, reportData.finance?.overdueCount > 0 ? 'Action Required' : 'Current', `Overdue: ₹${(reportData.finance?.overdueAmount / 100000).toFixed(2)}L`],
      ['Orders Won & Invoiced', reportData.executiveKPIs[5]?.value, 'Active', `Win Rate: ${reportData.sales?.winRate}%`],
      ['Live Sales Pipeline', reportData.executiveKPIs[6]?.value, 'Strong', `${reportData.sales?.quotationsCount} Active Quotes`],
      [],
      ['SALES & DEAL METRICS'],
      ['Metric', 'Value'],
      ['Total Visited Institutions', reportData.sales?.visitedCustomers],
      ['Converted Paying Accounts', reportData.sales?.convertedCustomers],
      ['Average Deal Size', `₹${(reportData.sales?.avgDealValue || 0).toLocaleString('en-IN')}`],
      ['Highest Single Deal', `₹${(reportData.sales?.highestDealValue || 0).toLocaleString('en-IN')}`],
      ['Quarterly Target Progress', `${reportData.sales?.targetProgress}% of ₹35.00L`],
      [],
      ['FINANCE & RECEIVABLES AGING'],
      ['Bucket', 'Invoices Count', 'Amount (INR)'],
      ['0 - 30 Days (Current)', reportData.finance?.agingBuckets?.current?.count, reportData.finance?.agingBuckets?.current?.amount],
      ['31 - 60 Days', reportData.finance?.agingBuckets?.days31_60?.count, reportData.finance?.agingBuckets?.days31_60?.amount],
      ['61 - 90 Days', reportData.finance?.agingBuckets?.days61_90?.count, reportData.finance?.agingBuckets?.days61_90?.amount],
      ['90+ Days (High Risk)', reportData.finance?.agingBuckets?.days90Plus?.count, reportData.finance?.agingBuckets?.days90Plus?.amount],
      ['Commissions Payable Liability', '', reportData.finance?.commissionsPayable],
      [],
      ['TOP INSTITUTIONAL ACCOUNTS'],
      ['School Name', 'District', 'Total Billed (INR)', 'Total Paid (INR)', 'Outstanding (INR)'],
      ...(reportData.customers?.topCustomers || []).map(c => [
        c.name,
        c.district,
        c.totalBilled,
        c.totalPaid,
        c.outstanding
      ]),
      [],
      ['FIELD SALES TEAM PERFORMANCE'],
      ['Canvasser Name', 'Role', 'Visits Logged', 'Orders Won', 'Billed Revenue (INR)', 'Commission Slab', 'Commission Earned (INR)'],
      ...(reportData.people?.canvasserRoster || []).map(r => [
        r.name,
        r.roleTitle,
        r.visits,
        r.won,
        r.invoiced,
        r.slabLabel,
        r.commission
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CEO_Executive_MIS_Report_${timeScope}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3500);
  };

  if (loading || !scopedData) {
    return (
      <div className="space-y-6 py-4 animate-pulse">
        <div className="h-28 bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-40 bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08]" />
          <div className="h-80 bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08]" />
        </div>
      </div>
    );
  }

  const {
    executiveKPIs,
    sales,
    finance,
    operations,
    inventory,
    customers,
    procurement,
    marketing,
    people,
    management,
    reporting
  } = scopedData;

  return (
    <div className="space-y-8 pb-12 selection:bg-amber-400 selection:text-black">
      {/* ── TOP EXECUTIVE CONTROLS & STATUS BAR ────────────────────────── */}
      <div className="bg-gradient-to-r from-[#14151f]/95 via-[#0e1017]/90 to-[#0c0d15]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Luminous Top Catch Rim */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-amber-300 uppercase">
                CEO Central Command Hub
              </span>
              <span className="text-[10px] bg-white/[0.06] text-white/70 border border-white/[0.08] px-2 py-0.5 rounded-md font-mono">
                FY 2026-27
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
              Executive Performance &amp; Command Center
            </h2>
            <p className="text-xs text-white/55 mt-1 leading-relaxed max-w-2xl">
              Complete real-time executive dashboard across commercial sales, finance, operations, school customers, field team, and longitudinal reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Apple-grade Fluid Spring Time Scope Toggle */}
            <div className="bg-black/40 border border-white/[0.08] p-1 rounded-2xl flex items-center gap-1 backdrop-blur-md">
              {['Month', 'Q3', 'All'].map(scope => {
                const isActive = timeScope === scope;
                return (
                  <button
                    key={scope}
                    onClick={() => setTimeScope(scope)}
                    className={cn(
                      "relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none",
                      isActive ? "text-black font-black" : "text-white/60 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="ceoTimeScopePill"
                        className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl shadow-md shadow-amber-400/20 -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">
                      {scope === 'Month' ? 'This Month' : scope === 'Q3' ? 'Quarter 3' : 'All-Time'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Action: Export MIS */}
            <button
              onClick={handleExportMIS}
              className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white border border-white/[0.1] hover:border-amber-400/30 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              title="Download executive summary report as CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export MIS</span>
            </button>

            {/* Quick Action: Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white border border-white/[0.1] hover:border-amber-400/30 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-amber-400")} />
            </button>
          </div>
        </div>

        {/* Data Source Transparency Indicator */}
        <div className="flex items-center gap-3 text-xs bg-black/35 border border-white/[0.06] px-4 py-2.5 rounded-2xl text-white/60 flex-wrap mt-4">
          <span className="font-bold text-white">Data Integrity Breakdown:</span>
          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Verified Live DB: Invoices, Collections, Receivables Aging, Quotes, Visits, Rep Slabs
          </span>
          <span className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Fabricated / Modeled: Gross Profit (52% COGS), Net Profit (24% Opex), Weighted Leads — Formulas Displayed on Cards
          </span>
        </div>

        {exportNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>CEO Executive MIS Report generated and downloaded successfully!</span>
          </motion.div>
        )}
      </div>

      {/* ── 1. EXECUTIVE KPIS STRIP (8 HERO METRICS) ────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white/80 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Core Executive Financial &amp; Commercial KPIs</span>
          </h3>
          <span className="text-xs text-white/45 font-medium">Real-Time Aggregations &amp; Formulas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {executiveKPIs.map((kpi) => {
            const isRevenue = kpi.id === 'kpi_rev';
            const isReceivables = kpi.id === 'kpi_ar';
            const isCash = kpi.id === 'kpi_cash';
            const isFabricated = kpi.isFabricated || kpi.id === 'kpi_gp' || kpi.id === 'kpi_np' || kpi.id === 'kpi_pipeline';

            return (
              <motion.div
                key={kpi.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "p-5 sm:p-6 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between shadow-xl backdrop-blur-2xl group",
                  isRevenue
                    ? 'bg-gradient-to-br from-amber-500/15 via-[#14151f] to-[#0c0d15] border-amber-400/40 shadow-amber-500/10'
                    : isReceivables && finance.overdueCount > 0
                      ? 'bg-gradient-to-br from-rose-500/15 via-[#14151f] to-[#0c0d15] border-rose-500/40 shadow-rose-500/10'
                      : isCash
                        ? 'bg-gradient-to-br from-emerald-500/15 via-[#14151f] to-[#0c0d15] border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-[#0c0d15]/85 border-white/[0.08] hover:border-amber-400/35'
                )}
              >
                {/* Luminous Top Catch Rim */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-white/70">
                    <span className="text-white/80 font-bold group-hover:text-white transition-colors">{kpi.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFabricated ? (
                        <span className="text-[9px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-wide uppercase">
                          Fabricated
                        </span>
                      ) : (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-wide uppercase">
                          Live DB
                        </span>
                      )}
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-black font-mono",
                        kpi.trend === 'up'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : kpi.status === 'warning'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-white/10 text-white/80'
                      )}>
                        {kpi.change}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <div className={cn(
                      "text-2xl sm:text-3xl font-black font-mono tracking-tight",
                      isRevenue ? "text-amber-400" : isCash ? "text-emerald-400" : isReceivables && finance.overdueCount > 0 ? "text-rose-400" : "text-white"
                    )}>
                      {kpi.value}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1">
                  <div className="text-xs text-white/50 leading-relaxed font-medium">
                    {kpi.subtext}
                  </div>
                  {isFabricated && (
                    <div className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 mt-1.5">
                      {kpi.id === 'kpi_gp' && 'Formula: Revenue - (Revenue × 52% COGS)'}
                      {kpi.id === 'kpi_np' && 'Formula: Gross Profit - (Revenue × 24% Opex)'}
                      {kpi.id === 'kpi_pipeline' && 'Formula: Live Quotes + (Hot × ₹1.2L + Warm × ₹65K)'}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 2. DETAILED DOMAIN HUBS (ALL 10 SECTIONS IN COMMAND HUB) ───────── */}

      {/* ── SECTION 1: SALES & PIPELINE ─────────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/25">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Sales Engine &amp; Pipeline Intelligence</h3>
              <p className="text-xs text-white/50">Institutional sales pipeline, active quote values, conversion rates &amp; targets</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3.5 py-1 rounded-full font-mono">
            Win Rate: {sales.winRate}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-medium">Live Pipeline Value</span>
              <span className="text-[9px] bg-amber-400/15 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Fabricated Model</span>
            </div>
            <div className="text-xl font-black text-white font-mono">₹{(sales.totalPipelineValue / 100000).toFixed(2)}L</div>
            <p className="text-[10px] font-mono text-amber-300/80">Formula: Quotes + (Hot × ₹1.2L + Warm × ₹65K)</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-medium">Active Quotations Value</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Live DB</span>
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">₹{(sales.activeQuotesValue / 100000).toFixed(2)}L</div>
            <p className="text-[11px] text-white/40">{sales.quotationsCount} Institutional quotations issued</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-medium">Average Deal Size</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Live DB</span>
            </div>
            <div className="text-xl font-black text-white font-mono">₹{(sales.avgDealValue).toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-white/40 font-mono">Highest Closed: ₹{(sales.highestDealValue).toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-medium">Quarterly Target Progress</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Live DB</span>
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">{sales.targetProgress}%</div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${sales.targetProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: FINANCE & CASH FLOW ──────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Finance, Cash Flow &amp; Receivables Aging</h3>
              <p className="text-xs text-white/50">Cash collections, payables, commission liabilities &amp; debt aging brackets</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full font-mono">
            Collection Rate: {finance.collectionRate}%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Inflow &amp; Liabilities Summary</h4>
            <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Total Billed Invoices (Live DB)</span>
                <span className="font-bold text-white font-mono">₹{(finance.totalInvoiced / 100000).toFixed(2)}L</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Cash Inflow Cleared (Live DB)</span>
                <span className="font-bold text-emerald-400 font-mono">₹{(finance.totalCollected / 100000).toFixed(2)}L</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Pending Receivables (Live DB)</span>
                <span className="font-bold text-amber-400 font-mono">₹{(finance.totalReceivables / 100000).toFixed(2)}L</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/[0.06]">
                <span className="text-white/50">Canvasser Commission Liability</span>
                <span className="font-bold text-indigo-400 font-mono">₹{(finance.commissionsPayable).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Est. COGS (Fabricated Benchmark)</span>
                <span className="font-bold text-amber-300 font-mono text-[11px]">₹{(finance.estimatedCOGS / 100000).toFixed(2)}L (52% COGS)</span>
              </div>
            </div>
          </div>

          {/* Aging Buckets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Receivables Aging Brackets (Live DB)</h4>
            <div className="space-y-2.5">
              <div className="bg-black/35 border border-white/[0.06] p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">0 - 30 Days (Current)</div>
                  <div className="text-[10px] text-white/40">{finance.agingBuckets?.current?.count || 0} Invoices</div>
                </div>
                <div className="text-xs font-black text-emerald-400 font-mono">
                  ₹{((finance.agingBuckets?.current?.amount || 0) / 100000).toFixed(2)}L
                </div>
              </div>

              <div className="bg-black/35 border border-white/[0.06] p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">31 - 60 Days</div>
                  <div className="text-[10px] text-white/40">{finance.agingBuckets?.days31_60?.count || 0} Invoices</div>
                </div>
                <div className="text-xs font-black text-amber-400 font-mono">
                  ₹{((finance.agingBuckets?.days31_60?.amount || 0) / 100000).toFixed(2)}L
                </div>
              </div>

              <div className="bg-black/35 border border-white/[0.06] p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">61 - 90 Days</div>
                  <div className="text-[10px] text-white/40">{finance.agingBuckets?.days61_90?.count || 0} Invoices</div>
                </div>
                <div className="text-xs font-black text-orange-400 font-mono">
                  ₹{((finance.agingBuckets?.days61_90?.amount || 0) / 100000).toFixed(2)}L
                </div>
              </div>

              <div className="bg-black/35 border border-rose-500/25 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-300">90+ Days (High Risk)</div>
                  <div className="text-[10px] text-rose-400/80">{finance.agingBuckets?.days90Plus?.count || 0} Invoices</div>
                </div>
                <div className="text-xs font-black text-rose-400 font-mono">
                  ₹{((finance.agingBuckets?.days90Plus?.amount || 0) / 100000).toFixed(2)}L
                </div>
              </div>
            </div>
          </div>

          {/* Recent Collections */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Latest Payment Settlements (Live DB)</h4>
            <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-3">
              {finance.recentPayments.length === 0 ? (
                <div className="text-xs text-white/40 text-center py-4">No recent payments logged</div>
              ) : (
                finance.recentPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.06] last:border-0">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-white truncate">{p.school_name || 'Direct School Payment'}</div>
                      <span className="text-[10px] text-white/40 font-mono">{p.payment_date} • {p.payment_mode}</span>
                    </div>
                    <span className="font-black text-emerald-400 font-mono shrink-0">₹{Number(p.amount_paid).toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: OPERATIONS & FIELD DISPATCH ───────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Operations, Delivery &amp; Follow-Up Deadlines</h3>
              <p className="text-xs text-white/50">Sample dispatches, quotation turns, customer follow-up actions &amp; delays</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('followups')}
            className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 transition px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 cursor-pointer"
          >
            <span>Central Follow-Ups Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1">
            <span className="text-xs text-white/50 font-medium">Orders In Progress</span>
            <div className="text-xl font-black text-white font-mono">{operations.totalOrders}</div>
            <p className="text-[11px] text-emerald-400">Won client commitments (Live DB)</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1">
            <span className="text-xs text-white/50 font-medium">Samples Dispatched</span>
            <div className="text-xl font-black text-cyan-300 font-mono">{operations.sampleSentCount}</div>
            <p className="text-[11px] text-white/40">Fabric &amp; fit samples at schools (Live DB)</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1">
            <span className="text-xs text-white/50 font-medium">Quotes Under Review</span>
            <div className="text-xl font-black text-amber-400 font-mono">{operations.quoteGivenCount}</div>
            <p className="text-[11px] text-white/40">Awaiting school signoff (Live DB)</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1">
            <span className="text-xs text-white/50 font-medium">Follow-Up Action Items</span>
            <div className="text-xl font-black text-rose-400 font-mono">{operations.overdueFollowUpsCount}</div>
            <p className="text-[11px] text-rose-400/80">Urgent field follow-ups (Live DB)</p>
          </div>
        </div>

        {operations.overdueFollowUps.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Upcoming &amp; Priority Follow-Up Commitments (Live DB)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {operations.overdueFollowUps.map(f => (
                <div key={f.id} className="bg-black/35 border border-white/[0.06] p-3.5 rounded-2xl flex items-center justify-between text-xs hover:border-amber-400/30 transition">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white truncate">{f.school_name}</div>
                    <div className="text-[11px] text-white/45 mt-0.5">
                      Rep: <span className="text-amber-300 font-semibold">{f.canvasser_name}</span> • Due: {f.follow_up_date}
                    </div>
                  </div>
                  {f.phone && (
                    <a
                      href={`tel:${f.phone}`}
                      className="p-2 rounded-xl bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30 transition shrink-0"
                      title="Call Contact"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 4: INVENTORY & PRODUCT DEMAND ────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/25">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Inventory Catalog &amp; Product Demand</h3>
              <p className="text-xs text-white/50">Stock product catalog, category velocity &amp; demand in field visits</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3.5 py-1 rounded-full font-mono">
            {inventory.productsCatalogCount} Standard SKUs
          </span>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Field Demand Frequency by Product (Live DB Visit Logs)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inventory.demandDistribution.map(item => {
              const maxCount = Math.max(...inventory.demandDistribution.map(i => i.count), 1);
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.product} className="bg-black/35 border border-white/[0.06] p-3.5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="w-48 text-xs font-bold text-white truncate">{item.product}</div>
                  <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-sm shadow-amber-400/30" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-black text-amber-400 font-mono w-24 text-right">{item.count} Inquiries</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 5: CUSTOMERS & INSTITUTIONAL ACCOUNTS ─────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Institutional Customer Base &amp; Retention</h3>
              <p className="text-xs text-white/50">Master School Directory coverage, top billing institutions &amp; account profitability</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('schools')}
            className="text-xs font-bold text-blue-300 hover:text-white flex items-center gap-1.5 transition px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 cursor-pointer"
          >
            <span>Explore Master Directory (2,480+)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reach Stats */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Territory Coverage</h4>
            <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Master Catalog Directory</span>
                <span className="font-bold text-white font-mono">{customers.masterSchoolsTotal} Schools</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Canvassed / Visited (Live DB)</span>
                <span className="font-bold text-amber-400 font-mono">{customers.visitedCount} Schools</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Converted Client Accounts (Live DB)</span>
                <span className="font-bold text-emerald-400 font-mono">{customers.topCustomers.length} Accounts</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/[0.06]">
                <span className="text-white/50">Active Territory Penetration</span>
                <span className="font-bold text-blue-300 font-mono">{customers.penetrationRate}%</span>
              </div>
            </div>
          </div>

          {/* Top Revenue Schools */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Top Revenue Contributing Institutions (Live DB)</h4>
            <div className="bg-black/35 border border-white/[0.06] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/[0.03] text-white/50 border-b border-white/[0.08]">
                    <th className="p-3.5 font-bold">School Name</th>
                    <th className="p-3.5 font-bold">District</th>
                    <th className="p-3.5 font-bold text-right">Total Billed</th>
                    <th className="p-3.5 font-bold text-right">Settled</th>
                    <th className="p-3.5 font-bold text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {customers.topCustomers.map(sc => (
                    <tr key={sc.name} className="hover:bg-white/[0.03] transition">
                      <td className="p-3.5 font-bold text-white">{sc.name}</td>
                      <td className="p-3.5 text-white/50">{sc.district}</td>
                      <td className="p-3.5 text-right font-black text-amber-400 font-mono">₹{(sc.totalBilled / 100000).toFixed(2)}L</td>
                      <td className="p-3.5 text-right text-emerald-400 font-bold font-mono">₹{(sc.totalPaid / 100000).toFixed(2)}L</td>
                      <td className="p-3.5 text-right font-mono">
                        {sc.outstanding > 0 ? (
                          <span className="text-rose-400 font-bold">₹{(sc.outstanding / 100000).toFixed(2)}L</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Clear</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: PROCUREMENT & SOURCING ────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/25">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Procurement Economics &amp; Sourcing COGS</h3>
              <p className="text-xs text-white/50">Material production costs, unit economics &amp; wholesale margins</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3.5 py-1 rounded-full uppercase tracking-wider font-mono">
            Fabricated Formula: 52% Sourcing COGS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <span className="text-xs text-white/50 font-medium">Estimated Sourcing COGS</span>
            <div className="text-xl font-black text-white font-mono">₹{(procurement.estCOGS / 100000).toFixed(2)}L</div>
            <p className="text-[10px] font-mono text-amber-300/80">Formula: Total Invoiced × 0.52</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <span className="text-xs text-white/50 font-medium">COGS Allocation Ratio</span>
            <div className="text-xl font-black text-orange-400 font-mono">{procurement.cogsRatio}</div>
            <p className="text-[11px] text-white/40">Fabricated benchmark assumption</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <span className="text-xs text-white/50 font-medium">Blended Gross Margin</span>
            <div className="text-xl font-black text-emerald-400 font-mono">{finance.grossMarginPct}%</div>
            <p className="text-[10px] font-mono text-emerald-400/80">Formula: 100% - 52% COGS</p>
          </div>

          <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-1.5">
            <span className="text-xs text-white/50 font-medium">Key Sourcing Categories</span>
            <div className="text-sm font-bold text-white mt-1">4 Active Product Lines</div>
            <p className="text-[11px] text-white/40 truncate">Hosiery • Apparel • Footwear • Belts</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 7: MARKETING & FIELD OUTREACH ────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/25">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Marketing Outreach &amp; Lead Qualification</h3>
              <p className="text-xs text-white/50">Canvassing campaigns, lead quality segmentation &amp; acquisition efficiency</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3.5 py-1 rounded-full uppercase tracking-wider font-mono">
            Fabricated Benchmarks: CAC &amp; ROI Models
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Funnel Segmentation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Field Lead Qualification Mix (Live DB Visits)</h4>
            <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Hot Leads
                </span>
                <span className="font-black text-white font-mono">{marketing.hotLeads} Schools</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Warm Leads
                </span>
                <span className="font-black text-white font-mono">{marketing.warmLeads} Schools</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-blue-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Cold Leads
                </span>
                <span className="font-black text-white font-mono">{marketing.coldLeads} Schools</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/[0.06]">
                <span className="text-white/50">Total School Visits Logged (Live DB)</span>
                <span className="font-bold text-white font-mono">{marketing.totalVisits}</span>
              </div>
            </div>
          </div>

          {/* Campaign Drives */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Outreach Campaigns (Fabricated Benchmarks)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(marketing.campaigns || []).slice(0, 4).map(c => (
                <div key={c.id} className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-pink-500/15 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold">
                      {c.status || 'Active'}
                    </span>
                    <span className="text-xs font-black text-emerald-400 font-mono">{c.roi || '5.2x ROI (Model)'}</span>
                  </div>
                  <div className="font-bold text-white text-xs leading-snug">{c.name}</div>
                  <div className="text-[11px] text-white/45 font-medium">
                    Target: {c.target} • {c.leads} Leads
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 8: PEOPLE & TEAM PERFORMANCE ─────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/25">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">People, Team Leaderboard &amp; Commission Slabs</h3>
              <p className="text-xs text-white/50">Canvasser sales productivity, commission slab tiers (1%–5%) &amp; headcount</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('team')}
            className="text-xs font-bold text-yellow-300 hover:text-white flex items-center gap-1.5 transition px-3.5 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/25 cursor-pointer"
          >
            <span>Full Leaderboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-black/35 border border-white/[0.06] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white/[0.03] text-white/50 border-b border-white/[0.08]">
                <th className="p-3.5 font-bold">Rep Name</th>
                <th className="p-3.5 font-bold">Role Title</th>
                <th className="p-3.5 font-bold text-center">Visits</th>
                <th className="p-3.5 font-bold text-center">Won</th>
                <th className="p-3.5 font-bold text-right">Billed Invoiced</th>
                <th className="p-3.5 font-bold text-center">Commission Slab</th>
                <th className="p-3.5 font-bold text-right">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {people.canvasserRoster.map((r, idx) => (
                <tr key={r.id} className="hover:bg-white/[0.03] transition">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                      idx === 0 ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" :
                      idx === 1 ? "bg-slate-300 text-black" :
                      idx === 2 ? "bg-amber-700 text-white" :
                      "bg-white/10 text-white/70"
                    )}>
                      {idx + 1}
                    </span>
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3.5 text-white/50">{r.roleTitle}</td>
                  <td className="p-3.5 text-center text-white font-bold font-mono">{r.visits}</td>
                  <td className="p-3.5 text-center text-emerald-400 font-bold font-mono">{r.won}</td>
                  <td className="p-3.5 text-right font-black text-amber-400 font-mono">₹{(r.invoiced / 100000).toFixed(2)}L</td>
                  <td className="p-3.5 text-center">
                    <span className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {r.rate}% Slab
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-black text-white font-mono">{r.commissionFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 9: MANAGEMENT, CEO DECISIONS & ALERTS ────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Management Oversight, Decisions &amp; Action Alerts</h3>
              <p className="text-xs text-white/50">Pending CEO governance queue, overdue invoice escalations &amp; priorities</p>
            </div>
          </div>
          <button
            onClick={onOpenApprovals}
            className="px-4 py-2 bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>{management.pendingApprovalsCount} Approvals Pending</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CEO Decision Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Pending User &amp; School Approvals</h4>
            <div className="space-y-2.5">
              {management.pendingApprovals.length === 0 ? (
                <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl text-xs text-white/40 text-center">
                  No pending governance requests.
                </div>
              ) : (
                management.pendingApprovals.map(app => (
                  <div key={app.id} className="bg-black/35 border border-amber-400/20 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{app.title || app.action_type || 'User Action Authorization'}</div>
                      <div className="text-[10px] text-white/40 mt-0.5 font-mono">ID: {app.id} • Status: PENDING</div>
                    </div>
                    <button
                      onClick={onOpenApprovals}
                      className="px-3.5 py-1.5 bg-amber-400 text-black font-black text-[10px] rounded-xl hover:bg-amber-300 transition cursor-pointer shadow-md shadow-amber-400/20"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overdue Debt Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Critical Overdue Invoices Requiring Escalation</h4>
            <div className="space-y-2.5">
              {management.overdueInvoices.length === 0 ? (
                <div className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl text-xs text-white/40 text-center">
                  No critical overdue debts at this time.
                </div>
              ) : (
                management.overdueInvoices.map(inv => (
                  <div key={inv.id} className="bg-black/35 border border-rose-500/25 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{inv.school_name}</div>
                      <div className="text-[10px] text-rose-300 mt-0.5 font-mono">Due Date: {inv.due_date} • Rep: {inv.canvasser_name}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-rose-400 font-mono">
                        ₹{((inv.pending_balance !== undefined ? inv.pending_balance : inv.outstanding_balance) / 100000).toFixed(2)}L
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 10: REPORTING & MONTHLY MIS TRENDS ───────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-2xl hover:border-amber-400/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Reporting, Monthly MIS Trends &amp; Velocity</h3>
              <p className="text-xs text-white/50">Monthly billing vs cash collection trajectories &amp; longitudinal trends</p>
            </div>
          </div>
          <button
            onClick={handleExportMIS}
            className="px-3.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MIS Report</span>
          </button>
        </div>

        {/* Monthly Trend Visualizer */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Monthly Performance (Billed Sales vs Collections)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {reporting.monthlyTrend.map(m => (
              <div key={m.month} className="bg-black/35 border border-white/[0.06] p-4 rounded-2xl space-y-2 text-center hover:border-amber-400/30 transition">
                <div className="text-xs font-black text-amber-400 font-mono">{m.month} 2026</div>
                <div className="space-y-1.5">
                  <div className="text-[10px] text-white/50">
                    Billed: <strong className="text-white font-mono">₹{(m.billed / 100000).toFixed(2)}L</strong>
                  </div>
                  <div className="text-[10px] text-white/50">
                    Cash: <strong className="text-emerald-400 font-mono">₹{(m.collected / 100000).toFixed(2)}L</strong>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono pt-1 border-t border-white/[0.06]">
                    {m.visits || 0} Visits Logged
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
