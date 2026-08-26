/**
 * Role-Based Access Control (RBAC)
 * Murugan Canvass Platform
 * 
 * Roles:
 * 1. ADMIN (Executive Management & Leadership)
 * 2. CANVASSER (Field Sales & Canvassing)
 */

export const ROLES = {
  ADMIN: {
    id: 'admin',
    name: 'Executive Management',
    tagline: 'Company Overview & Strategy',
    description: 'High-level business metrics, revenue, EBITDA, cash flow, invoicing management, and quotation pipeline.',
    canSeeCompanyFinancials: true,
    canSeeMarketing: false,
    canSeeInvoicing: true,
    canSeeAllVisits: true,
    canManagePricing: true,
    canSeeLeaderboard: true,
    primaryKPIs: [
      { key: 'revenue', label: 'Total Revenue', format: 'currency', trend: '+18.4% YoY' },
      { key: 'gross_profit', label: 'Gross Profit', format: 'currency', trend: '+14.2% YoY' },
      { key: 'ebitda', label: 'EBITDA', format: 'currency', trend: '+22.5% Margin' },
      { key: 'cash_flow', label: 'Net Cash Flow', format: 'currency', trend: 'Positive' },
      { key: 'collection_rate', label: 'Collection Rate', format: 'percent', trend: '89.4% On-time' }
    ]
  },
  CANVASSER: {
    id: 'canvasser',
    name: 'Field Sales & Canvassing',
    tagline: 'Field Visits & Client Relationships',
    description: 'Direct school visits, lead capture, follow-up logging, and competitive leaderboard.',
    canSeeCompanyFinancials: false,
    canSeeMarketing: false,
    canSeeInvoicing: false,
    canSeeAllVisits: false,
    canManagePricing: false,
    canSeeLeaderboard: true,
    primaryKPIs: [
      { key: 'school_visits', label: 'School Visits Logged', format: 'number', trend: 'Field Visits' },
      { key: 'orders_won', label: 'Orders Won', format: 'number', trend: 'Closed Deals' },
      { key: 'invoices_credited', label: 'Invoiced Sales', format: 'currency', trend: 'Admin Verified' },
      { key: 'commission_earned', label: 'Commission Earned', format: 'currency', trend: 'Slab Payout' },
      { key: 'commission_slab', label: 'Active Slab Tier', format: 'text', trend: '1% - 5% Tier' },
      { key: 'team_rank', label: 'Leaderboard Rank', format: 'text', trend: 'Team Position' }
    ]
  }
};

export function getUserRole(user) {
  if (!user) return 'canvasser';
  const r = (user.role || '').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'executive' || r === 'general manager') {
    return 'admin';
  }
  return 'canvasser';
}

export function isAdmin(user) {
  return getUserRole(user) === 'admin';
}

export function isCanvasser(user) {
  return getUserRole(user) === 'canvasser';
}

export function getRoleConfig(user) {
  return isAdmin(user) ? ROLES.ADMIN : ROLES.CANVASSER;
}

export function canAccessSensitiveFinancials(user) {
  return isAdmin(user);
}

export function canAccessMarketingHub(user) {
  return false;
}

export function canAccessInvoicing(user) {
  return isAdmin(user);
}
