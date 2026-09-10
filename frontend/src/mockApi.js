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
    username: "sudhan@ceo",
    email: "sudhan@murugan.com",
    aliases: ["ceo@murugan.com", "sudhan@murugan.com", "sudhan@ceo"],
    password: "password",
    name: "Sudhan",
    role: "ceo",
    roleTitle: "Chief Executive Officer",
    status: "ACTIVE",
    requires_password_reset: false
  },
  {
    id: 11,
    username: "abhishek@cfo",
    email: "abhishek@murugan.com",
    aliases: ["cfo@murugan.com", "abhishek@murugan.com", "abhishek@cfo"],
    password: "password",
    name: "Abhishek",
    role: "cfo",
    roleTitle: "Chief Financial Officer",
    status: "ACTIVE",
    requires_password_reset: false
  },
  {
    id: 12,
    username: "varshini@cco",
    email: "varshini@murugan.com",
    aliases: ["cco@murugan.com", "varshini@murugan.com", "varshini@cco"],
    password: "password",
    name: "Varshini",
    role: "cco",
    roleTitle: "Chief Commercial Officer",
    status: "ACTIVE",
    requires_password_reset: false
  },
  // ── Operations ─────────────────────────────────────────────────────────────
  {
    id: 4,
    username: "admin@admin",
    email: "admin@murugan.com",
    aliases: ["manager@murugan.com", "admin@murugan.com", "admin@admin"],
    password: "password",
    name: "Admin",
    role: "admin_exec",
    roleTitle: "Admin Executive",
    status: "ACTIVE",
    requires_password_reset: false
  },
  // ── Field Sales ────────────────────────────────────────────────────────────
  {
    id: 1,
    username: "gokul@cvs",
    email: "gokul@murugan.com",
    aliases: ["field@murugan.com", "gokul@murugan.com", "gokul@cvs"],
    password: "password",
    name: "Gokul",
    role: "canvasser",
    roleTitle: "Senior Canvasser",
    status: "ACTIVE",
    requires_password_reset: false
  },
  {
    id: 2,
    username: "murugan@cvs",
    email: "murugan@murugan.com",
    aliases: ["field2@murugan.com", "murugan@murugan.com", "murugan@cvs"],
    password: "password",
    name: "Murugan",
    role: "canvasser",
    roleTitle: "Field Sales Lead",
    status: "ACTIVE",
    requires_password_reset: false
  },
  {
    id: 3,
    username: "suhas@cvs",
    email: "suhas@murugan.com",
    aliases: ["field3@murugan.com", "suhas@murugan.com", "suhas@cvs"],
    password: "password",
    name: "Suhas",
    role: "canvasser",
    roleTitle: "Field Canvasser",
    status: "ACTIVE",
    requires_password_reset: false
  }
];

