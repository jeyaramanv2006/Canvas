const mockVisits = [
  {
    id: 1,
    canvasser_id: 1,
    school_name: "St. John's Academy",
    district: "Coimbatore",
    institution_type: "School",
    contact_person: "Mr. Ramesh",
    phone: "9876543210",
    student_strength: 1200,
    product_interests: ["Socks", "Uniforms"],
    interest_level: "Hot",
    outcome_status: "Sample Sent",
    follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    notes: "Very interested in quality socks."
  },
  {
    id: 2,
    canvasser_id: 1,
    school_name: "Vivekananda College",
    district: "Madurai",
    institution_type: "College",
    contact_person: "Mrs. Priya",
    phone: "9876543211",
    student_strength: 3500,
    product_interests: ["Bags", "Ties"],
    interest_level: "Warm",
    outcome_status: "Open",
    follow_up_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // Overdue by 1 day
    notes: "Follow up for ties."
  },
  {
    id: 3,
    canvasser_id: 2,
    school_name: "PSG Public School",
    district: "Coimbatore",
    institution_type: "School",
    contact_person: "Dr. Kavin",
    phone: "9876543212",
    student_strength: 2000,
    product_interests: ["Shoes", "Track Pants"],
    interest_level: "Hot",
    outcome_status: "Won",
    follow_up_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    notes: "Order confirmed."
  }
];

const mockUsers = [
  { id: 1, email: "field@murugan.com", password: "password", name: "Rahul (Canvasser)", role: "canvasser" },
  { id: 2, email: "field2@murugan.com", password: "password", name: "Vikram (Canvasser)", role: "canvasser" },
  { id: 3, email: "manager@murugan.com", password: "password", name: "Suresh (Manager)", role: "manager" }
];

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async login(email, password) {
    await delay(800);
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    return {
      token: "mock-jwt-token-" + user.id,
      user: { id: user.id, name: user.name, role: user.role }
    };
  },

  async getVisits(userId, role) {
    await delay(500);
    // Retrieve from localStorage if exists, else use defaults
    const stored = localStorage.getItem('murugan_visits');
    let visits = stored ? JSON.parse(stored) : mockVisits;
    
    if (role === 'canvasser') {
      return visits.filter(v => v.canvasser_id === userId);
    }
    return visits;
  },

  async addVisit(visitData, userId) {
    await delay(600);
    const stored = localStorage.getItem('murugan_visits');
    let visits = stored ? JSON.parse(stored) : mockVisits;
    
    const newVisit = {
      ...visitData,
      id: Date.now(),
      canvasser_id: userId,
      outcome_status: "Open"
    };
    
    visits.unshift(newVisit); // add to top
    localStorage.setItem('murugan_visits', JSON.stringify(visits));
    return newVisit;
  },
  
  async getDashboardStats() {
    await delay(500);
    const stored = localStorage.getItem('murugan_visits');
    let visits = stored ? JSON.parse(stored) : mockVisits;
    
    const totalVisits = visits.length;
    const hotLeads = visits.filter(v => v.interest_level === "Hot").length;
    const ordersWon = visits.filter(v => v.outcome_status === "Won").length;
    const ordersLost = visits.filter(v => v.outcome_status === "Lost").length;
    
    const winRate = (ordersWon + ordersLost) > 0 
      ? Math.round((ordersWon / (ordersWon + ordersLost)) * 100) 
      : 0;

    return {
      totalVisits,
      hotLeads,
      ordersWon,
      winRate
    };
  }
};
