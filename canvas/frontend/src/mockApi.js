const mockUsers = [
  { id: 1, email: "field@murugan.com", password: "password", name: "Rahul Sharma", role: "canvasser" },
  { id: 2, email: "field2@murugan.com", password: "password", name: "Vikram Nathan", role: "canvasser" },
  { id: 3, email: "field3@murugan.com", password: "password", name: "Karthik Raja", role: "canvasser" },
  { id: 4, email: "manager@murugan.com", password: "password", name: "Suresh Murugan", role: "manager" }
];

const mockVisits = [
  {
    id: 1,
    canvasser_id: 1,
    canvasser_name: "Rahul Sharma",
    school_name: "St. John's Higher Secondary School",
    district: "Coimbatore",
    institution_type: "School",
    contact_person: "Mr. Ramesh (Principal)",
    phone: "9876543210",
    student_strength: 1200,
    product_interests: ["Socks", "Uniforms", "Belts"],
    interest_level: "Hot",
    outcome_status: "Sample Sent",
    follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // in 2 days
    notes: "Very interested in 1200 custom combed-cotton socks and school belts. Sample pack sent yesterday.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 2,
    canvasser_id: 1,
    canvasser_name: "Rahul Sharma",
    school_name: "Vivekananda Arts & Science College",
    district: "Madurai",
    institution_type: "College",
    contact_person: "Mrs. Priya (Admin Officer)",
    phone: "9876543211",
    student_strength: 3500,
    product_interests: ["Bags", "Ties", "Track Pants"],
    interest_level: "Warm",
    outcome_status: "Quote Given",
    follow_up_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // Overdue by 1 day
    notes: "Quote provided for 800 custom college bags and ties. Follow up with purchasing committee.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 3,
    canvasser_id: 2,
    canvasser_name: "Vikram Nathan",
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
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 4,
    canvasser_id: 2,
    canvasser_name: "Vikram Nathan",
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
    canvasser_name: "Karthik Raja",
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
    canvasser_name: "Karthik Raja",
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

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredVisits = () => {
  const stored = localStorage.getItem('murugan_visits');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored visits", e);
    }
  }
  localStorage.setItem('murugan_visits', JSON.stringify(mockVisits));
  return mockVisits;
};

const saveStoredVisits = (visits) => {
  localStorage.setItem('murugan_visits', JSON.stringify(visits));
};

export const mockApi = {
  async login(email, password) {
    await delay(600);
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    return {
      token: "mock-jwt-token-" + user.id,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  },

  async getUsers() {
    await delay(300);
    return mockUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  },

  async getVisits(userId, role) {
    await delay(400);
    const visits = getStoredVisits();
    if (role === 'canvasser') {
      return visits.filter(v => v.canvasser_id === userId);
    }
    return visits;
  },

  async addVisit(visitData, userId, userName) {
    await delay(500);
    const visits = getStoredVisits();
    
    const newVisit = {
      ...visitData,
      id: Date.now(),
      canvasser_id: userId,
      canvasser_name: userName || "Field Canvasser",
      created_at: new Date().toISOString()
    };
    
    visits.unshift(newVisit); // add to top
    saveStoredVisits(visits);
    return newVisit;
  },

  async updateVisit(id, updateData) {
    await delay(400);
    const visits = getStoredVisits();
    const index = visits.findIndex(v => v.id === id);
    if (index === -1) throw new Error("Visit not found");
    
    visits[index] = {
      ...visits[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    saveStoredVisits(visits);
    return visits[index];
  },

  async deleteVisit(id) {
    await delay(400);
    let visits = getStoredVisits();
    const initialLen = visits.length;
    visits = visits.filter(v => v.id !== id);
    if (visits.length === initialLen) throw new Error("Visit not found");
    
    saveStoredVisits(visits);
    return true;
  },
  
  async getDashboardStats() {
    await delay(400);
    const visits = getStoredVisits();
    
    const totalVisits = visits.length;
    const hotLeads = visits.filter(v => v.interest_level === "Hot").length;
    const ordersWon = visits.filter(v => v.outcome_status === "Won").length;
    const ordersLost = visits.filter(v => v.outcome_status === "Lost").length;
    
    const winRate = (ordersWon + ordersLost) > 0 
      ? Math.round((ordersWon / (ordersWon + ordersLost)) * 100) 
      : 0;

    // Aggregate by interest level
    const interestCounts = {
      Hot: visits.filter(v => v.interest_level === "Hot").length,
      Warm: visits.filter(v => v.interest_level === "Warm").length,
      Cold: visits.filter(v => v.interest_level === "Cold").length,
      'Not Interested': visits.filter(v => v.interest_level === "Not Interested").length,
    };
    const interestData = Object.entries(interestCounts).map(([name, value]) => ({ name, value }));

    // Aggregate by district
    const districtCounts = {};
    visits.forEach(v => {
      const dist = v.district || "Unassigned";
      districtCounts[dist] = (districtCounts[dist] || 0) + 1;
    });
    const districtData = Object.entries(districtCounts)
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits);

    // Aggregate by product
    const productCounts = {};
    visits.forEach(v => {
      if (Array.isArray(v.product_interests)) {
        v.product_interests.forEach(p => {
          productCounts[p] = (productCounts[p] || 0) + 1;
        });
      }
    });
    const productData = Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Canvasser performance
    const canvasserStats = {};
    mockUsers.filter(u => u.role === 'canvasser').forEach(u => {
      canvasserStats[u.id] = { id: u.id, name: u.name, visits: 0, hot: 0, won: 0 };
    });
    visits.forEach(v => {
      if (canvasserStats[v.canvasser_id]) {
        canvasserStats[v.canvasser_id].visits += 1;
        if (v.interest_level === 'Hot') canvasserStats[v.canvasser_id].hot += 1;
        if (v.outcome_status === 'Won') canvasserStats[v.canvasser_id].won += 1;
      }
    });

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
  }
};
