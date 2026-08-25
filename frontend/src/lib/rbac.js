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
    description: 'High-level business metrics, revenue, EBITDA, cash flow, and marketing ROI.',
    canSeeCompanyFinancials: true,
    canSeeMarketing: true,
    canSeeAllVisits: true,
    canManagePricing: true,
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
    tagline: 'Field Visits & Order Fulfillment',
    description: 'Direct school visits, lead capture, sales quotations, and closed orders.',
    canSeeCompanyFinancials: false,
    canSeeMarketing: true,
    canSeeAllVisits: false,
    canManagePricing: false,
    primaryKPIs: [
      { key: 'school_visits', label: 'School Visits Logged', format: 'number', trend: 'Field Visits' },
      { key: 'leads_generated', label: 'Active Leads', format: 'number', trend: 'Pipeline' },
      { key: 'quotations_issued', label: 'Quotations Created', format: 'number', trend: 'Formal Pricing' },
      { key: 'orders_won', label: 'Orders Won', format: 'number', trend: 'Closed Deals' },
      { key: 'order_value', label: 'Direct Order Value', format: 'currency', trend: 'Sales Booked' },
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
  return true;
}
