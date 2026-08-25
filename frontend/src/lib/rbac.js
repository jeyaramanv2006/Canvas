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
    description: 'High-level business metrics, revenue, EBITDA, cash flow, invoicing management, and marketing ROI.',
    canSeeCompanyFinancials: true,
    canSeeMarketing: true,
    canSeeInvoicing: true,
    canSeeAllVisits: true,
    canManagePricing: true,
    canSeeLeaderboard: true,
    primaryKPIs: [
      { key: 'revenue', label: 'Total Revenue', format: 'currency', trend: '+18.4% YoY' },
      { key: 'gross_profit', label: 'Gross Profit', format: 'currency', trend: '+14.2% YoY' },
      { key: 'ebitda', label: 'EBITDA', format: 'currency', trend: '+22.5% Margin' },
      { key: 'cash_flow', label: 'Net Cash Flow', format: 'currency', trend: 'Positive' },
      { key: 'marketing_roi', label: 'Marketing ROI', format: 'multiplier', trend: '4.8x Return' },
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
      { key: 'leads_generated', label: 'Active Leads', format: 'number', trend: 'Pipeline' },
      { key: 'orders_won', label: 'Orders Won', format: 'number', trend: 'Closed Deals' },
      { key: 'invoices_credited', label: 'Invoiced Credited', format: 'currency', trend: 'Admin Verified' },
      { key: 'team_rank', label: 'Leaderboard Rank', format: 'text', trend: 'Team Position' },
      { key: 'conversion_pct', label: 'Visit to Won Rate', format: 'percent', trend: 'Win Rate' }
    ]
  }
};

export function getUserRole(user) {
  if (!user) return 'canvasser';
  const r = (user.role || '').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'kattakunjan' || r === 'executive') {
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
  return isAdmin(user);
}

export function canAccessInvoicing(user) {
  return isAdmin(user);
}
