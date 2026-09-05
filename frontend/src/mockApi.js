import { isAdmin, isCanvasser, getRoleConfig } from './lib/rbac';
import { MASTER_SCHOOLS, searchMasterSchoolsLocal, getMasterSchoolById } from './data/masterSchools';

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

const mockUsers = [
  // ── C-Suite ────────────────────────────────────────────────────────────────
  {
    id: 10,
    email: "arjun@murugan.com",
    aliases: ["ceo@murugan.com", "arjun@murugan.com"],
    password: "password",
    name: "Arjun",
    role: "ceo",
    roleTitle: "Chief Executive Officer"
  },
  {
    id: 11,
    email: "priya@murugan.com",
    aliases: ["cfo@murugan.com", "priya@murugan.com"],
    password: "password",
    name: "Priya",
    role: "cfo",
    roleTitle: "Chief Financial Officer"
  },
  {
    id: 12,
    email: "karthik@murugan.com",
    aliases: ["cco@murugan.com", "karthik@murugan.com"],
    password: "password",
    name: "Karthik",
    role: "cco",
    roleTitle: "Chief Commercial Officer"
  },
  // ── Operations ─────────────────────────────────────────────────────────────
  {
    id: 4,
    email: "sudhan@murugan.com",
    aliases: ["manager@murugan.com", "sudhan@murugan.com", "admin@murugan.com"],
    password: "password",
    name: "Sudhan",
    role: "admin_exec",
    roleTitle: "Admin Executive"
  },
  // ── Field Sales ────────────────────────────────────────────────────────────
  {
    id: 1,
    email: "gokul@murugan.com",
    aliases: ["field@murugan.com", "gokul@murugan.com"],
    password: "password",
    name: "Gokul",
    role: "canvasser",
    roleTitle: "Senior Canvasser"
  },
  {
    id: 2,
    email: "murugan@murugan.com",
    aliases: ["field2@murugan.com", "murugan@murugan.com"],
    password: "password",
    name: "Murugan",
    role: "canvasser",
    roleTitle: "Field Sales Lead"
  },
  {
    id: 3,
    email: "suhas@murugan.com",
    aliases: ["field3@murugan.com", "suhas@murugan.com"],
    password: "password",
    name: "Suhas",
    role: "canvasser",
    roleTitle: "Field Canvasser"
  }
];

