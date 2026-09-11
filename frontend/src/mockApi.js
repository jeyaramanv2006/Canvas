import { isAdmin, isCanvasser, getRoleConfig } from './lib/rbac';
import { api, setToken, getToken, BASE_URL } from './api/client';

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

export function formatUsername(name, role) {
  const cleanName = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const rawRole = (role || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const roleMap = {
    'canvasser': 'cvs',
    'cvs': 'cvs',
    'field': 'cvs',
    'admin_exec': 'admin',
    'adminexec': 'admin',
    'admin': 'admin',
    'ceo': 'ceo',
    'cfo': 'cfo',
    'cco': 'cco'
  };

  const cleanRole = roleMap[rawRole] || rawRole;
  return `${cleanName}@${cleanRole}`;
}

export const mockApi = {
  // ── Authentication ─────────────────────────────────────────────────────────
  async login(identifier, password) {
    const res = await api.post('/login', {
      username: identifier,
      password: password
    });

    if (res.token) {
      setToken(res.token);
    }

    return res;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.user;
  },

  async resetPassword(newPassword) {
    return await api.post('/auth/reset-password', {
      new_password: newPassword
    });
  },

  async resetUserPassword(userId, newPassword) {
    return await api.post('/auth/reset-password', {
      new_password: newPassword
    });
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUsers() {
    return await api.get('/users');
  },

  async createUser(userData) {
    return await api.post('/users', userData);
  },

  async updateUserRole(userId, newRole, newRoleTitle) {
    return await api.put(`/users/${userId}/role`, {
      new_role: newRole,
      new_role_title: newRoleTitle
    });
  },

  async deleteUser(userId) {
    return await api.delete(`/users/${userId}`);
  },

  async pauseUser(userId) {
    return await api.post(`/users/${userId}/pause`, {});
  },

  async resumeUser(userId) {
    return await api.post(`/users/${userId}/resume`, {});
  },

  async triggerPasswordReset(userId) {
    return await api.post(`/users/${userId}/reset-password`, {});
  },

  // ── Approvals (CEO) ────────────────────────────────────────────────────────
  async getPendingApprovals() {
    return await api.get('/approvals');
  },

  async decideApproval(actionId, decision, notes = '') {
    return await api.post(`/approvals/${actionId}/decide`, {
      decision,
      notes
    });
  },

  // ── Visits ─────────────────────────────────────────────────────────────────
  async getVisits(filters = {}) {
    const query = new URLSearchParams();
    if (filters.search) query.append('search', filters.search);
    if (filters.district && filters.district !== 'all') query.append('district', filters.district);
    if (filters.interest_level && filters.interest_level !== 'all') query.append('interest_level', filters.interest_level);
    if (filters.outcome_status && filters.outcome_status !== 'all') query.append('outcome_status', filters.outcome_status);
    if (filters.canvasser_id) query.append('canvasser_id', filters.canvasser_id);

    const queryString = query.toString();
    return await api.get(`/visits${queryString ? `?${queryString}` : ''}`);
  },

  async getVisitById(id) {
    return await api.get(`/visits/${id}`);
  },

  async createVisit(visitData) {
    return await api.post('/visits', visitData);
  },

  async addVisit(visitData, canvasserId, canvasserName) {
    const payload = {
      ...visitData,
      canvasser_id: canvasserId || visitData.canvasser_id,
      canvasser_name: canvasserName || visitData.canvasser_name
    };
    return await api.post('/visits', payload);
  },

  async updateVisit(id, updateData) {
    return await api.put(`/visits/${id}`, updateData);
  },

  async deleteVisit(id) {
    return await api.delete(`/visits/${id}`);
  },

  async getSchoolHistory(schoolName, district) {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    return await api.get(`/visits/school/${encodeURIComponent(schoolName)}${query}`);
  },

  // ── Master Schools Catalog ─────────────────────────────────────────────────
  async getMasterSchools(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.district && params.district !== 'all') query.append('district', params.district);
    if (params.zone && params.zone !== 'all') query.append('zone', params.zone);
    if (params.board && params.board !== 'all') query.append('board', params.board);
    if (params.limit) query.append('limit', params.limit);
    if (params.page) query.append('page', params.page);

    const qs = query.toString();
    return await api.get(`/master-schools${qs ? `?${qs}` : ''}`);
  },

  async getAllMasterSchools(params = {}) {
    const res = await this.getMasterSchools({ ...params, limit: 'all' });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.schools)) return res.schools;
    return [];
  },

  async getMasterSchoolById(id) {
    return await api.get(`/master-schools/${id}`);
  },

  async getSchoolDistricts() {
    return await api.get('/master-schools/districts');
  },

  async createMasterSchool(schoolData) {
    return await api.post('/master-schools', schoolData);
  },

  async updateMasterSchool(id, schoolData) {
    return await api.put(`/master-schools/${id}`, schoolData);
  },

  async deleteMasterSchool(id) {
    return await api.delete(`/master-schools/${id}`);
  },

  async exportMasterSchoolsCSV() {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BASE_URL}/master-schools/export`, { headers });
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      console.warn("Server CSV export failed, falling back to client CSV generation", e);
    }

    const schools = await this.getAllMasterSchools();
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const headers = ['ID', 'School Name', 'District', 'Block or Cluster', 'Zone', 'Board', 'Area', 'Student Strength', 'Contact Person', 'Phone', 'Priority', 'Status'];
    const rows = [headers.map(escapeCsv).join(',')];
    for (const s of (schools || [])) {
      rows.push([
        escapeCsv(s.id),
        escapeCsv(s.school_name),
        escapeCsv(s.district),
        escapeCsv(s.block_or_cluster),
        escapeCsv(s.zone),
        escapeCsv(s.board),
        escapeCsv(s.area),
        escapeCsv(s.student_strength || '-'),
        escapeCsv(s.contact_person || '-'),
        escapeCsv(s.phone || '-'),
        escapeCsv(s.priority || 'Medium'),
        escapeCsv(s.status || 'ACTIVE')
      ].join(','));
    }
    return rows.join('\r\n');
  },

  // ── Products ───────────────────────────────────────────────────────────────
  async getProducts() {
    return await api.get('/products');
  },

  async addProduct(productData) {
    return await api.post('/products', productData);
  },

  async updateProduct(id, productData) {
    return await api.put(`/products/${id}`, productData);
  },

  async deleteProduct(id) {
    return await api.delete(`/products/${id}`);
  },

  // ── Quotations ─────────────────────────────────────────────────────────────
  async getQuotations() {
    const res = await api.get('/quotations');
    const list = Array.isArray(res) ? res : (res?.quotations || []);
    return list.map(q => ({
      ...q,
      date: q.date || (q.created_at ? q.created_at.split('T')[0] : ''),
      grand_total: Number(q.grand_total || 0),
      items: typeof q.items === 'string' ? JSON.parse(q.items || '[]') : (q.items || [])
    }));
  },

  async createQuotation(quoteData) {
    return await api.post('/quotations', quoteData);
  },

  async addQuotation(quoteData, canvasserId, canvasserName) {
    const payload = {
      ...quoteData,
      canvasser_id: canvasserId || quoteData.canvasser_id,
      canvasser_name: canvasserName || quoteData.canvasser_name
    };
    return await this.createQuotation(payload);
  },

  // ── Invoices & Payments ────────────────────────────────────────────────────
  async getInvoices() {
    const res = await api.get('/invoices');
    const list = Array.isArray(res) ? res : (res?.invoices || []);
    return list.map(inv => {
      const grandTotal = Number(inv.grand_total || 0);
      const paidAmount = Number(inv.paid_amount || 0);
      const outstanding = inv.outstanding_balance !== undefined ? Number(inv.outstanding_balance) : Math.max(0, grandTotal - paidAmount);
      const status = inv.payment_status || inv.status || (outstanding === 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid');
      return {
        ...inv,
        status: status === 'Fully Paid' ? 'Paid' : status,
        payment_status: inv.payment_status || status,
        grand_total: grandTotal,
        paid_amount: paidAmount,
        outstanding_balance: outstanding,
        pending_balance: outstanding,
        due_date: inv.due_date || '',
        items: typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : (inv.items || [])
      };
    });
  },

  async createInvoice(invoiceData) {
    return await api.post('/invoices', invoiceData);
  },

  async addInvoice(invoiceData, canvasserId, canvasserName) {
    const payload = {
      ...invoiceData,
      canvasser_id: canvasserId || invoiceData.canvasser_id,
      canvasser_name: canvasserName || invoiceData.canvasser_name
    };
    return await this.createInvoice(payload);
  },

  async recordPayment(invoiceId, paymentData) {
    const payload = {
      amount: Number(paymentData.amount || 0),
      payment_method: paymentData.payment_method || paymentData.mode || 'Bank Transfer / NEFT',
      reference_number: paymentData.reference_number || paymentData.reference_id || '',
      notes: paymentData.notes || ''
    };
    return await api.post(`/invoices/${invoiceId}/payment`, payload);
  },

  async getPayments() {
    const res = await api.get('/payments');
    const list = Array.isArray(res) ? res : (res?.payments || []);
    return list.map(p => ({
      ...p,
      amount: Number(p.amount || 0),
      mode: p.payment_method || p.mode || 'Bank Transfer',
      payment_method: p.payment_method || p.mode || 'Bank Transfer',
      reference_id: p.reference_number || p.reference_id || '-',
      reference_number: p.reference_number || p.reference_id || '-',
      date: p.date || (p.recorded_at ? p.recorded_at.split('T')[0] : '')
    }));
  },

  // ── Leaderboard & Dashboards ───────────────────────────────────────────────
  async getCanvasserLeaderboard(params = {}) {
    const query = new URLSearchParams();
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.order) query.append('order', params.order);
    const qs = query.toString();

    const rankings = await api.get(`/leaderboard${qs ? `?${qs}` : ''}`);

    const safeRankings = Array.isArray(rankings) ? rankings : (rankings?.rankings || []);
    const teamTotalInvoiced = safeRankings.reduce((sum, c) => sum + (Number(c.totalInvoiced) || 0), 0);
    const teamTotalWon = safeRankings.reduce((sum, c) => sum + (Number(c.wonOrders || c.invoicesConverted) || 0), 0);
    const teamTotalVisits = safeRankings.reduce((sum, c) => sum + (Number(c.totalVisits || c.schoolsCanvassed) || 0), 0);
    const teamTotalPay = safeRankings.reduce((sum, c) => sum + (Number(c.commissionEarned || c.payEarned) || 0), 0);
    const teamConversionRate = teamTotalVisits > 0 ? Math.round((teamTotalWon / teamTotalVisits) * 100) : 0;

    const teamStats = {
      teamTotalInvoiced,
      teamTotalWon,
      teamTotalVisits,
      teamTotalPay,
      teamConversionRate,
      activeCanvassersCount: safeRankings.length
    };

    return {
      rankings: safeRankings,
      teamStats
    };
  },

  async getDashboardStats() {
    return await api.get('/dashboard/stats');
  },

  async getFinancialStats(userId, role, currentUser) {
    try {
      const invoices = (await this.getInvoices()) || [];
      const userInvoices = ['canvasser', 'cvs'].includes(role) && userId
        ? invoices.filter(i => i.canvasser_id === Number(userId))
        : invoices;

      const totalInvoiced = userInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      const totalCollected = userInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
      const totalPending = userInvoices.reduce((sum, i) => sum + (Number(i.outstanding_balance) || 0), 0);
      const overdueCount = userInvoices.filter(i => Number(i.outstanding_balance) > 0 && i.due_date && new Date(i.due_date) < new Date()).length;

      return {
        totalInvoiced,
        totalCollected,
        totalPending,
        overdueCount,
        invoicesCount: userInvoices.length
      };
    } catch (e) {
      return { totalInvoiced: 0, totalCollected: 0, totalPending: 0, overdueCount: 0, invoicesCount: 0 };
    }
  },

  async getRoleSpecificKPIs(currentUser) {
    try {
      const role = currentUser?.role || 'cvs';
      const visits = (await this.getVisits()) || [];
      const invoices = (await this.getInvoices()) || [];

      const userVisits = ['canvasser', 'cvs'].includes(role)
        ? visits.filter(v => v.canvasser_id === currentUser.id)
        : visits;

      const userInvoices = ['canvasser', 'cvs'].includes(role)
        ? invoices.filter(i => i.canvasser_id === currentUser.id)
        : invoices;

      const totalVisits = userVisits.length;
      const hotLeads = userVisits.filter(v => v.interest_level === 'Hot').length;
      const ordersWon = userVisits.filter(v => v.outcome_status === 'Won').length;
      const totalInvoiced = userInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      const totalCollected = userInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);

      const slab = calculateCommissionSlab(totalInvoiced);

      if (['canvasser', 'cvs'].includes(role)) {
        return [
          {
            id: 'kpi_visits',
            title: 'Schools Canvassed',
            value: totalVisits,
            change: `${ordersWon} Won`,
            trend: 'up',
            subtext: `${hotLeads} Hot Leads currently active`,
            status: 'success'
          },
          {
            id: 'kpi_invoiced',
            title: 'Total Invoiced',
            value: `₹${(totalInvoiced / 100000).toFixed(2)}L`,
            change: `${userInvoices.length} Invoices`,
            trend: 'up',
            subtext: `Target: ₹10.00L (${totalInvoiced > 0 ? Math.round((totalInvoiced / 1000000) * 100) : 0}% Achieved)`,
            status: 'success'
          },
          {
            id: 'kpi_pay',
            title: 'Earned Commission Pay',
            value: slab.formattedCommission,
            change: slab.slabLabel,
            trend: 'up',
            subtext: slab.nextTarget ? `₹${(slab.amountToNextTier / 100000).toFixed(1)}L to next tier` : 'Top tier reached',
            status: 'accent'
          },
          {
            id: 'kpi_collections',
            title: 'Collections Received',
            value: `₹${(totalCollected / 100000).toFixed(2)}L`,
            change: `${totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}% Cleared`,
            trend: 'up',
            subtext: `₹${((totalInvoiced - totalCollected) / 100000).toFixed(2)}L Outstanding Balance`,
            status: 'warning'
          }
        ];
      }

      return [
        {
          id: 'kpi_org_rev',
          title: 'Total Revenue Invoiced',
          value: `₹${(totalInvoiced / 100000).toFixed(2)}L`,
          change: '+14.2%',
          trend: 'up',
          subtext: `${invoices.length} Orders Invoiced across TN`,
          status: 'success'
        },
        {
          id: 'kpi_org_cash',
          title: 'Cash Collected',
          value: `₹${(totalCollected / 100000).toFixed(2)}L`,
          change: `${totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}%`,
          trend: 'up',
          subtext: 'Payment realization rate',
          status: 'success'
        },
        {
          id: 'kpi_org_visits',
          title: 'Central Field Visits',
          value: visits.length,
          change: `${ordersWon} Won`,
          trend: 'up',
          subtext: `Institutional coverage across 38 districts`,
          status: 'accent'
        }
      ];
    } catch (e) {
      return [];
    }
  },

  async getCEOExecutiveMIS() {
    return await api.get('/ceo/executive-mis');
  },

  async getCFOAnalytics() {
    return await api.get('/cfo/analytics');
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.visit_id) query.append('visit_id', params.visit_id);
    if (params.actor_id) query.append('actor_id', params.actor_id);
    if (params.action) query.append('action', params.action);
    const qs = query.toString();
    return await api.get(`/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // ── CSV Export ─────────────────────────────────────────────────────────────
  exportToCSV(visits = []) {
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "ID",
      "Canvasser",
      "School Name",
      "District",
      "Institution Type",
      "Contact Person",
      "Phone",
      "Student Strength",
      "Product Interests",
      "Interest Level",
      "Outcome Status",
      "Follow-up Date",
      "Notes",
      "Created At"
    ];

    const rows = (visits || []).map(v => [
      v.id,
      escapeCSV(v.canvasser_name || "Canvasser " + v.canvasser_id),
      escapeCSV(v.school_name),
      escapeCSV(v.district),
      escapeCSV(v.institution_type),
      escapeCSV(v.contact_person),
      escapeCSV(v.phone),
      v.student_strength || "",
      escapeCSV(Array.isArray(v.product_interests) ? v.product_interests.join(", ") : v.product_interests),
      escapeCSV(v.interest_level),
      escapeCSV(v.outcome_status),
      escapeCSV(v.follow_up_date),
      escapeCSV(v.notes),
      escapeCSV(v.created_at ? new Date(v.created_at).toLocaleDateString() : "")
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Murugan_Canvass_Visits_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async getInventoryStock() {
    const products = (await this.getProducts()) || [];
    return products.map(p => ({
      ...p,
      stock_qty: 500,
      reorder_level: 100,
      status: 'In Stock'
    }));
  },

  async getMarketingCollateral() {
    return [
      { id: 1, title: 'Annual Uniform & Hosiery Catalog 2026-27', type: 'Brochure PDF', size: '4.2 MB' },
      { id: 2, title: 'Fabric Quality Test & Durability Certification', type: 'Certificate PDF', size: '1.8 MB' },
      { id: 3, title: 'Custom Embroidered Sock Sample Specs Sheet', type: 'Product Sheet', size: '850 KB' }
    ];
  }
};

export default mockApi;
