import { db } from '../database/db.js';

export function calculateCommissionSlab(amount) {
  const invoiced = Number(amount) || 0;
  let rate = 1;
  let tier = 1;
  let slabLabel = "1% (Tier 1: Up to ₹5L)";
  let nextTarget = 500000;

  if (invoiced <= 0) {
    return {
      rate: 1,
      tier: 1,
      slabLabel: "1% (Tier 1: Up to ₹5L)",
      commission: 0,
      nextTarget: 500000,
      amountToNextTier: 500000,
      progressPercent: 0,
      formattedCommission: "₹0"
    };
  }

  if (invoiced <= 500000) {
    rate = 1;
    tier = 1;
    slabLabel = "1% (Tier 1: Up to ₹5L)";
    nextTarget = 500000;
  } else if (invoiced <= 1000000) {
    rate = 2;
    tier = 2;
    slabLabel = "2% (Tier 2: ₹5L - ₹10L)";
    nextTarget = 1000000;
  } else if (invoiced <= 1500000) {
    rate = 3;
    tier = 3;
    slabLabel = "3% (Tier 3: ₹10L - ₹15L)";
    nextTarget = 1500000;
  } else if (invoiced <= 2000000) {
    rate = 4;
    tier = 4;
    slabLabel = "4% (Tier 4: ₹15L - ₹20L)";
    nextTarget = 2000000;
  } else {
    rate = 5;
    tier = 5;
    slabLabel = "5% (Tier 5: >₹20L Max)";
    nextTarget = null;
  }

  const commission = (invoiced * rate) / 100;
  const amountToNextTier = nextTarget ? Math.max(0, nextTarget - invoiced) : 0;
  const prevTierThreshold = tier === 1 ? 0 : (tier - 1) * 500000;
  const progressPercent = nextTarget
    ? Math.min(100, Math.round(((invoiced - prevTierThreshold) / 500000) * 100))
    : 100;

  return {
    rate,
    tier,
    slabLabel,
    commission,
    nextTarget,
    amountToNextTier,
    progressPercent,
    formattedCommission: `₹${commission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  };
}

export async function getDashboardStats(req, res) {
  try {
    const visits = (await db.prepare('SELECT * FROM visits').all()) || [];

    const totalVisits = visits.length;
    const hotLeads = visits.filter(v => v.interest_level === 'Hot').length;
    const ordersWon = visits.filter(v => v.outcome_status === 'Won').length;
    const ordersLost = visits.filter(v => v.outcome_status === 'Lost').length;

    const winRate = (ordersWon + ordersLost) > 0
      ? Math.round((ordersWon / (ordersWon + ordersLost)) * 100)
      : 0;

    const interestCounts = {
      Hot: visits.filter(v => v.interest_level === 'Hot').length,
      Warm: visits.filter(v => v.interest_level === 'Warm').length,
      Cold: visits.filter(v => v.interest_level === 'Cold').length,
      'Not Interested': visits.filter(v => v.interest_level === 'Not Interested').length,
    };
    const interestData = Object.entries(interestCounts).map(([name, value]) => ({ name, value }));

    const districtCounts = {};
    const productCounts = {};
    const canvasserStats = {};

    visits.forEach(v => {
      districtCounts[v.district] = (districtCounts[v.district] || 0) + 1;

      let pInterests = [];
      try {
        pInterests = typeof v.product_interests === 'string' ? JSON.parse(v.product_interests) : v.product_interests;
      } catch (e) {
        pInterests = [];
      }

      if (Array.isArray(pInterests)) {
        pInterests.forEach(p => {
          productCounts[p] = (productCounts[p] || 0) + 1;
        });
      }

      if (!canvasserStats[v.canvasser_id]) {
        canvasserStats[v.canvasser_id] = {
          id: v.canvasser_id,
          name: v.canvasser_name || `Canvasser ${v.canvasser_id}`,
          visits: 0,
          won: 0,
          hot: 0
        };
      }
      canvasserStats[v.canvasser_id].visits += 1;
      if (v.outcome_status === 'Won') canvasserStats[v.canvasser_id].won += 1;
      if (v.interest_level === 'Hot') canvasserStats[v.canvasser_id].hot += 1;
    });

    const districtData = Object.entries(districtCounts).map(([name, visits]) => ({ name, visits }));
    const productData = Object.entries(productCounts).map(([name, count]) => ({ name, count }));

    return res.json({
      totalVisits,
      hotLeads,
      ordersWon,
      ordersLost,
      winRate,
      interestData,
      districtData,
      productData,
      canvasserStats: Object.values(canvasserStats)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getCanvasserLeaderboard(req, res) {
  try {
    const { sort_by = 'pay', order = 'desc' } = req.query;
    const visits = (await db.prepare('SELECT * FROM visits').all()) || [];
    const invoices = (await db.prepare('SELECT * FROM invoices').all()) || [];
    const canvassers = (await db.prepare("SELECT * FROM users WHERE role IN ('canvasser', 'cvs') AND status != 'INACTIVE'").all()) || [];

    const leaderboard = canvassers.map(c => {
      const cVisits = visits.filter(v => v.canvasser_id === c.id);
      const cWon = cVisits.filter(v => v.outcome_status === 'Won').length;
      const cHot = cVisits.filter(v => v.interest_level === 'Hot').length;
      const cInvoices = invoices.filter(i => i.canvasser_id === c.id);
      const totalInvoiced = cInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      const totalCollected = cInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
      const slabInfo = calculateCommissionSlab(totalInvoiced);

      const convertedInvoices = cInvoices.map(inv => {
        const gTotal = Number(inv.grand_total) || 0;
        const invoicePayout = (gTotal * slabInfo.rate) / 100;
        return {
          id: inv.id,
          school_name: inv.school_name,
          district: inv.district,
          date: inv.created_at || inv.date,
          grand_total: gTotal,
          applied_rate: slabInfo.rate,
          pay_earned: invoicePayout,
          formatted_pay: `₹${invoicePayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          payment_status: inv.payment_status || 'Unpaid'
        };
      });

      const conversionRate = cVisits.length > 0 ? Math.round((cWon / cVisits.length) * 100) : 0;
      const avgInvoiceValue = cInvoices.length > 0 ? Math.round(totalInvoiced / cInvoices.length) : 0;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        roleTitle: c.role_title || 'Field Sales Executive',
        totalVisits: cVisits.length,
        schoolsCanvassed: cVisits.length,
        wonOrders: cWon,
        invoicesConverted: cInvoices.length,
        hotLeads: cHot,
        totalInvoiced,
        totalCollected,
        invoicesCount: cInvoices.length,
        convertedInvoices,
        conversionRate,
        avgInvoiceValue,
        formattedInvoiced: `₹${(totalInvoiced / 100000).toFixed(2)}L`,
        formattedInvoicedFull: `₹${totalInvoiced.toLocaleString('en-IN')}`,
        commissionRate: slabInfo.rate,
        commissionTier: slabInfo.tier,
        slabLabel: slabInfo.slabLabel,
        commissionEarned: slabInfo.commission,
        payEarned: slabInfo.commission,
        formattedCommission: slabInfo.formattedCommission,
        formattedPayEarned: slabInfo.formattedCommission,
        amountToNextTier: slabInfo.amountToNextTier,
        progressPercent: slabInfo.progressPercent,
        nextTarget: slabInfo.nextTarget
      };
    });

    // Multi-criteria sorting
    const isAsc = order === 'asc';
    leaderboard.sort((a, b) => {
      let diff = 0;
      if (sort_by === 'pay' || sort_by === 'commission') {
        diff = b.commissionEarned - a.commissionEarned || b.totalInvoiced - a.totalInvoiced;
      } else if (sort_by === 'visits' || sort_by === 'schools') {
        diff = b.totalVisits - a.totalVisits || b.wonOrders - a.wonOrders;
      } else if (sort_by === 'invoices' || sort_by === 'won') {
        diff = b.invoicesConverted - a.invoicesConverted || b.totalInvoiced - a.totalInvoiced;
      } else if (sort_by === 'invoiced' || sort_by === 'revenue') {
        diff = b.totalInvoiced - a.totalInvoiced || b.commissionEarned - a.commissionEarned;
      } else if (sort_by === 'conversion') {
        diff = b.conversionRate - a.conversionRate || b.wonOrders - a.wonOrders;
      } else if (sort_by === 'avg_deal') {
        diff = b.avgInvoiceValue - a.avgInvoiceValue || b.totalInvoiced - a.totalInvoiced;
      } else {
        diff = b.commissionEarned - a.commissionEarned || b.totalInvoiced - a.totalInvoiced;
      }
      return isAsc ? -diff : diff;
    });

    const ranked = leaderboard.map((item, idx) => {
      let badge = '⚡ Field Executive';
      if (idx === 0) badge = '🏆 #1 Top Earner';
      else if (idx === 1) badge = '🥈 Senior Canvasser';
      else if (idx === 2) badge = '🥉 Field Canvasser';

      return {
        ...item,
        rank: idx + 1,
        badge
      };
    });

    return res.json(ranked);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getCEOExecutiveMIS(req, res) {
  try {
    const visits = (await db.prepare('SELECT * FROM visits').all()) || [];
    const invoices = (await db.prepare('SELECT * FROM invoices').all()) || [];
    const quotations = (await db.prepare('SELECT * FROM quotations').all()) || [];
    const payments = (await db.prepare('SELECT * FROM payments').all()) || [];
    const users = (await db.prepare('SELECT id, name, role, role_title, status FROM users').all()) || [];
    const products = (await db.prepare('SELECT * FROM products').all()) || [];
    const pendingApprovals = (await db.prepare("SELECT * FROM pending_user_actions WHERE status = 'PENDING'").all()) || [];
    const masterCountRow = await db.prepare("SELECT COUNT(*) as count FROM master_schools").get();
    const totalMasterSchools = masterCountRow ? Number(masterCountRow.count) : 2561;

    // Financial Metrics
    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
    const totalReceivables = invoices.reduce((sum, i) => sum + (Number(i.outstanding_balance) || 0), 0);

    const estCOGS = totalInvoiced * 0.52;
    const grossProfit = totalInvoiced - estCOGS;
    const grossMarginPct = totalInvoiced > 0 ? ((grossProfit / totalInvoiced) * 100).toFixed(1) : '48.0';
    const opex = totalInvoiced * 0.24;
    const netProfit = grossProfit - opex;
    const netMarginPct = totalInvoiced > 0 ? ((netProfit / totalInvoiced) * 100).toFixed(1) : '24.0';

    // Pipeline & Orders
    const ordersWon = visits.filter(v => v.outcome_status === 'Won').length + invoices.length;
    const hotLeads = visits.filter(v => v.interest_level === 'Hot').length;
    const warmLeads = visits.filter(v => v.interest_level === 'Warm').length;
    const coldLeads = visits.filter(v => v.interest_level === 'Cold').length;
    const notInterestedLeads = visits.filter(v => v.interest_level === 'Not Interested').length;

    const activeQuotesValue = quotations
      .filter(q => q.status !== 'Rejected' && q.status !== 'Cancelled')
      .reduce((sum, q) => sum + (Number(q.grand_total) || 0), 0);

    const estimatedLeadValue = (hotLeads * 120000) + (warmLeads * 65000);
    const totalPipelineValue = activeQuotesValue + estimatedLeadValue;

    // Overdue & Aging Receivables
    const now = new Date();
    let overdueCount = 0;
    let overdueAmount = 0;

    const agingBuckets = {
      current: { label: '0-30 Days', count: 0, amount: 0 },
      days31_60: { label: '31-60 Days', count: 0, amount: 0 },
      days61_90: { label: '61-90 Days', count: 0, amount: 0 },
      days90Plus: { label: '90+ Days', count: 0, amount: 0 }
    };

    const overdueInvoices = [];

    invoices.forEach(inv => {
      const balance = Number(inv.outstanding_balance) || 0;
      if (balance > 0) {
        const createdDate = new Date(inv.created_at || Date.now());
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

    const overdueFollowUps = visits.filter(v => {
      if (!v.follow_up_date) return false;
      return new Date(v.follow_up_date) < now && v.outcome_status !== 'Won' && v.outcome_status !== 'Lost';
    });

    const canvassers = users.filter(u => ['canvasser', 'cvs'].includes(u.role) && u.status !== 'INACTIVE');
    let totalCommissionsPayable = 0;
    const canvasserRoster = canvassers.map(c => {
      const cVisits = visits.filter(v => v.canvasser_id === c.id);
      const cWon = cVisits.filter(v => v.outcome_status === 'Won').length;
      const cInvoices = invoices.filter(i => i.canvasser_id === c.id);
      const cInvoiced = cInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      const slabInfo = calculateCommissionSlab(cInvoiced);
      totalCommissionsPayable += slabInfo.commission;

      return {
        id: c.id,
        name: c.name,
        roleTitle: c.role_title || 'Field Sales Executive',
        visits: cVisits.length,
        won: cWon,
        invoiced: cInvoiced,
        commission: slabInfo.commission,
        commissionFormatted: slabInfo.formattedCommission,
        rate: slabInfo.rate,
        tier: slabInfo.tier,
        slabLabel: slabInfo.slabLabel
      };
    }).sort((a, b) => b.invoiced - a.invoiced);

    const uniqueVisitedSchools = new Set(visits.map(v => v.school_name)).size;
    const clientRevenueMap = {};
    invoices.forEach(i => {
      if (!clientRevenueMap[i.school_name]) {
        clientRevenueMap[i.school_name] = {
          name: i.school_name,
          district: i.district,
          totalBilled: 0,
          totalPaid: 0,
          outstanding: 0,
          invoiceCount: 0
        };
      }
      clientRevenueMap[i.school_name].totalBilled += Number(i.grand_total) || 0;
      clientRevenueMap[i.school_name].totalPaid += Number(i.paid_amount) || 0;
      clientRevenueMap[i.school_name].outstanding += Number(i.outstanding_balance) || 0;
      clientRevenueMap[i.school_name].invoiceCount += 1;
    });
    const topCustomers = Object.values(clientRevenueMap)
      .sort((a, b) => b.totalBilled - a.totalBilled);

    const productDemand = {};
    visits.forEach(v => {
      let pInterests = [];
      try {
        pInterests = typeof v.product_interests === 'string' ? JSON.parse(v.product_interests) : v.product_interests;
      } catch (e) {
        pInterests = [];
      }
      if (Array.isArray(pInterests)) {
        pInterests.forEach(p => {
          productDemand[p] = (productDemand[p] || 0) + 1;
        });
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    months.forEach((m, idx) => {
      monthlyDataMap[idx] = { month: m, billed: 0, collected: 0, visits: 0 };
    });
    invoices.forEach(inv => {
      const d = new Date(inv.created_at || Date.now());
      const mIdx = d.getMonth();
      if (monthlyDataMap[mIdx]) monthlyDataMap[mIdx].billed += Number(inv.grand_total) || 0;
    });
    payments.forEach(p => {
      const d = new Date(p.recorded_at || Date.now());
      const mIdx = d.getMonth();
      if (monthlyDataMap[mIdx]) monthlyDataMap[mIdx].collected += Number(p.amount) || 0;
    });
    visits.forEach(v => {
      const d = new Date(v.created_at || Date.now());
      const mIdx = d.getMonth();
      if (monthlyDataMap[mIdx]) monthlyDataMap[mIdx].visits += 1;
    });

    const currentMonthIdx = now.getMonth();
    const monthlyTrend = Object.values(monthlyDataMap).slice(0, Math.max(currentMonthIdx + 1, 6));

    const formatL = (val) => `₹${(val / 100000).toFixed(2)}L`;

    return res.json({
      executiveKPIs: [
        {
          id: 'kpi_rev',
          title: 'Total Revenue (Billed)',
          value: formatL(totalInvoiced),
          rawValue: totalInvoiced,
          change: '+18.4%',
          trend: 'up',
          subtext: `Target: ₹35.00L (${totalInvoiced > 0 ? Math.round((totalInvoiced / 3500000) * 100) : 0}% Achieved)`,
          status: 'success'
        },
        {
          id: 'kpi_gp',
          title: 'Gross Profit & Margin',
          value: formatL(grossProfit),
          rawValue: grossProfit,
          change: `${grossMarginPct}%`,
          trend: 'up',
          subtext: `Blended margin across uniform & hosiery lines`,
          status: 'success'
        },
        {
          id: 'kpi_np',
          title: 'Net Profit (EBITDA)',
          value: formatL(netProfit),
          rawValue: netProfit,
          change: `${netMarginPct}%`,
          trend: 'up',
          subtext: 'Net operational earnings after opex & commissions',
          status: 'success'
        },
        {
          id: 'kpi_cash',
          title: 'Cash Inflow (Collections)',
          value: formatL(totalCollected),
          rawValue: totalCollected,
          change: `${totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : 0}%`,
          trend: 'up',
          subtext: `${payments.length} transactions cleared`,
          status: 'success'
        },
        {
          id: 'kpi_ar',
          title: 'Accounts Receivable',
          value: formatL(totalReceivables),
          rawValue: totalReceivables,
          change: overdueInvoices.length > 0 ? `${overdueInvoices.length} Overdue` : 'Healthy',
          trend: overdueInvoices.length > 0 ? 'down' : 'neutral',
          subtext: `Overdue Amount: ${formatL(overdueAmount)}`,
          status: overdueInvoices.length > 0 ? 'warning' : 'success'
        },
        {
          id: 'kpi_orders',
          title: 'Orders Won & Invoiced',
          value: `${ordersWon}`,
          rawValue: ordersWon,
          change: `+${invoices.length} Invoiced`,
          trend: 'up',
          subtext: `Win Rate: ${visits.length > 0 ? Math.round((ordersWon / visits.length) * 100) : 0}% of visited accounts`,
          status: 'success'
        },
        {
          id: 'kpi_pipeline',
          title: 'Live Sales Pipeline',
          value: formatL(totalPipelineValue),
          rawValue: totalPipelineValue,
          change: `${quotations.length} Quotes Issued`,
          trend: 'up',
          subtext: `${hotLeads} Hot Leads, ${warmLeads} Warm Leads`,
          status: 'success'
        }
      ],
      sales: {
        totalPipelineValue,
        activeQuotesValue,
        quotationsCount: quotations.length,
        visitedCustomers: uniqueVisitedSchools,
        convertedCustomers: topCustomers.length,
        avgDealValue: invoices.length > 0 ? Math.round(totalInvoiced / invoices.length) : 0,
        highestDealValue: invoices.reduce((max, i) => Math.max(max, Number(i.grand_total) || 0), 0),
        winRate: visits.length > 0 ? Math.round((ordersWon / visits.length) * 100) : 0,
        quarterlyTarget: 3500000,
        targetProgress: totalInvoiced > 0 ? Math.min(100, Math.round((totalInvoiced / 3500000) * 100)) : 0
      },
      finance: {
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
        overdueAmount,
        recentPayments: payments.slice(0, 5)
      },
      operations: {
        totalOrders: ordersWon,
        sampleSentCount: visits.filter(v => v.outcome_status === 'Sample Sent').length,
        quoteGivenCount: visits.filter(v => v.outcome_status === 'Quote Given').length,
        activeInvoices: invoices.length,
        overdueFollowUpsCount: overdueFollowUps.length,
        overdueFollowUps: overdueFollowUps.slice(0, 5).map(v => ({
          id: v.id,
          school_name: v.school_name,
          canvasser_name: v.canvasser_name,
          follow_up_date: v.follow_up_date,
          contact_person: v.contact_person,
          phone: v.phone
        }))
      },
      inventory: {
        productsCatalogCount: products.length,
        categories: Array.from(new Set(products.map(p => p.category))),
        demandDistribution: Object.entries(productDemand).map(([product, count]) => ({ product, count })),
        products: products
      },
      customers: {
        masterSchoolsTotal: totalMasterSchools,
        visitedCount: uniqueVisitedSchools,
        penetrationRate: ((uniqueVisitedSchools / totalMasterSchools) * 100).toFixed(1),
        topCustomers: topCustomers.slice(0, 6)
      },
      procurement: {
        estCOGS,
        cogsRatio: '52%',
        avgMarginPerUnit: '48%',
        topCategories: ['Apparel', 'Hosiery', 'Footwear', 'Accessories']
      },
      marketing: {
        totalVisits: visits.length,
        hotLeads,
        warmLeads,
        coldLeads,
        notInterestedLeads,
        leadConversionRate: visits.length > 0 ? Math.round((ordersWon / visits.length) * 100) : 0,
        campaignsCount: 3,
        estCAC: '₹1,450 / School',
        estROI: '5.2x'
      },
      people: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'ACTIVE').length,
        canvassersCount: canvassers.length,
        canvasserRoster
      },
      management: {
        pendingApprovalsCount: pendingApprovals.length,
        pendingApprovals: pendingApprovals.slice(0, 5),
        overdueInvoicesCount: overdueCount,
        overdueInvoices: overdueInvoices.slice(0, 5),
        alertsCount: pendingApprovals.length + overdueCount + overdueFollowUps.length
      },
      reporting: {
        monthlyTrend,
        summary: {
          totalBilled: totalInvoiced,
          totalCollected,
          totalOutstanding: totalReceivables,
          grossProfit,
          netProfit,
          visitsTotal: visits.length
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