const mockVisits = [
  {
    id: 1,
    canvasser_id: 1,
    canvasser_name: "Gokul",
    is_from_master_db: true,
    master_school_id: "SCH-CBE-001",
    school_name: "St. John's Higher Secondary School",
    district: "Coimbatore",
    cluster_or_block: "Coimbatore South",
    institution_type: "School",
    contact_person: "Mr. Ramesh (Principal)",
    phone: "9876543210",
    student_strength: 1200,
    product_interests: ["Socks", "Uniforms", "Belts"],
    product_specifications: "Requires 100% combed cotton navy-blue socks with white twin stripes and embroidered crest on buckle belts. Principal showed previous year sample.",
    attachments: [
      { id: "att-1", name: "school_sock_sample.jpg", url: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80", type: "image/jpeg" }
    ],
    interest_level: "Hot",
    outcome_status: "Sample Sent",
    follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    notes: "Very interested in 1200 custom combed-cotton socks and school belts. Sample pack sent yesterday.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    last_edited_by_name: "Sudhan",
    last_edited_by_role: "General Manager",
    last_edited_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    edit_history: [
      {
        id: "EDT-101",
        editor_name: "Gokul",
        editor_role: "Canvasser",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        changes: [
          { field: "Outcome Status", from: "Open", to: "Sample Sent" },
          { field: "Notes", from: "Initial visit done.", to: "Sample pack sent yesterday." }
        ]
      },
      {
        id: "EDT-102",
        editor_name: "Sudhan",
        editor_role: "Admin",
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        changes: [
          { field: "Interest Level", from: "Warm", to: "Hot" }
        ]
      }
    ]
  },
  {
    id: 2,
    canvasser_id: 1,
    canvasser_name: "Gokul",
    school_name: "Vivekananda Arts & Science College",
    district: "Madurai",
    institution_type: "College",
    contact_person: "Mrs. Priya (Admin Officer)",
    phone: "9876543211",
    student_strength: 3500,
    product_interests: ["Bags", "Ties", "Track Pants"],
    interest_level: "Warm",
    outcome_status: "Quote Given",
    follow_up_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    notes: "Quote provided for 800 custom college bags and ties. Follow up with purchasing committee.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_edited_by_name: "Gokul",
    last_edited_by_role: "Canvasser",
    last_edited_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    edit_history: [
      {
        id: "EDT-103",
        editor_name: "Gokul",
        editor_role: "Canvasser",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        changes: [
          { field: "Outcome Status", from: "Sample Sent", to: "Quote Given" }
        ]
      }
    ]
  },
  {
    id: 3,
    canvasser_id: 2,
    canvasser_name: "Murugan",
    school_name: "PSG Public Matriculation School",
    district: "Coimbatore",
    institution_type: "School",
    contact_person: "Dr. Kavin (Correspondent)",
    phone: "9876543212",
    student_strength: 2000,
    product_interests: ["Shoes", "Track Pants", "Socks"],
    interest_level: "Hot",
    outcome_status: "Won",
    follow_up_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    notes: "Deal closed for 2,000 pairs of sports shoes and track pants! Initial advance received.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    last_edited_by_name: "Murugan",
    last_edited_by_role: "Canvasser",
    last_edited_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    edit_history: [
      {
        id: "EDT-104",
        editor_name: "Murugan",
        editor_role: "Canvasser",
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        changes: [
          { field: "Outcome Status", from: "Quote Given", to: "Won" }
        ]
      }
    ]
  },
  {
    id: 4,
    canvasser_id: 2,
    canvasser_name: "Murugan",
    school_name: "Al-Ameen International School",
    district: "Tiruppur",
    institution_type: "School",
    contact_person: "Mr. Farooq (Trustee)",
    phone: "9842156789",
    student_strength: 950,
    product_interests: ["Uniforms", "Belts"],
    interest_level: "Cold",
    outcome_status: "Open",
    follow_up_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    notes: "Currently bound by contract with another vendor until next academic term. Re-visit in December.",
    created_at: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 5,
    canvasser_id: 3,
    canvasser_name: "Suhas",
    school_name: "Holy Cross Girls Higher Secondary",
    district: "Salem",
    institution_type: "School",
    contact_person: "Sister Mary (Headmistress)",
    phone: "9443210987",
    student_strength: 1800,
    product_interests: ["Socks", "Ties", "Shoes"],
    interest_level: "Hot",
    outcome_status: "Sample Sent",
    follow_up_date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
    notes: "Requested physical samples of navy blue ties and white sports socks. Meeting scheduled tomorrow.",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 6,
    canvasser_id: 3,
    canvasser_name: "Suhas",
    school_name: "Vetri Vikas Academy",
    district: "Salem",
    institution_type: "School",
    contact_person: "Mr. Senthil Kumar (Director)",
    phone: "9789012345",
    student_strength: 1400,
    product_interests: ["Uniforms", "Track Pants"],
    interest_level: "Not Interested",
    outcome_status: "Lost",
    follow_up_date: "",
    notes: "Have their own in-house tailoring facility. Closed opportunity for now.",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredVisits = () => {
  const stored = localStorage.getItem('murugan_visits_v3');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored visits", e);
    }
  }
  localStorage.setItem('murugan_visits_v3', JSON.stringify(mockVisits));
  return mockVisits;
};

const saveStoredVisits = (visits) => {
  localStorage.setItem('murugan_visits_v3', JSON.stringify(visits));
};

export const mockApi = {
  async login(email, password) {
    await delay(350);
    const inputEmail = (email || '').trim().toLowerCase();
    const user = mockUsers.find(u => 
      (u.email.toLowerCase() === inputEmail || (u.aliases && u.aliases.map(a => a.toLowerCase()).includes(inputEmail))) && 
      u.password === password
    );
    if (!user) throw new Error("Invalid email or password");

    return {
      token: "mock-jwt-token-" + user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleTitle: user.roleTitle
      }
    };
  },

  async getUsers() {
    await delay(200);
    return mockUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      roleTitle: u.roleTitle
    }));
  },

  async getVisits(userId, role) {
    await delay(300);
    const visits = getStoredVisits();
    if (isCanvasser({ role }) && userId) {
      return visits.filter(v => v.canvasser_id === userId);
    }
    return visits;
  },

  async addVisit(visitData, userId, userName) {
    await delay(400);
    const visits = getStoredVisits();
    
    const newVisit = {
      is_from_master_db: Boolean(visitData.is_from_master_db),
      master_school_id: visitData.master_school_id || null,
      cluster_or_block: visitData.cluster_or_block || "",
      product_specifications: visitData.product_specifications || "",
      attachments: Array.isArray(visitData.attachments) ? visitData.attachments : [],
      follow_up_date: visitData.follow_up_date || null,
      outcome_status: visitData.outcome_status || "Open",
      ...visitData,
      id: Date.now(),
      canvasser_id: userId,
      canvasser_name: userName || "Field Canvasser",
      created_at: new Date().toISOString(),
      edit_history: []
    };
    
    visits.unshift(newVisit);
    saveStoredVisits(visits);
    return newVisit;
  },

  async updateVisit(id, updateData, currentUser) {
    await delay(350);
    const visits = getStoredVisits();
    const index = visits.findIndex(v => v.id === id);
    if (index === -1) throw new Error("Visit not found");
    
    const current = visits[index];

    const changes = [];
    const fieldsToTrack = [
      { key: 'school_name', label: 'School Name' },
      { key: 'district', label: 'District' },
      { key: 'institution_type', label: 'Institution Type' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'student_strength', label: 'Student Strength' },
      { key: 'interest_level', label: 'Interest Level' },
      { key: 'outcome_status', label: 'Outcome Status' },
      { key: 'follow_up_date', label: 'Follow-up Date' },
      { key: 'product_specifications', label: 'Product Specifications' },
      { key: 'notes', label: 'Notes' }
    ];

    fieldsToTrack.forEach(f => {
      if (updateData[f.key] !== undefined && String(updateData[f.key]) !== String(current[f.key] || '')) {
        changes.push({
          field: f.label,
          from: String(current[f.key] || 'None'),
          to: String(updateData[f.key] || 'None')
        });
      }
    });

    if (Array.isArray(updateData.product_interests) && Array.isArray(current.product_interests)) {
      const oldP = current.product_interests.sort().join(', ');
      const newP = updateData.product_interests.sort().join(', ');
      if (oldP !== newP) {
        changes.push({
          field: 'Product Interests',
          from: oldP || 'None',
          to: newP || 'None'
        });
      }
    }

    if (Array.isArray(updateData.attachments) && Array.isArray(current.attachments)) {
      if (updateData.attachments.length !== current.attachments.length) {
        changes.push({
          field: 'Attachments',
          from: `${current.attachments.length} photos`,
          to: `${updateData.attachments.length} photos`
        });
      }
    }

    const editorName = currentUser?.name || 'Staff';
    const editorRole = isAdmin(currentUser) ? 'Admin' : 'Canvasser';
    const timestamp = new Date().toISOString();
    const existingHistory = Array.isArray(current.edit_history) ? current.edit_history : [];

    const newHistoryEntry = {
      id: `EDT-${Date.now()}`,
      editor_name: editorName,
      editor_role: editorRole,
      timestamp: timestamp,
      changes: changes.length > 0 ? changes : [{ field: 'Details Updated', from: 'Previous record', to: 'Updated' }]
    };

    visits[index] = {
      ...current,
      ...updateData,
      last_edited_by_name: editorName,
      last_edited_by_role: editorRole,
      last_edited_at: timestamp,
      edit_history: [newHistoryEntry, ...existingHistory],
      updated_at: timestamp
    };
    
    saveStoredVisits(visits);
    return visits[index];
  },

  async deleteVisit(id) {
    await delay(300);
    let visits = getStoredVisits();
    const initialLen = visits.length;
    visits = visits.filter(v => v.id !== id);
    if (visits.length === initialLen) throw new Error("Visit not found");
    
    saveStoredVisits(visits);
    return true;
  },

  async getDashboardStats() {
    await delay(300);
    const visits = getStoredVisits();
    
    const totalVisits = visits.length;
    const hotLeads = visits.filter(v => v.interest_level === "Hot").length;
    const ordersWon = visits.filter(v => v.outcome_status === "Won").length;
    const ordersLost = visits.filter(v => v.outcome_status === "Lost").length;
    
    const winRate = (ordersWon + ordersLost) > 0 
      ? Math.round((ordersWon / (ordersWon + ordersLost)) * 100) 
      : 0;

    const interestCounts = {
      Hot: visits.filter(v => v.interest_level === "Hot").length,
      Warm: visits.filter(v => v.interest_level === "Warm").length,
      Cold: visits.filter(v => v.interest_level === "Cold").length,
      'Not Interested': visits.filter(v => v.interest_level === "Not Interested").length,
    };
    const interestData = Object.entries(interestCounts).map(([name, value]) => ({ name, value }));

    const districtCounts = {};
    const productCounts = {};
    const canvasserStats = {};

    visits.forEach(v => {
      districtCounts[v.district] = (districtCounts[v.district] || 0) + 1;

      if (Array.isArray(v.product_interests)) {
        v.product_interests.forEach(p => {
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

    return {
      totalVisits,
      hotLeads,
      ordersWon,
      ordersLost,
      winRate,
      interestData,
      districtData,
      productData,
      canvasserStats: Object.values(canvasserStats)
    };
  },

  async getCanvasserLeaderboard() {
    await delay(250);
    const visits = getStoredVisits();
    const storedInvoices = localStorage.getItem('murugan_invoices_v2');
    let invoices = [];
    if (storedInvoices) {
      try { invoices = JSON.parse(storedInvoices); } catch (e) {}
    } else {
      invoices = await mockApi.getInvoices();
    }

    const canvassers = mockUsers.filter(u => u.role === 'canvasser');
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
        roleTitle: c.roleTitle || 'Field Sales Executive',
        totalVisits: cVisits.length,
        wonOrders: cWon,
        hotLeads: cHot,
        totalInvoiced: totalInvoiced,
        totalCollected: totalCollected,
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

    // Sort by totalInvoiced descending, then totalVisits descending
    leaderboard.sort((a, b) => b.totalInvoiced - a.totalInvoiced || b.totalVisits - a.totalVisits);

    // Assign ranks and badges
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

    const totalTeamInvoiced = ranked.reduce((s, c) => s + c.totalInvoiced, 0);
    const totalTeamVisits = ranked.reduce((s, c) => s + c.totalVisits, 0);
    const totalTeamWon = ranked.reduce((s, c) => s + c.wonOrders, 0);
    const totalTeamCommission = ranked.reduce((s, c) => s + c.commissionEarned, 0);

    return {
      rankings: ranked,
      teamStats: {
        totalTeamInvoiced,
        formattedTeamInvoiced: `₹${(totalTeamInvoiced / 100000).toFixed(2)}L`,
        totalTeamVisits,
        totalTeamWon,
        totalTeamCommission,
        formattedTeamCommission: `₹${totalTeamCommission.toLocaleString('en-IN')}`,
        leaderName: ranked[0]?.name || 'None'
      }
    };
  },

  async getRoleSpecificKPIs(user) {
    await delay(250);
    const visits = getStoredVisits();
    const invoices = await mockApi.getInvoices();
    const leaderboardData = await mockApi.getCanvasserLeaderboard();

    const totalInvoicedVal = invoices.reduce((sum, i) => sum + (i.grand_total || 0), 0);

    if (isAdmin(user)) {
      return {
        revenue: { formatted: `₹${((totalInvoicedVal + 8500000) / 100000).toFixed(1)}L`, raw: totalInvoicedVal + 8500000 },
        gross_profit: { formatted: '₹48.2L (48%)', raw: 4820000 },
        ebitda: { formatted: '₹24.5L (23.5%)', raw: 2450000 },
        cash_flow: { formatted: '+₹18.4L', raw: 1840000 },
        marketing_roi: { formatted: '4.8x Return', raw: 4.8 },
        collection_rate: { formatted: '89.4%', raw: 89.4 }
      };
    } else {
      const userVisits = visits.filter(v => v.canvasser_id === user?.id);
      const userWon = userVisits.filter(v => v.outcome_status === 'Won').length;
      const userInvoices = invoices.filter(i => i.canvasser_id === user?.id);
      const userOrderVal = userInvoices.reduce((s, i) => s + (i.grand_total || 0), 0);

      const userRankItem = leaderboardData.rankings.find(r => r.id === user?.id);
      const userRankText = userRankItem ? `#${userRankItem.rank} in Team` : 'Rank #1';
      const userSlab = calculateCommissionSlab(userOrderVal);

      return {
        school_visits: { formatted: `${userVisits.length}`, raw: userVisits.length },
        orders_won: { formatted: `${userWon}`, raw: userWon },
        invoices_credited: { formatted: `₹${(userOrderVal / 100000).toFixed(2)}L`, raw: userOrderVal },
        commission_earned: { formatted: userSlab.formattedCommission, raw: userSlab.commission },
        commission_slab: { formatted: `${userSlab.rate}% Slab`, raw: userSlab.rate },
        team_rank: { formatted: userRankText, raw: userRankItem?.rank || 1 }
      };
    }
  },

  exportToCSV(visits) {
    const headers = [
      "Visit ID",
      "Canvasser Name",
      "School / Institution Name",
      "District",
      "Institution Type",
      "Contact Person",
      "Phone",
      "Est. Student Strength",
      "Product Interests",
      "Interest Level",
      "Outcome Status",
      "Follow-up Date",
      "Notes",
      "Logged Date"
    ];

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = visits.map(v => [
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

  async getProducts() {
    await delay(200);
    const defaultProducts = [
      { id: 1, name: "Socks", unit_price: 45, unit: "pairs", hsn: "6115", gst_rate: 18, description: "Custom combed cotton school socks with logo" },
      { id: 2, name: "Uniforms", unit_price: 480, unit: "sets", hsn: "6204", gst_rate: 18, description: "Premium durable stitched school uniform set" },
      { id: 3, name: "Belts", unit_price: 65, unit: "pcs", hsn: "4203", gst_rate: 18, description: "Custom engraved school buckle belts" },
      { id: 4, name: "Ties", unit_price: 55, unit: "pcs", hsn: "6215", gst_rate: 18, description: "Woven school crest ties" },
      { id: 5, name: "Shoes", unit_price: 380, unit: "pairs", hsn: "6403", gst_rate: 18, description: "Heavy-duty canvas and leather sports shoes" },
      { id: 6, name: "Bags", unit_price: 320, unit: "pcs", hsn: "4202", gst_rate: 18, description: "Waterproof ergonomic school backpacks" },
      { id: 7, name: "Track Pants", unit_price: 350, unit: "pcs", hsn: "6114", gst_rate: 18, description: "Breathable sports track pants" }
    ];
    const stored = localStorage.getItem('murugan_products_v1');
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    localStorage.setItem('murugan_products_v1', JSON.stringify(defaultProducts));
    return defaultProducts;
  },

  async getInvoicingStats(userId, role, userObj) {
    return this.getFinancialStats(userId, role, userObj);
  },

  async saveProducts(products) {
    await delay(300);
    localStorage.setItem('murugan_products_v1', JSON.stringify(products));
    return products;
  },

  async addProduct(productData) {
    await delay(250);
    const products = await this.getProducts();
    const newId = products.length > 0 ? Math.max(...products.map(p => Number(p.id) || 0)) + 1 : 1;
    const newProduct = {
      id: newId,
      name: (productData.name || '').trim(),
      unit_price: Number(productData.unit_price) || 0,
      unit: (productData.unit || 'pcs').trim(),
      hsn: (productData.hsn || '').trim(),
      gst_rate: Number(productData.gst_rate) || 18,
      description: (productData.description || '').trim()
    };
    const updated = [...products, newProduct];
    localStorage.setItem('murugan_products_v1', JSON.stringify(updated));
    return newProduct;
  },

  async updateProduct(id, productData) {
    await delay(250);
    const products = await this.getProducts();
    const index = products.findIndex(p => String(p.id) === String(id));
    if (index === -1) throw new Error("Product not found");
    
    products[index] = {
      ...products[index],
      name: (productData.name ?? products[index].name).trim(),
      unit_price: productData.unit_price !== undefined ? Number(productData.unit_price) : products[index].unit_price,
      unit: (productData.unit ?? products[index].unit).trim(),
      hsn: (productData.hsn ?? products[index].hsn).trim(),
      gst_rate: productData.gst_rate !== undefined ? Number(productData.gst_rate) : (products[index].gst_rate || 18),
      description: (productData.description ?? products[index].description).trim()
    };
    localStorage.setItem('murugan_products_v1', JSON.stringify(products));
    return products[index];
  },

  async deleteProduct(id) {
    await delay(250);
    const products = await this.getProducts();
    const filtered = products.filter(p => String(p.id) !== String(id));
    localStorage.setItem('murugan_products_v1', JSON.stringify(filtered));
    return { success: true, id };
  },

  async getQuotations(userId, role) {
    await delay(300);
    const stored = localStorage.getItem('murugan_quotations_v2');
    let quotations = [];
    if (stored) {
      try { quotations = JSON.parse(stored); } catch (e) {}
    } else {
      quotations = [
        {
          id: "QTN-2026-001",
          visit_id: 3,
          school_name: "PSG Public Matriculation School",
          contact_person: "Dr. Kavin (Correspondent)",
          phone: "9876543212",
          district: "Coimbatore",
          canvasser_id: 2,
          canvasser_name: "Murugan",
          date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
          valid_until: new Date(Date.now() + 86400000 * 25).toISOString().split('T')[0],
          status: "Converted to Invoice",
          items: [
            { product: "Shoes", description: "Sports Shoes", qty: 2000, rate: 380, amount: 760000 },
            { product: "Track Pants", description: "Breathable Track Pants", qty: 2000, rate: 350, amount: 700000 }
          ],
          subtotal: 1460000,
          gst_percent: 18,
          tax_amount: 262800,
          grand_total: 1722800,
          notes: "Price includes custom school crest embroidery and individual size packaging."
        },
        {
          id: "QTN-2026-002",
          visit_id: 2,
          school_name: "Vivekananda Arts & Science College",
          contact_person: "Mrs. Priya (Admin Officer)",
          phone: "9876543211",
          district: "Madurai",
          canvasser_id: 1,
          canvasser_name: "Gokul",
          date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
          valid_until: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
          status: "Converted to Invoice",
          items: [
            { product: "Bags", description: "Custom College Backpacks", qty: 800, rate: 320, amount: 256000 },
            { product: "Ties", description: "Woven Crest Ties", qty: 800, rate: 55, amount: 44000 }
          ],
          subtotal: 300000,
          gst_percent: 18,
          tax_amount: 54000,
          grand_total: 354000,
          notes: "Sample approved by purchasing committee. PO issued."
        }
      ];
      localStorage.setItem('murugan_quotations_v2', JSON.stringify(quotations));
    }

    if (isCanvasser({ role }) && userId) {
      return quotations.filter(q => q.canvasser_id === userId);
    }
    return quotations;
  },

  async addQuotation(quoteData, userId, userName) {
    await delay(400);
    const stored = localStorage.getItem('murugan_quotations_v2');
    const quotations = stored ? JSON.parse(stored) : [];

    const nextNum = quotations.length + 1;
    const qtnId = `QTN-2026-${String(nextNum).padStart(3, '0')}`;

    const targetCanvasserId = quoteData.canvasser_id || userId;
    const targetCanvasserName = quoteData.canvasser_name || userName || "Gokul";

    const newQuotation = {
      ...quoteData,
      id: qtnId,
      canvasser_id: targetCanvasserId,
      canvasser_name: targetCanvasserName,
      status: quoteData.status || "Draft",
      created_at: new Date().toISOString()
    };

    quotations.unshift(newQuotation);
    localStorage.setItem('murugan_quotations_v2', JSON.stringify(quotations));

    if (quoteData.visit_id) {
      try {
        await mockApi.updateVisit(quoteData.visit_id, { outcome_status: "Quote Given" });
      } catch (e) {}
    }

    return newQuotation;
  },

  async updateQuotationStatus(id, status) {
    await delay(250);
    const stored = localStorage.getItem('murugan_quotations_v2');
    const quotations = stored ? JSON.parse(stored) : [];
    const index = quotations.findIndex(q => q.id === id);
    if (index !== -1) {
      quotations[index].status = status;
      localStorage.setItem('murugan_quotations_v2', JSON.stringify(quotations));
      return quotations[index];
    }
    throw new Error("Quotation not found");
  },

  async getInvoices(userId, role) {
    await delay(300);
    const stored = localStorage.getItem('murugan_invoices_v2');
    let invoices = [];
    if (stored) {
      try { invoices = JSON.parse(stored); } catch (e) {}
    } else {
      invoices = [
        {
          id: "INV-2026-001",
          quotation_id: "QTN-2026-001",
          visit_id: 3,
          school_name: "PSG Public Matriculation School",
          contact_person: "Dr. Kavin (Correspondent)",
          phone: "9876543212",
          district: "Coimbatore",
          canvasser_id: 2,
          canvasser_name: "Murugan",
          date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
          due_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
          items: [
            { product: "Shoes", description: "Sports Shoes", qty: 2000, rate: 380, amount: 760000 },
            { product: "Track Pants", description: "Breathable Track Pants", qty: 2000, rate: 350, amount: 700000 }
          ],
          subtotal: 1460000,
          gst_percent: 18,
          tax_amount: 262800,
          grand_total: 1722800,
          paid_amount: 500000,
          pending_balance: 1222800,
          status: "Partially Paid",
          notes: "30% Advance received. Balance due upon delivery of batch 2."
        },
        {
          id: "INV-2026-002",
          quotation_id: null,
          visit_id: 5,
          school_name: "Holy Cross Girls Higher Secondary",
          contact_person: "Sister Mary (Headmistress)",
          phone: "9443210987",
          district: "Salem",
          canvasser_id: 3,
          canvasser_name: "Suhas",
          date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
          due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
          items: [
            { product: "Ties", description: "Navy Blue Crest Ties", qty: 1800, rate: 50, amount: 90000 },
            { product: "Socks", description: "White Sports Socks", qty: 1800, rate: 45, amount: 81000 }
          ],
          subtotal: 171000,
          gst_percent: 18,
          tax_amount: 30780,
          grand_total: 201780,
          paid_amount: 201780,
          pending_balance: 0,
          status: "Paid",
          notes: "Full payment received via UPI transaction."
        },
        {
          id: "INV-2026-003",
          quotation_id: "QTN-2026-002",
          visit_id: 2,
          school_name: "Vivekananda Arts & Science College",
          contact_person: "Mrs. Priya (Admin Officer)",
          phone: "9876543211",
          district: "Madurai",
          canvasser_id: 1,
          canvasser_name: "Gokul",
          date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
          due_date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
          items: [
            { product: "Bags", description: "Custom College Backpacks", qty: 800, rate: 320, amount: 256000 },
            { product: "Ties", description: "Woven Crest Ties", qty: 800, rate: 55, amount: 44000 }
          ],
          subtotal: 300000,
          gst_percent: 18,
          tax_amount: 54000,
          grand_total: 354000,
          paid_amount: 100000,
          pending_balance: 254000,
          status: "Partially Paid",
          notes: "Advance of ₹1,00,000 received. Delivery in progress."
        }
      ];
      localStorage.setItem('murugan_invoices_v2', JSON.stringify(invoices));
    }

    if (isCanvasser({ role }) && userId) {
      return invoices.filter(i => i.canvasser_id === userId);
    }
    return invoices;
  },

  async addInvoice(invoiceData, userId, userName) {
    await delay(400);
    const stored = localStorage.getItem('murugan_invoices_v2');
    const invoices = stored ? JSON.parse(stored) : [];

    const nextNum = invoices.length + 1;
    const invId = `INV-2026-${String(nextNum).padStart(3, '0')}`;

    const paid = Number(invoiceData.paid_amount || 0);
    const grandTotal = Number(invoiceData.grand_total || 0);
    const pending = grandTotal - paid;

    let status = "Unpaid";
    if (paid >= grandTotal && grandTotal > 0) status = "Paid";
    else if (paid > 0) status = "Partially Paid";

    const targetCanvasserId = invoiceData.canvasser_id || userId;
    const targetCanvasserName = invoiceData.canvasser_name || userName || "Gokul";

    const newInvoice = {
      ...invoiceData,
      id: invId,
      canvasser_id: targetCanvasserId,
      canvasser_name: targetCanvasserName,
      paid_amount: paid,
      pending_balance: Math.max(0, pending),
      status: invoiceData.status || status,
      created_at: new Date().toISOString()
    };

    invoices.unshift(newInvoice);
    localStorage.setItem('murugan_invoices_v2', JSON.stringify(invoices));

    if (invoiceData.quotation_id) {
      try {
        await mockApi.updateQuotationStatus(invoiceData.quotation_id, "Converted to Invoice");
      } catch (e) {}
    }

    if (invoiceData.visit_id) {
      try {
        await mockApi.updateVisit(invoiceData.visit_id, { outcome_status: "Won" });
      } catch (e) {}
    }

    return newInvoice;
  },

  async getPayments() {
    await delay(250);
    const stored = localStorage.getItem('murugan_payments_v2');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    const defaultPayments = [
      {
        id: "PAY-1001",
        invoice_id: "INV-2026-001",
        school_name: "PSG Public Matriculation School",
        date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        amount: 500000,
        mode: "Bank Transfer (NEFT)",
        reference_id: "UTIBR5202608149872",
        notes: "30% Advance deposit"
      },
      {
        id: "PAY-1002",
        invoice_id: "INV-2026-002",
        school_name: "Holy Cross Girls Higher Secondary",
        date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        amount: 201780,
        mode: "UPI (GPay)",
        reference_id: "UPI/62391098234",
        notes: "Full settlement payment"
      }
    ];
    localStorage.setItem('murugan_payments_v2', JSON.stringify(defaultPayments));
    return defaultPayments;
  },

  async recordPayment(invoiceId, paymentData) {
    await delay(350);
    const storedInvoices = localStorage.getItem('murugan_invoices_v2');
    const invoices = storedInvoices ? JSON.parse(storedInvoices) : [];
    const invIndex = invoices.findIndex(i => i.id === invoiceId);

    if (invIndex === -1) throw new Error("Invoice not found");

    const inv = invoices[invIndex];
    const payAmount = Number(paymentData.amount);

    const newPaidTotal = inv.paid_amount + payAmount;
    const newPending = Math.max(0, inv.grand_total - newPaidTotal);

    let newStatus = "Partially Paid";
    if (newPending <= 0) newStatus = "Paid";

    invoices[invIndex] = {
      ...inv,
      paid_amount: newPaidTotal,
      pending_balance: newPending,
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('murugan_invoices_v2', JSON.stringify(invoices));

    const storedPayments = localStorage.getItem('murugan_payments_v2');
    const payments = storedPayments ? JSON.parse(storedPayments) : [];
    const payId = `PAY-${1000 + payments.length + 1}`;
    const newPayment = {
      id: payId,
      invoice_id: invoiceId,
      school_name: inv.school_name,
      date: paymentData.date || new Date().toISOString().split('T')[0],
      amount: payAmount,
      mode: paymentData.mode || "Cash",
      reference_id: paymentData.reference_id || "-",
      notes: paymentData.notes || ""
    };
    payments.unshift(newPayment);
    localStorage.setItem('murugan_payments_v2', JSON.stringify(payments));

    return { invoice: invoices[invIndex], payment: newPayment };
  },

  async getFinancialStats(userId, role, userObj) {
    await delay(300);
    const invoices = await mockApi.getInvoices(userId, role);
    const quotations = await mockApi.getQuotations(userId, role);

    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.grand_total || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
    const totalPending = invoices.reduce((sum, i) => sum + (i.pending_balance || 0), 0);
    const overdueCount = invoices.filter(i => {
      if (i.status === 'Paid') return false;
      const due = new Date(i.due_date);
      return due < new Date();
    }).length;

    const totalQuotes = quotations.length;
    const pendingQuotes = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;

    const isUserAdmin = isAdmin(userObj || { role });

    return {
      totalInvoiced: isUserAdmin ? totalInvoiced : (userId ? totalInvoiced : '—'),
      totalCollected: isUserAdmin ? totalCollected : (userId ? totalCollected : '—'),
      totalPending: isUserAdmin ? totalPending : (userId ? totalPending : '—'),
      overdueCount,
      totalQuotes,
      pendingQuotes,
      invoicesCount: invoices.length,
      isFinancialsMasked: !isUserAdmin
    };
  },

  async getMarketingCampaigns() {
    await delay(250);
    return [
      {
        id: "CMP-2026-01",
        name: "Back-to-School 2026 Mega Apparel Drive",
        target: "Matriculation & CBSE Schools (Kongu & Central TN)",
        budget: 150000,
        spent: 98000,
        reach: 18400,
        leads: 76,
        conversions: 18,
        roi: "5.4x",
        status: "Active",
        channels: ["School Visits", "Direct Mailer", "WhatsApp Catalog", "Instagram"],
        keyCollateral: ["2026 School Socks & Uniform Lookbook (PDF)", "Custom Embroidery Swatch Card Pack"]
      },
      {
        id: "CMP-2026-02",
        name: "College Sports & Track Pants Special",
        target: "Arts & Science and Engineering Colleges",
        budget: 80000,
        spent: 54000,
        reach: 12200,
        leads: 42,
        conversions: 8,
        roi: "4.1x",
        status: "Active",
        channels: ["Canvasser Sample Drop", "Physical Catalog", "Sports Director Outreach"],
        keyCollateral: ["Breathable Poly-Cotton Track Pants Spec Sheet", "Bulk Rate Tier Guide"]
      },
      {
        id: "CMP-2026-03",
        name: "Coimbatore School Belts & Crest Ties Upgrade",
        target: "Private School Trustees & Principals",
        budget: 60000,
        spent: 60000,
        reach: 9500,
        leads: 30,
        conversions: 11,
        roi: "6.2x",
        status: "Completed",
        channels: ["Canvasser 1-on-1 Pitch", "Custom Sample Box"],
        keyCollateral: ["Engraved Metal Buckle Sample Kit", "Woven Crest Tie Physical Sample"]
      }
    ];
  },

  async getMarketingCollateral() {
    await delay(200);
    return [
      {
        id: "COL-01",
        title: "2026 Master Product Catalog & Price Guide",
        category: "Catalog",
        format: "PDF (Digital + Print)",
        size: "4.2 MB",
        downloadUrl: "#",
        updatedAt: "2026-08-15",
        targetAudience: "Principals & Management Trustees",
        recommendedFor: "All Field Visits"
      },
      {
        id: "COL-02",
        title: "Combed Cotton Socks Durability & Wash Test Report",
        category: "Technical Sheet",
        format: "PDF",
        size: "1.8 MB",
        downloadUrl: "#",
        updatedAt: "2026-08-10",
        targetAudience: "School Purchase Committees",
        recommendedFor: "Socks Inquiries"
      },
      {
        id: "COL-03",
        title: "School Uniform Embroidery & Custom Crest Guidelines",
        category: "Design Spec",
        format: "PDF",
        size: "2.4 MB",
        downloadUrl: "#",
        updatedAt: "2026-08-01",
        targetAudience: "Design Coordinators & Canvassers",
        recommendedFor: "Uniform & Crest Tie Closures"
      },
      {
        id: "COL-04",
        title: "Institutional Volume Discount & Credit Policy",
        category: "Sales Collateral",
        format: "PDF",
        size: "950 KB",
        downloadUrl: "#",
        updatedAt: "2026-08-18",
        targetAudience: "Commercial Heads & Canvassers",
        recommendedFor: "High Strength Institutions (>1000 Students)"
      }
    ];
  },

  // ================= INSTITUTIONAL MASTER SCHOOL DATABASE =================
  async searchMasterSchools(query = '', district = 'all', limit = 20) {
    await delay(120);
    return searchMasterSchoolsLocal(query, district, limit);
  },

  async getMasterSchoolById(id) {
    await delay(50);
    return getMasterSchoolById(id);
  },

  async getAllMasterSchools() {
    await delay(150);
    return MASTER_SCHOOLS;
  }
};