export function formatUsername(name, role) {
  const cleanName = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const roleMap = {
    canvasser: 'cvs',
    cvs: 'cvs',
    admin_exec: 'admin',
    admin: 'admin',
    ceo: 'ceo',
    cfo: 'cfo',
    cco: 'cco'
  };
  const cleanRole = roleMap[role?.toLowerCase()] || (role || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanName}@${cleanRole}`;
}

const getStoredUsers = () => {
  const stored = localStorage.getItem('mg_users_v3');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored users", e);
    }
  }
  localStorage.setItem('mg_users_v3', JSON.stringify(mockUsers));
  return mockUsers;
};

const saveStoredUsers = (users) => {
  localStorage.setItem('mg_users_v3', JSON.stringify(users));
};

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
  async login(identifier, password) {
    await delay(250);
    const inputId = (identifier || '').trim().toLowerCase();
    const users = getStoredUsers();
    const user = users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.username || '').toLowerCase();
      const uAliases = (u.aliases || []).map(a => a.toLowerCase());
      return (uEmail === inputId || uUsername === inputId || uAliases.includes(inputId)) && u.password === password;
    });

    if (!user) {
      throw new Error("Invalid username/email or password.");
    }

    if (user.status === 'DELETED') {
      throw new Error("This account has been permanently removed. Access is disabled.");
    }

    if (user.status === 'PAUSED' || user.status === 'INACTIVE') {
      throw new Error("Account has been temporarily paused by administration. Please contact your Admin or CEO.");
    }

    return {
      token: "mock-jwt-token-" + user.id,
      user: {
        id: user.id,
        username: user.username || formatUsername(user.name, user.role),
        name: user.name,
        email: user.email,
        role: user.role,
        roleTitle: user.roleTitle,
        status: user.status || 'ACTIVE',
        requires_password_reset: Boolean(user.requires_password_reset)
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

    // Auto-update master schools storage with field details (strength, contact_person, phone)
    try {
      const storedSchools = localStorage.getItem('mg_master_schools_v3');
      if (storedSchools) {
        const parsedSchools = JSON.parse(storedSchools);
        let updated = false;
        for (const s of parsedSchools) {
          const isMatch = (visitData.master_school_id && s.id === visitData.master_school_id) ||
            (s.school_name && visitData.school_name &&
              s.school_name.toLowerCase().trim() === visitData.school_name.toLowerCase().trim() &&
              s.district && visitData.district &&
              s.district.toLowerCase().trim() === visitData.district.toLowerCase().trim());

          if (isMatch) {
            if (visitData.student_strength && Number(visitData.student_strength) > 0) {
              s.student_strength = Number(visitData.student_strength);
            }
            if (visitData.contact_person && visitData.contact_person.trim()) {
              s.contact_person = visitData.contact_person.trim();
            }
            if (visitData.phone && visitData.phone.trim()) {
              s.phone = visitData.phone.trim();
            }
            s.updated_at = new Date().toISOString();
            updated = true;
            break;
          }
        }
        if (updated) {
          localStorage.setItem('mg_master_schools_v3', JSON.stringify(parsedSchools));
        }
      }
    } catch (e) {
      console.warn("Could not sync visit details to master schools:", e);
    }

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

    // Auto-update master schools storage with updated field details (strength, contact_person, phone)
    try {
      const storedSchools = localStorage.getItem('mg_master_schools_v3');
      if (storedSchools) {
        const parsedSchools = JSON.parse(storedSchools);
        let updated = false;
        for (const s of parsedSchools) {
          const isMatch = (current.master_school_id && s.id === current.master_school_id) ||
            (s.school_name && current.school_name &&
              s.school_name.toLowerCase().trim() === current.school_name.toLowerCase().trim() &&
              s.district && current.district &&
              s.district.toLowerCase().trim() === current.district.toLowerCase().trim());

          if (isMatch) {
            if (updateData.student_strength && Number(updateData.student_strength) > 0) {
              s.student_strength = Number(updateData.student_strength);
            }
            if (updateData.contact_person && updateData.contact_person.trim()) {
              s.contact_person = updateData.contact_person.trim();
            }
            if (updateData.phone && updateData.phone.trim()) {
              s.phone = updateData.phone.trim();
            }
            s.updated_at = new Date().toISOString();
            updated = true;
            break;
          }
        }
        if (updated) {
          localStorage.setItem('mg_master_schools_v3', JSON.stringify(parsedSchools));
        }
      }
    } catch (e) {
      console.warn("Could not sync visit details on updateVisit to master schools:", e);
    }

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

  async getCanvasserLeaderboard(sortBy = 'pay', sortOrder = 'desc') {
    await delay(200);
    const visits = getStoredVisits();
    const storedInvoices = localStorage.getItem('murugan_invoices_v2');
    let invoices = [];
    if (storedInvoices) {
      try { invoices = JSON.parse(storedInvoices); } catch (e) { }
    } else {
      invoices = await mockApi.getInvoices();
    }

    const canvassers = mockUsers.filter(u => u.role === 'canvasser' || u.role === 'cvs');
    const leaderboard = canvassers.map(c => {
      const cVisits = visits.filter(v => v.canvasser_id === c.id);
      const cWon = cVisits.filter(v => v.outcome_status === 'Won').length;
      const cHot = cVisits.filter(v => v.interest_level === 'Hot').length;
      const cInvoices = invoices.filter(i => i.canvasser_id === c.id);
      const totalInvoiced = cInvoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
      const totalCollected = cInvoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
      const slabInfo = calculateCommissionSlab(totalInvoiced);

      // Itemized per-invoice pay calculation based on active slab
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
        roleTitle: c.roleTitle || 'Field Sales Executive',
        totalVisits: cVisits.length,
        schoolsCanvassed: cVisits.length,
        wonOrders: cWon,
        invoicesConverted: cInvoices.length,
        hotLeads: cHot,
        totalInvoiced: totalInvoiced,
        totalCollected: totalCollected,
        invoicesCount: cInvoices.length,
        convertedInvoices: convertedInvoices,
        conversionRate: conversionRate,
        avgInvoiceValue: avgInvoiceValue,
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
    const isAsc = sortOrder === 'asc';
    leaderboard.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'pay' || sortBy === 'commission') {
        diff = b.commissionEarned - a.commissionEarned || b.totalInvoiced - a.totalInvoiced;
      } else if (sortBy === 'visits' || sortBy === 'schools') {
        diff = b.totalVisits - a.totalVisits || b.wonOrders - a.wonOrders;
      } else if (sortBy === 'invoices' || sortBy === 'won') {
        diff = b.invoicesConverted - a.invoicesConverted || b.totalInvoiced - a.totalInvoiced;
      } else if (sortBy === 'invoiced' || sortBy === 'revenue') {
        diff = b.totalInvoiced - a.totalInvoiced || b.commissionEarned - a.commissionEarned;
      } else if (sortBy === 'conversion') {
        diff = b.conversionRate - a.conversionRate || b.wonOrders - a.wonOrders;
      } else if (sortBy === 'avg_deal') {
        diff = b.avgInvoiceValue - a.avgInvoiceValue || b.totalInvoiced - a.totalInvoiced;
      } else {
        diff = b.commissionEarned - a.commissionEarned || b.totalInvoiced - a.totalInvoiced;
      }
      return isAsc ? -diff : diff;
    });

    // Assign ranks and badges based on current sort order
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
      } catch (e) { }
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
      try { quotations = JSON.parse(stored); } catch (e) { }
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
      } catch (e) { }
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
      try { invoices = JSON.parse(stored); } catch (e) { }
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
      } catch (e) { }
    }

    if (invoiceData.visit_id) {
      try {
        await mockApi.updateVisit(invoiceData.visit_id, { outcome_status: "Won" });
      } catch (e) { }
    }

    return newInvoice;
  },

  async getPayments() {
    await delay(250);
    const stored = localStorage.getItem('murugan_payments_v2');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
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
  async getAllMasterSchools() {
    await delay(100);
    const stored = localStorage.getItem('mg_master_schools_v3');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored master schools", e);
      }
    }
    localStorage.setItem('mg_master_schools_v3', JSON.stringify(MASTER_SCHOOLS));
    return MASTER_SCHOOLS;
  },

  async searchMasterSchools(query = '', district = 'all', limit = 20) {
    await delay(100);
    const schools = await mockApi.getAllMasterSchools();
    const cleanQ = (query || '').trim().toLowerCase();
    const cleanDistrict = (district || 'all').trim().toLowerCase();

    return schools.filter(s => {
      if (s.status === 'INACTIVE' || s.status === 'DELETED') return false;
      const matchesDistrict = cleanDistrict === 'all' || (s.district || '').toLowerCase() === cleanDistrict;
      if (!matchesDistrict) return false;
      if (!cleanQ) return true;
      return (
        (s.school_name || '').toLowerCase().includes(cleanQ) ||
        (s.block_or_cluster || '').toLowerCase().includes(cleanQ) ||
        (s.area && s.area.toLowerCase().includes(cleanQ)) ||
        (s.id && s.id.toLowerCase().includes(cleanQ))
      );
    }).slice(0, limit);
  },

  async getMasterSchoolById(id) {
    await delay(50);
    const schools = await mockApi.getAllMasterSchools();
    return schools.find(s => s.id === id) || null;
  },

  async createMasterSchool(schoolData) {
    await delay(150);
    const schools = await mockApi.getAllMasterSchools();
    const distCode = (schoolData.district || 'SCH').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'SCH';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = schoolData.id || `SCH-${distCode}-${randomSuffix}`;

    const newSchool = {
      id: newId,
      school_name: schoolData.school_name,
      district: schoolData.district,
      block_or_cluster: schoolData.block_or_cluster || 'General Block',
      zone: schoolData.zone || 'Tamil Nadu',
      board: schoolData.board || 'Matriculation',
      area: schoolData.area || '',
      student_strength: parseInt(schoolData.student_strength, 10) || null,
      contact_person: schoolData.contact_person || null,
      phone: schoolData.phone || null,
      priority: schoolData.priority || 'Medium',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    schools.unshift(newSchool);
    localStorage.setItem('mg_master_schools_v3', JSON.stringify(schools));
    return newSchool;
  },

  async updateMasterSchool(id, updateData) {
    await delay(150);
    const schools = await mockApi.getAllMasterSchools();
    const idx = schools.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("School not found");

    schools[idx] = {
      ...schools[idx],
      ...updateData,
      id,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('mg_master_schools_v3', JSON.stringify(schools));
    return schools[idx];
  },

  async deleteMasterSchool(id) {
    await delay(150);
    const schools = await mockApi.getAllMasterSchools();
    const idx = schools.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("School not found");

    schools.splice(idx, 1);
    localStorage.setItem('mg_master_schools_v3', JSON.stringify(schools));
    return { success: true, deletedId: id };
  },

  async exportMasterSchoolsCSV() {
    const schools = await mockApi.getAllMasterSchools();
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'ID', 'School Name', 'District', 'Block or Cluster', 'Zone', 'Board', 'Area', 'Student Strength', 'Contact Person', 'Phone', 'Priority', 'Status'
    ];

    const rows = [headers.map(escapeCsv).join(',')];
    for (const s of schools) {
      rows.push([
        escapeCsv(s.id),
        escapeCsv(s.school_name),
        escapeCsv(s.district),
        escapeCsv(s.block_or_cluster),
        escapeCsv(s.zone),
        escapeCsv(s.board),
        escapeCsv(s.area),
        escapeCsv(s.student_strength ? s.student_strength : '-'),
        escapeCsv(s.contact_person && s.contact_person.trim() ? s.contact_person.trim() : '-'),
        escapeCsv(s.phone && s.phone.trim() ? s.phone.trim() : '-'),
        escapeCsv(s.priority),
        escapeCsv(s.status || 'ACTIVE')
      ].join(','));
    }
    return rows.join('\r\n');
  },

  // ================= USER DIRECTORY & ACCESS CONTROL =================
  async getUsers() {
    await delay(100);
    return getStoredUsers();
  },

  async createUser(userData) {
    await delay(150);
    const users = getStoredUsers();
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    const cleanUsername = userData.username || formatUsername(userData.name, userData.role);

    // Check for username collision
    const existing = users.find(u => (u.username || '').toLowerCase() === cleanUsername.toLowerCase());
    if (existing && existing.status !== 'DELETED') {
      throw new Error(`Username "${cleanUsername}" already exists.`);
    }

    const userObj = {
      id: newId,
      name: userData.name,
      username: cleanUsername,
      email: userData.email || `${cleanUsername.replace('@', '.')}@murugan.com`,
      role: userData.role || 'canvasser',
      roleTitle: userData.roleTitle || 'Staff',
      password: userData.password || 'password',
      status: 'ACTIVE',
      requires_password_reset: false,
      created_at: new Date().toISOString()
    };

    if (existing) {
      const idx = users.findIndex(u => u.id === existing.id);
      users[idx] = { ...userObj, id: existing.id };
    } else {
      users.push(userObj);
    }

    saveStoredUsers(users);
    return userObj;
  },

  async updateUserRole(userId, newRole) {
    await delay(150);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId || String(u.id) === String(userId));
    if (idx === -1) throw new Error("User not found");

    const roleMap = {
      ceo: 'Chief Executive Officer',
      cfo: 'Chief Financial Officer',
      cco: 'Chief Commercial Officer',
      admin_exec: 'Admin Executive',
      canvasser: 'Field Canvasser'
    };

    const target = users[idx];
    const newUsername = formatUsername(target.name, newRole);

    target.role = newRole;
    target.username = newUsername;
    target.roleTitle = roleMap[newRole] || 'Staff';
    target.updated_at = new Date().toISOString();
    saveStoredUsers(users);
    return target;
  },

  async deleteUser(userId) {
    await delay(150);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId || String(u.id) === String(userId));
    if (idx === -1) throw new Error("User not found");

    // Mark status as DELETED (preserves past progress and record in dataset)
    users[idx].status = 'DELETED';
    users[idx].updated_at = new Date().toISOString();
    saveStoredUsers(users);
    return { success: true, user: users[idx] };
  },

  async pauseUser(userId) {
    await delay(150);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId || String(u.id) === String(userId));
    if (idx === -1) throw new Error("User not found");

    users[idx].status = 'PAUSED';
    users[idx].updated_at = new Date().toISOString();
    saveStoredUsers(users);
    return { success: true, user: users[idx] };
  },

  async resumeUser(userId) {
    await delay(150);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId || String(u.id) === String(userId));
    if (idx === -1) throw new Error("User not found");

    users[idx].status = 'ACTIVE';
    users[idx].updated_at = new Date().toISOString();
    saveStoredUsers(users);
    return { success: true, user: users[idx] };
  },

  async triggerPasswordReset(userId) {
    await delay(150);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId || String(u.id) === String(userId));
    if (idx === -1) throw new Error("User not found");

    users[idx].requires_password_reset = true;
    users[idx].updated_at = new Date().toISOString();
    saveStoredUsers(users);
    return { success: true, user: users[idx] };
  },

  async resetUserPassword(userId, newPassword) {
    await delay(150);
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id === userId || String(u.id) === String(userId));
    if (idx === -1) throw new Error("User not found");

    users[idx].password = newPassword;
    users[idx].requires_password_reset = false;
    users[idx].updated_at = new Date().toISOString();
    saveStoredUsers(users);
    return { success: true, user: users[idx] };
  },

  async getCEODashboardHubData() {
    await delay(250);
    const [visits, invoices, quotations, payments, users, products, campaigns] = await Promise.all([
      mockApi.getVisits(),
      mockApi.getInvoices(),
      mockApi.getQuotations(),
      mockApi.getPayments(),
      mockApi.getUsers(),
      mockApi.getProducts(),
      mockApi.getMarketingCampaigns()
    ]);

    // Financial Metrics
    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.grand_total) || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
    const totalReceivables = invoices.reduce((sum, i) => sum + (Number(i.pending_balance !== undefined ? i.pending_balance : i.outstanding_balance) || 0), 0);

    const estCOGS = totalInvoiced * 0.52; // ~48% gross margin
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
      days90Plus: { label: '90+ Days (High Risk)', count: 0, amount: 0 }
    };

    invoices.forEach(inv => {
      const balance = Number(inv.pending_balance !== undefined ? inv.pending_balance : inv.outstanding_balance) || 0;
      if (balance > 0) {
        const createdDate = new Date(inv.created_at || inv.date || Date.now());
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

        if (inv.due_date && new Date(inv.due_date) < now) {
          overdueCount++;
          overdueAmount += balance;
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

    // Overdue follow-up visits
    const overdueFollowUps = visits.filter(v => {
      if (!v.follow_up_date) return false;
      return new Date(v.follow_up_date) < now && v.outcome_status !== 'Won' && v.outcome_status !== 'Lost';
    });

    // Canvassers & Commissions
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
        roleTitle: c.roleTitle || c.role_title || 'Field Sales Executive',
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

    // Customer & School Analytics
    const uniqueVisitedSchools = new Set(visits.map(v => v.school_name)).size;
    const clientRevenueMap = {};
    invoices.forEach(i => {
      if (!clientRevenueMap[i.school_name]) {
        clientRevenueMap[i.school_name] = {
          name: i.school_name,
          district: i.district || 'Tamil Nadu',
          totalBilled: 0,
          totalPaid: 0,
          outstanding: 0,
          invoiceCount: 0
        };
      }
      clientRevenueMap[i.school_name].totalBilled += Number(i.grand_total) || 0;
      clientRevenueMap[i.school_name].totalPaid += Number(i.paid_amount) || 0;
      clientRevenueMap[i.school_name].outstanding += Number(i.pending_balance !== undefined ? i.pending_balance : i.outstanding_balance) || 0;
      clientRevenueMap[i.school_name].invoiceCount += 1;
    });
    const topCustomers = Object.values(clientRevenueMap).sort((a, b) => b.totalBilled - a.totalBilled);

    // Product Demand Breakdown
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

    // Monthly Trend Aggregation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    months.forEach((m, idx) => {
      monthlyDataMap[idx] = { month: m, billed: 0, collected: 0, visits: 0 };
    });
    invoices.forEach(inv => {
      const d = new Date(inv.created_at || inv.date || Date.now());
      const mIdx = d.getMonth();
      if (monthlyDataMap[mIdx]) monthlyDataMap[mIdx].billed += Number(inv.grand_total) || 0;
    });
    payments.forEach(p => {
      const d = new Date(p.recorded_at || p.date || Date.now());
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

    // Pending Governance Approvals
    let pendingApprovals = [];
    try {
      const storedApp = localStorage.getItem('mg_pending_approvals');
      if (storedApp) {
        pendingApprovals = JSON.parse(storedApp).filter(a => a.status === 'PENDING');
      } else {
        pendingApprovals = [
          { id: 'APP-101', type: 'SCHOOL_CREATION', title: 'New School: SBOA Matriculation' },
          { id: 'APP-102', type: 'ROLE_CHANGE', title: 'Role Upgrade: Vignesh -> Admin' },
          { id: 'APP-103', type: 'DISCOUNT_AUTH', title: 'Special 12% Bulk Discount Authorization' }
        ];
      }
    } catch (e) { }

    // Format helpers
    const formatL = (val) => `₹${(val / 100000).toFixed(2)}L`;

    return {
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
          change: overdueInvoicesCount(invoices, now) > 0 ? `${overdueInvoicesCount(invoices, now)} Overdue` : 'Healthy',
          trend: overdueInvoicesCount(invoices, now) > 0 ? 'down' : 'neutral',
          subtext: `Overdue Amount: ${formatL(overdueAmount)}`,
          status: overdueInvoicesCount(invoices, now) > 0 ? 'warning' : 'success'
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
        categories: Array.from(new Set(products.map(p => p.category || 'Apparel'))),
        demandDistribution: Object.entries(productDemand).map(([product, count]) => ({ product, count })),
        products: products
      },
      customers: {
        masterSchoolsTotal: 2480,
        visitedCount: uniqueVisitedSchools,
        penetrationRate: ((uniqueVisitedSchools / 2480) * 100).toFixed(1),
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
        campaignsCount: campaigns.length,
        campaigns: campaigns,
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
        overdueInvoices: invoices.filter(i => {
          const bal = Number(i.pending_balance !== undefined ? i.pending_balance : i.outstanding_balance) || 0;
          return bal > 0 && i.due_date && new Date(i.due_date) < now;
        }).slice(0, 5),
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
    };
  }
};

function overdueInvoicesCount(invoices, now) {
  return invoices.filter(i => {
    const bal = Number(i.pending_balance !== undefined ? i.pending_balance : i.outstanding_balance) || 0;
    return bal > 0 && i.due_date && new Date(i.due_date) < now;
  }).length;
}



