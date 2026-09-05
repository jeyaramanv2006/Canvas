/**
 * Role-Based Access Control (RBAC)
 * Murugan Canvass Platform
 *
 * Roles:
 * 1. CEO   — ROLE_CEO / SUPER_ADMIN  — Global unrestricted
 * 2. CFO   — ROLE_CFO               — Executive Financial & Administrative
 * 3. CCO   — ROLE_CCO               — Executive Operations & Administrative (TBD)
 * 4. ADMIN_EXEC — ROLE_ADMIN_EXEC   — Data Management & Operational Support
 * 5. CANVASSER  — ROLE_CANVASSER    — Field Collection & Personal Submission History
 */

export const ROLES = {
  CEO: {
    id: 'ceo',
    name: 'Chief Executive Officer',
    shortName: 'CEO',
    tagline: 'Global Overview & Strategic Command',
    description: 'Unrestricted access to all dashboards, financials, operations, and user management.',
    accessScope: 'Global / Unrestricted',
    // Dashboard Access
    canSeeCEODashboard: true,
    canSeeCFODashboard: true,
    canSeeCCODashboard: true,
    // Operational Access
    canSeeCompanyFinancials: true,
    canSeeInvoicing: true,
    canSeeAllVisits: true,
    canManagePricing: true,
    canSeeLeaderboard: true,
    canSeeMarketing: false,
    // Admin Access
    canManageUsers: true,
    canAccessAdminPanel: true,
    isDashboardLocked: false,
    primaryKPIs: [
      { key: 'revenue',         label: 'Total Sales',       format: 'currency', trend: '+25% vs Last Month' },
      { key: 'gross_profit',    label: 'Gross Profit',      format: 'currency', trend: '+12% vs Last Month' },
      { key: 'gp_percent',      label: 'GP %',              format: 'percent',  trend: '-4pp vs Last Month' },
      { key: 'collection_rate', label: 'Collection',        format: 'currency', trend: '90% of Target' },
      { key: 'overdue',         label: 'Overdue',           format: 'currency', trend: 'Immediate Action' }
    ]
  },

  CFO: {
    id: 'cfo',
    name: 'Chief Financial Officer',
    shortName: 'CFO',
    tagline: 'Financial Performance & Health',
    description: 'Full access to revenue, expense, ROI, financial reporting and analytics.',
    accessScope: 'Executive Financial & Administrative',
    // Dashboard Access
    canSeeCEODashboard: false,
    canSeeCFODashboard: true,
    canSeeCCODashboard: false,
    // Operational Access
    canSeeCompanyFinancials: true,
    canSeeInvoicing: true,
    canSeeAllVisits: true,
    canManagePricing: true,
    canSeeLeaderboard: true,
    canSeeMarketing: false,
    // Admin Access
    canManageUsers: true,
    canAccessAdminPanel: true,
    isDashboardLocked: false,
    primaryKPIs: [
      { key: 'revenue',        label: 'Sales',         format: 'currency', trend: '+25% vs Last Month' },
      { key: 'gross_profit',   label: 'Gross Profit',  format: 'currency', trend: '+12% vs Last Month' },
      { key: 'gp_percent',     label: 'GP %',          format: 'percent',  trend: '-4pp vs Last Month' },
      { key: 'collection',     label: 'Collection',    format: 'currency', trend: '90% of Target' },
      { key: 'receivables',    label: 'Receivables',   format: 'currency', trend: '+₹2L vs Last Month' }
    ]
  },

  CCO: {
    id: 'cco',
    name: 'Chief Commercial Officer',
    shortName: 'CCO',
    tagline: 'Commercial Operations & Field Performance',
    description: 'Full access to canvassing analytics, conversion rates, field KPIs, and sales metrics.',
    accessScope: 'Executive Operations & Administrative',
    // Dashboard Access
    canSeeCEODashboard: false,
    canSeeCFODashboard: false,
    canSeeCCODashboard: true,
    // Operational Access
    canSeeCompanyFinancials: false,
    canSeeInvoicing: true,
    canSeeAllVisits: true,
    canManagePricing: false,
    canSeeLeaderboard: true,
    canSeeMarketing: false,
    // Admin Access
    canManageUsers: true,
    canAccessAdminPanel: true,
    isDashboardLocked: false,
    primaryKPIs: [
      { key: 'school_visits',  label: 'School Visits',      format: 'number', trend: 'This Month' },
      { key: 'conversion',     label: 'Conversion Rate',    format: 'percent', trend: 'Visits → Won' },
      { key: 'orders_won',     label: 'Orders Won',         format: 'number', trend: 'Closed Deals' },
      { key: 'revenue',        label: 'Sales Generated',    format: 'currency', trend: '+25% vs LM' },
      { key: 'team_size',      label: 'Active Canvassers',  format: 'number', trend: 'Field Team' }
    ]
  },

  ADMIN_EXEC: {
    id: 'admin_exec',
    name: 'Admin Executive',
    shortName: 'Admin',
    tagline: 'Data Management & Operational Support',
    description: 'Edit, update and maintain field data, canvasser entries and operational records.',
    accessScope: 'Data Management & Operational Support',
    // Dashboard Access — STRICTLY LOCKED
    canSeeCEODashboard: false,
    canSeeCFODashboard: false,
    canSeeCCODashboard: false,
    // Operational Access
    canSeeCompanyFinancials: false,
    canSeeInvoicing: true,
    canSeeAllVisits: true,
    canManagePricing: false,
    canSeeLeaderboard: true,
    canSeeMarketing: false,
    // Admin Access
    canManageUsers: false,
    canAccessAdminPanel: false,
    isDashboardLocked: true,   // Blocked from /dashboards/* routes
    primaryKPIs: [
      { key: 'school_visits',  label: 'Total Field Visits',  format: 'number', trend: 'All Canvassers' },
      { key: 'open_leads',     label: 'Open Leads',          format: 'number', trend: 'Pending Follow-up' },
      { key: 'sample_sent',    label: 'Samples Sent',        format: 'number', trend: 'Awaiting Response' },
      { key: 'orders_won',     label: 'Orders Won',          format: 'number', trend: 'Invoiced' },
      { key: 'team_size',      label: 'Canvassers Active',   format: 'number', trend: 'Field Team' }
    ]
  },

  CANVASSER: {
    id: 'canvasser',
    name: 'Field Sales Executive',
    shortName: 'Canvasser',
    tagline: 'Field Visits & Client Relationships',
    description: 'Direct school visits, lead capture, follow-up logging, and competitive leaderboard.',
    accessScope: 'Field Collection & Personal Submission History',
    // Dashboard Access
    canSeeCEODashboard: false,
    canSeeCFODashboard: false,
    canSeeCCODashboard: false,
    // Operational Access
    canSeeCompanyFinancials: false,
    canSeeInvoicing: false,
    canSeeAllVisits: false,
    canManagePricing: false,
    canSeeLeaderboard: true,
    canSeeMarketing: false,
    // Admin Access
    canManageUsers: false,
    canAccessAdminPanel: false,
    isDashboardLocked: false,
    primaryKPIs: [
      { key: 'school_visits',     label: 'School Visits Logged', format: 'number',   trend: 'Field Visits' },
      { key: 'orders_won',        label: 'Orders Won',           format: 'number',   trend: 'Closed Deals' },
      { key: 'invoices_credited', label: 'Invoiced Sales',       format: 'currency', trend: 'Admin Verified' },
      { key: 'commission_earned', label: 'Commission Earned',    format: 'currency', trend: 'Slab Payout' },
      { key: 'commission_slab',   label: 'Active Slab Tier',     format: 'text',     trend: '1% - 5% Tier' },
      { key: 'team_rank',         label: 'Leaderboard Rank',     format: 'text',     trend: 'Team Position' }
    ]
  }
};

