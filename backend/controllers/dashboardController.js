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

export function getDashboardStats(req, res) {
  try {
    const visits = db.prepare('SELECT * FROM visits').all();

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

export function getCanvasserLeaderboard(req, res) {
  try {
    const visits = db.prepare('SELECT * FROM visits').all();
    const invoices = db.prepare('SELECT * FROM invoices').all();
    const canvassers = db.prepare("SELECT * FROM users WHERE role IN ('canvasser', 'cvs') AND status != 'INACTIVE'").all();

    const leaderboard = canvassers.map(c => {
      const cVisits = visits.filter(v => v.canvasser_id === c.id);
      const cWon = cVisits.filter(v => v.outcome_status === 'Won').length;
      const cHot = cVisits.filter(v => v.interest_level === 'Hot').length;
      const cInvoices = invoices.filter(i => i.canvasser_id === c.id);
      const totalInvoiced = cInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      const totalCollected = cInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
      const slabInfo = calculateCommissionSlab(totalInvoiced);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        roleTitle: c.role_title || 'Field Sales Executive',
        totalVisits: cVisits.length,
        wonOrders: cWon,
        hotLeads: cHot,
        totalInvoiced,
        totalCollected,
        invoicesCount: cInvoices.length,
        formattedInvoiced: `₹${(totalInvoiced / 100000).toFixed(2)}L`,
        formattedInvoicedFull: `₹${totalInvoiced.toLocaleString('en-IN')}`,
        commissionRate: slabInfo.rate,
        commissionTier: slabInfo.tier,
        slabLabel: slabInfo.slabLabel,
        commissionEarned: slabInfo.commission,
        formattedCommission: slabInfo.formattedCommission,
        amountToNextTier: slabInfo.amountToNextTier,
        progressPercent: slabInfo.progressPercent,
        nextTarget: slabInfo.nextTarget
      };
    });

    leaderboard.sort((a, b) => b.totalInvoiced - a.totalInvoiced || b.totalVisits - a.totalVisits);

    const ranked = leaderboard.map((item, idx) => {
      let badge = '⚡ Field Executive';
      if (idx === 0) badge = '🏆 #1 Top Closer';
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