// ─── Role Resolution ────────────────────────────────────────────────────────

export function getUserRole(user) {
  if (!user) return 'canvasser';
  const r = (user.role || '').toLowerCase();
  if (r === 'ceo' || r === 'super_admin') return 'ceo';
  if (r === 'cfo') return 'cfo';
  if (r === 'cco') return 'cco';
  if (r === 'admin_exec' || r === 'admin' || r === 'manager' || r === 'executive' || r === 'general manager') return 'admin_exec';
  return 'canvasser';
}

export function isCEO(user)       { return getUserRole(user) === 'ceo'; }
export function isCFO(user)       { return getUserRole(user) === 'cfo'; }
export function isCCO(user)       { return getUserRole(user) === 'cco'; }
export function isAdminExec(user) { return getUserRole(user) === 'admin_exec'; }
export function isCanvasser(user) { return getUserRole(user) === 'canvasser'; }

/** Legacy alias — anything above canvasser is considered "admin" for old code */
export function isAdmin(user) {
  const role = getUserRole(user);
  return role === 'ceo' || role === 'cfo' || role === 'cco' || role === 'admin_exec';
}

export function getRoleConfig(user) {
  const role = getUserRole(user);
  return ROLES[role.toUpperCase()] || ROLES.CANVASSER;
}

export function canAccessSensitiveFinancials(user) {
  const role = getUserRole(user);
  return role === 'ceo' || role === 'cfo';
}

export function canAccessMarketingHub(_user) {
  return false;
}

export function canAccessInvoicing(user) {
  return isAdmin(user);
}

export function isDashboardLocked(user) {
  return getRoleConfig(user).isDashboardLocked === true;
}

/** Returns the correct home route for a given user role */
export function getHomeRoute(user) {
  const role = getUserRole(user);
  switch (role) {
    case 'ceo':        return '/ceo';
    case 'cfo':        return '/cfo';
    case 'cco':        return '/cco';
    case 'admin_exec': return '/manager';
    default:           return '/canvasser';
  }
}
