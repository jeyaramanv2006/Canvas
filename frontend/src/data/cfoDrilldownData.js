// cfoDrilldownData.js — Full Traceability & Hierarchy Data Engine
// Supports level-by-level drilldown: Summary -> Category -> Customer/Supplier -> Product/SKU -> Invoice -> Transaction

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const CFO_REPORTS_DATA = {
  sales_trend: [
    { month: 'Jan', sales: 18, lastMonth: 16, growth: '+12.5%' },
    { month: 'Feb', sales: 21, lastMonth: 18, growth: '+16.7%' },
    { month: 'Mar', sales: 24, lastMonth: 21, growth: '+14.3%' },
    { month: 'Apr', sales: 22, lastMonth: 24, growth: '-8.3%' },
    { month: 'May', sales: 27, lastMonth: 22, growth: '+22.7%' },
    { month: 'Jun', sales: 32, lastMonth: 27, growth: '+18.5%' }
  ],
  gp_trend: [
    { month: 'Jan', gp: 6.5, gp_pct: 36, sales: 18 },
    { month: 'Feb', gp: 7.5, gp_pct: 35, sales: 21 },
    { month: 'Mar', gp: 8.5, gp_pct: 35, sales: 24 },
    { month: 'Apr', gp: 7.8, gp_pct: 35, sales: 22 },
    { month: 'May', gp: 9.2, gp_pct: 34, sales: 27 },
    { month: 'Jun', gp: 11.0, gp_pct: 34, sales: 32 }
  ],
  collection_vs_sales: [
    { month: 'Jan', sales: 18, collection: 16, ratio: 89 },
    { month: 'Feb', sales: 21, collection: 17, ratio: 81 },
    { month: 'Mar', sales: 24, collection: 18, ratio: 75 },
    { month: 'Apr', sales: 22, collection: 17, ratio: 77 },
    { month: 'May', sales: 27, collection: 20, ratio: 74 },
    { month: 'Jun', sales: 32, collection: 23, ratio: 72 }
  ],
  receivables_ageing: [
    { bucket: '0-30 Days', amount: 5.0, count: 18, color: '#8b5cf6', desc: 'Current invoices within standard credit cycle' },
    { bucket: '31-60 Days', amount: 2.5, count: 9, color: '#a855f7', desc: 'Moderate ageing — reminder notice dispatched' },
    { bucket: '61-90 Days', amount: 1.5, count: 5, color: '#6366f1', desc: 'Escalated to management for collection' },
    { bucket: '90+ Days', amount: 4.0, count: 4, color: '#ef4444', desc: 'CRITICAL: Immediate action required (33% of total)' }
  ],
  inventory_value: [
    { month: 'Jan', inventory: 22, lastMonth: 20 },
    { month: 'Feb', inventory: 23, lastMonth: 22 },
    { month: 'Mar', inventory: 24, lastMonth: 23 },
    { month: 'Apr', inventory: 25, lastMonth: 24 },
    { month: 'May', inventory: 28, lastMonth: 25 },
    { month: 'Jun', inventory: 30, lastMonth: 28 }
  ],
  cash_flow_trend: [
    { month: 'Jan', cash_in: 20, cash_out: 16, net_cf: 4 },
    { month: 'Feb', cash_in: 22, cash_out: 18, net_cf: 4 },
    { month: 'Mar', cash_in: 23, cash_out: 20, net_cf: 3 },
    { month: 'Apr', cash_in: 21, cash_out: 22, net_cf: -1 },
    { month: 'May', cash_in: 24, cash_out: 21, net_cf: 3 },
    { month: 'Jun', cash_in: 26, cash_out: 23, net_cf: 3 }
  ],
  mom_comparison: [
    { kpi: 'Sales', thisMonth: '₹32L', lastMonth: '₹27L', change: '↑ ₹5L', pctChange: '↑ 18.5%', positive: true, rawVal: 32 },
    { kpi: 'Gross Profit', thisMonth: '₹11.0L', lastMonth: '₹9.2L', change: '↑ ₹1.8L', pctChange: '↑ 19.5%', positive: true, rawVal: 11 },
    { kpi: 'GP %', thisMonth: '34%', lastMonth: '34%', change: '0 pp', pctChange: '0%', positive: true, rawVal: 34 },
    { kpi: 'Collection', thisMonth: '₹23L', lastMonth: '₹20L', change: '↑ ₹3L', pctChange: '↑ 15.0%', positive: true, rawVal: 23 },
    { kpi: 'Receivables', thisMonth: '₹12.0L', lastMonth: '₹10.0L', change: '↑ ₹2.0L', pctChange: '↑ 20.0%', positive: false, rawVal: 12 },
    { kpi: 'Overdue', thisMonth: '₹4.0L', lastMonth: '₹3.0L', change: '↑ ₹1.0L', pctChange: '↑ 33.3%', positive: false, alert: true, rawVal: 4 },
    { kpi: 'Inventory Value', thisMonth: '₹30L', lastMonth: '₹28L', change: '↑ ₹2L', pctChange: '↑ 7.1%', positive: true, rawVal: 30 },
    { kpi: 'Payables', thisMonth: '₹8L', lastMonth: '₹7L', change: '↑ ₹1L', pctChange: '↑ 14.3%', positive: false, rawVal: 8 },
    { kpi: 'Cash Balance', thisMonth: '₹1L', lastMonth: '₹0.8L', change: '↑ ₹0.2L', pctChange: '↑ 25.0%', positive: true, rawVal: 1 },
    { kpi: 'Bank Balance', thisMonth: '₹9L', lastMonth: '₹7.5L', change: '↑ ₹1.5L', pctChange: '↑ 20.0%', positive: true, rawVal: 9 }
  ],
  actual_vs_target: [
    { kpi: 'Sales', target: '₹35L', actual: '₹32L', achievement: '91%', gap: '↓ ₹3L', onTrack: true, rawAch: 91 },
    { kpi: 'Gross Profit', target: '₹12L', actual: '₹11.0L', achievement: '92%', gap: '↓ ₹1.0L', onTrack: true, rawAch: 92 },
    { kpi: 'GP %', target: '34%', actual: '34%', achievement: '100%', gap: '—', onTrack: true, rawAch: 100 },
    { kpi: 'Collection', target: '₹25L', actual: '₹23L', achievement: '92%', gap: '↓ ₹2L', onTrack: true, rawAch: 92 },
    { kpi: 'Inventory Value', target: '₹28L', actual: '₹30L', achievement: '107%', gap: '↑ ₹2L', onTrack: true, rawAch: 107 },
    { kpi: 'Overdue', target: '≤ ₹3L', actual: '₹4L', achievement: '133%', gap: '↑ ₹1L', onTrack: false, rawAch: 133 }
  ]
};

// Hierarchical Drill-down Engine
// Traces downwards: Root -> Category -> Customer -> Product -> Invoice -> Transaction
export const DRILLDOWN_HIERARCHY = {
  // 1. Sales Trend
  sales_trend: {
    title: 'Sales Performance Audit Trail',
    rootMetric: 'Sales',
    unit: '₹',
    getCategories: (month = 'Jun') => [
      { id: 'cat-socks', name: 'Socks & Hosiery', value: 1420000, formatted: '₹14.20 Lakh', share: '44.4%', itemsCount: 14 },
      { id: 'cat-belts', name: 'School Belts & Buckles', value: 1080000, formatted: '₹10.80 Lakh', share: '33.8%', itemsCount: 11 },
      { id: 'cat-ties', name: 'School Ties & Badges', value: 500000, formatted: '₹5.00 Lakh', share: '15.6%', itemsCount: 7 },
      { id: 'cat-accessories', name: 'Uniform Accessories & Identity Cards', value: 200000, formatted: '₹2.00 Lakh', share: '6.2%', itemsCount: 4 }
    ],
    getCustomers: (categoryId) => {
      if (categoryId === 'cat-socks') {
        return [
          { id: 'cust-xavier', name: "St. Xavier's Matric Higher Secondary School", district: 'Tirunelveli', value: 680000, formatted: '₹6.80 Lakh', share: '47.9%', invoiceCount: 3 },
          { id: 'cust-donbosco', name: 'Don Bosco Matriculation School', district: 'Chennai', value: 450000, formatted: '₹4.50 Lakh', share: '31.7%', invoiceCount: 2 },
          { id: 'cust-kendriya', name: 'Kendriya Vidyalaya Mandapam', district: 'Ramanathapuram', value: 290000, formatted: '₹2.90 Lakh', share: '20.4%', invoiceCount: 1 }
        ];
      }
      if (categoryId === 'cat-belts') {
        return [
          { id: 'cust-bharathi', name: 'Bharathi Vidya Bhavan Matriculation', district: 'Coimbatore', value: 520000, formatted: '₹5.20 Lakh', share: '48.1%', invoiceCount: 2 },
          { id: 'cust-stjohns', name: "St. John's International Residential School", district: 'Tenkasi', value: 360000, formatted: '₹3.60 Lakh', share: '33.3%', invoiceCount: 2 },
          { id: 'cust-stmarys', name: "St. Mary's Girls Hr Sec School", district: 'Madurai', value: 200000, formatted: '₹2.00 Lakh', share: '18.6%', invoiceCount: 1 }
        ];
      }
      return [
        { id: 'cust-general', name: 'Consolidated Institutional Clients', district: 'Tamil Nadu', value: 500000, formatted: '₹5.00 Lakh', share: '100%', invoiceCount: 4 }
      ];
    },
    getProducts: (customerId) => [
      { id: 'prd-custom-socks', name: 'Custom Logo Embroidered Cotton Socks (White/Navy)', sku: 'SCK-EMB-01', qty: 6500, rate: 85, value: 552500, formatted: '₹5.52 Lakh' },
      { id: 'prd-sports-socks', name: 'Terry Padded Athletic Sports Socks', sku: 'SCK-SPT-02', qty: 1500, rate: 85, value: 127500, formatted: '₹1.27 Lakh' }
    ],
    getInvoices: (customerId) => [
      { id: 'INV-2026-084', date: '2026-06-12', amount: 380000, formatted: '₹3.80 Lakh', status: 'Paid', paymentTerms: '30 Days', contact: 'Rev. Fr. Principal' },
      { id: 'INV-2026-092', date: '2026-06-20', amount: 300000, formatted: '₹3.00 Lakh', status: 'Partially Paid', paymentTerms: 'Immediate', contact: 'Accounts Dept' }
    ],
    getTransactions: (invoiceId) => [
      { id: 'TXN-8821', date: '2026-06-14', mode: 'Bank Transfer (NEFT)', ref: 'HDFCN2616584920', amount: 380000, formatted: '₹3.80 Lakh', creditedTo: 'Murugan Cards HDFC A/c 50200021' }
    ]
  },

  // 2. Gross Profit Trend
  gp_trend: {
    title: 'Gross Profit & Margin Audit Trail',
    rootMetric: 'Gross Profit',
    unit: '₹',
    getCategories: (month = 'Jun') => [
      { id: 'cat-socks', name: 'Socks & Hosiery', gp: 511200, sales: 1420000, gp_pct: '36.0%', formatted: '₹5.11 Lakh', cogs: '₹9.09 Lakh' },
      { id: 'cat-belts', name: 'School Belts & Buckles', gp: 378000, sales: 1080000, gp_pct: '35.0%', formatted: '₹3.78 Lakh', cogs: '₹7.02 Lakh' },
      { id: 'cat-ties', name: 'School Ties & Badges', gp: 150000, sales: 500000, gp_pct: '30.0%', formatted: '₹1.50 Lakh', cogs: '₹3.50 Lakh' },
      { id: 'cat-accessories', name: 'Uniform Accessories', gp: 60800, sales: 200000, gp_pct: '30.4%', formatted: '₹0.61 Lakh', cogs: '₹1.39 Lakh' }
    ],
    getProducts: (categoryId) => [
      { id: 'prd-custom-socks', name: 'Custom Logo Embroidered Cotton Socks', sales: 1100000, cogs: 704000, gp: 396000, gp_pct: '36.0%', formattedGP: '₹3.96 Lakh' },
      { id: 'prd-sports-socks', name: 'Terry Padded Athletic Sports Socks', sales: 320000, cogs: 204800, gp: 115200, gp_pct: '36.0%', formattedGP: '₹1.15 Lakh' }
    ],
    getCostBreakdown: (productId) => [
      { element: 'Direct Yarn & Raw Material', cost: 42.0, share: '65.6%', supplier: 'Coimbatore Spinning Mills Ltd' },
      { element: 'Knitting & Jacquard Embossing', cost: 12.0, share: '18.8%', supplier: 'Tiruppur Unit II' },
      { element: 'Packaging & Individual Polybag', cost: 5.0, share: '7.8%', supplier: 'Sivakasi Packaging Corp' },
      { element: 'Direct Freight & Inward Transit', cost: 5.0, share: '7.8%', supplier: 'VRL Logistics' }
    ]
  },

  // 3. Collection vs Sales
  collection_vs_sales: {
    title: 'Collections & Realization Trail',
    rootMetric: 'Collection',
    unit: '₹',
    getCustomers: (month = 'Jun') => [
      { id: 'cust-xavier', name: "St. Xavier's Matric Hr Sec School", sales: 680000, collected: 550000, pending: 130000, ratio: '80.9%', formatted: '₹5.50 Lakh' },
      { id: 'cust-bharathi', name: 'Bharathi Vidya Bhavan Matriculation', sales: 520000, collected: 480000, pending: 40000, ratio: '92.3%', formatted: '₹4.80 Lakh' },
      { id: 'cust-donbosco', name: 'Don Bosco Matriculation School', sales: 450000, collected: 350000, pending: 100000, ratio: '77.8%', formatted: '₹3.50 Lakh' },
      { id: 'cust-stjohns', name: "St. John's International Residential School", sales: 360000, collected: 250000, pending: 110000, ratio: '69.4%', formatted: '₹2.50 Lakh' },
      { id: 'cust-kendriya', name: 'Kendriya Vidyalaya Mandapam', sales: 290000, collected: 290000, pending: 0, ratio: '100.0%', formatted: '₹2.90 Lakh' },
      { id: 'cust-others', name: 'Other Institutional School Orders', sales: 900000, collected: 380000, pending: 520000, ratio: '42.2%', formatted: '₹3.80 Lakh' }
    ],
    getPendingInvoices: (customerId) => [
      { id: 'INV-2026-079', date: '2026-05-18', total: 250000, paid: 120000, balance: 130000, formattedBal: '₹1.30 Lakh', dueDays: 48, status: 'Overdue' }
    ],
    getTransactions: (invoiceId) => [
      { id: 'RCPT-1044', date: '2026-06-08', mode: 'Cheque Clearance', ref: 'SBI Chq #409211', amount: 120000, formatted: '₹1.20 Lakh' }
    ]
  },

  // 4. Receivables / Overdue
  receivables_ageing: {
    title: 'Accounts Receivable & Overdue Audit',
    rootMetric: 'Receivables',
    unit: '₹',
    getBuckets: () => [
      { id: 'bkt-0-30', bucket: '0-30 Days', amount: 500000, formatted: '₹5.00 Lakh', status: 'Healthy', color: '#8b5cf6', accounts: 18 },
      { id: 'bkt-31-60', bucket: '31-60 Days', amount: 250000, formatted: '₹2.50 Lakh', status: 'Notice Sent', color: '#a855f7', accounts: 9 },
      { id: 'bkt-61-90', bucket: '61-90 Days', amount: 150000, formatted: '₹1.50 Lakh', status: 'Escalated', color: '#6366f1', accounts: 5 },
      { id: 'bkt-90-plus', bucket: '90+ Days', amount: 400000, formatted: '₹4.00 Lakh', status: 'CRITICAL OVERDUE', color: '#ef4444', accounts: 4 }
    ],
    getCustomersByBucket: (bucketId) => {
      if (bucketId === 'bkt-90-plus') {
        return [
          { id: 'cust-merit', name: 'Merit Matriculation School', district: 'Salem', amount: 160000, formatted: '₹1.60 Lakh', overdueDays: 114, invoiceId: 'INV-2026-031' },
          { id: 'cust-sunflower', name: 'Sunflower Academy Residential', district: 'Coimbatore', amount: 120000, formatted: '₹1.20 Lakh', overdueDays: 102, invoiceId: 'INV-2026-042' },
          { id: 'cust-vivekananda', name: 'Vivekananda Vidyalaya', district: 'Dharmapuri', amount: 80000, formatted: '₹0.80 Lakh', overdueDays: 98, invoiceId: 'INV-2026-048' },
          { id: 'cust-littleflower', name: 'Little Flower Convent School', district: 'Theni', amount: 40000, formatted: '₹0.40 Lakh', overdueDays: 95, invoiceId: 'INV-2026-054' }
        ];
      }
      return [
        { id: 'cust-xavier', name: "St. Xavier's Matriculation School", district: 'Tirunelveli', amount: 130000, formatted: '₹1.30 Lakh', overdueDays: 24, invoiceId: 'INV-2026-088' },
        { id: 'cust-stjohns', name: "St. John's International", district: 'Tenkasi', amount: 110000, formatted: '₹1.10 Lakh', overdueDays: 18, invoiceId: 'INV-2026-091' }
      ];
    },
    getInvoiceDetail: (invoiceId) => ({
      invoiceId: invoiceId || 'INV-2026-031',
      date: '2026-02-14',
      school: 'Merit Matriculation School',
      principal: 'Dr. R. Ramanathan, Principal',
      phone: '+91 94431 82941',
      billedAmount: 240000,
      paidAmount: 80000,
      overdueBalance: 160000,
      items: [
        { name: 'Embroidered Ties (Standard)', qty: 1200, total: '₹96,000' },
        { name: 'Woven Belts with Crest', qty: 1200, total: '₹1,44,000' }
      ]
    })
  },

  // 5. Inventory Value
  inventory_value: {
    title: 'Inventory Valuation & Warehouse Audit',
    rootMetric: 'Inventory',
    unit: '₹',
    getCategories: (month = 'Jun') => [
      { id: 'inv-raw-yarn', name: 'Raw Materials & Yarn Spools', value: 1200000, formatted: '₹12.00 Lakh', share: '40.0%', location: 'Tiruppur Mill Warehouse' },
      { id: 'inv-finished-goods', name: 'Finished Goods (Socks, Belts, Ties)', value: 1150000, formatted: '₹11.50 Lakh', share: '38.3%', location: 'Madurai Central Hub' },
      { id: 'inv-wip', name: 'Work in Progress (Knitting & Weaving)', value: 450000, formatted: '₹4.50 Lakh', share: '15.0%', location: 'Production Line B' },
      { id: 'inv-packaging', name: 'Boxes, Buckles & Metal Hardware', value: 200000, formatted: '₹2.00 Lakh', share: '6.7%', location: 'Hardware Storage Unit' }
    ],
    getSKUs: (categoryId) => [
      { id: 'sku-01', name: 'Mercerized Cotton Combed Yarn 30s', qty: '3,200 kg', rate: '₹250/kg', value: 800000, formatted: '₹8.00 Lakh', minStock: '1,500 kg', status: 'Optimal' },
      { id: 'sku-02', name: 'High Elastic Spandex Rubber Thread', qty: '1,600 kg', rate: '₹250/kg', value: 400000, formatted: '₹4.00 Lakh', minStock: '800 kg', status: 'Optimal' }
    ]
  },

  // 6. Cash Flow Trend
  cash_flow_trend: {
    title: 'Cash Flow & Banking Statement Ledger',
    rootMetric: 'Cash Flow',
    unit: '₹',
    getFlowSummary: (month = 'Jun') => ({
      cashIn: 2600000,
      formattedIn: '₹26.00 Lakh',
      cashOut: 2300000,
      formattedOut: '₹23.00 Lakh',
      netCash: 300000,
      formattedNet: '₹3.00 Lakh',
      breakdownIn: [
        { category: 'Customer School Invoice Collections', amount: 2300000, formatted: '₹23.00 Lakh', share: '88.5%' },
        { category: 'Advance Deposits for New Academic Orders', amount: 250000, formatted: '₹2.50 Lakh', share: '9.6%' },
        { category: 'Interest & Scrap Realization', amount: 50000, formatted: '₹0.50 Lakh', share: '1.9%' }
      ],
      breakdownOut: [
        { category: 'Direct Raw Material Supplier Payables', amount: 1400000, formatted: '₹14.00 Lakh', share: '60.9%' },
        { category: 'Factory Operations, Power & Wages', amount: 450000, formatted: '₹4.50 Lakh', share: '19.6%' },
        { category: 'Field Canvasser Incentives & Commission', amount: 210000, formatted: '₹2.10 Lakh', share: '9.1%' },
        { category: 'Freight, Logistics & Courier Dispatch', amount: 140000, formatted: '₹1.40 Lakh', share: '6.1%' },
        { category: 'GST & Statutory Tax Remittance', amount: 100000, formatted: '₹1.00 Lakh', share: '4.3%' }
      ]
    }),
    getTransactionsByCategory: (catName) => [
      { id: 'TXN-BANK-901', date: '2026-06-25', payee: 'Coimbatore Spinning Mills', desc: 'Raw yarn batch #401 procurement', amount: 750000, formatted: '₹7.50 Lakh', mode: 'RTGS' },
      { id: 'TXN-BANK-904', date: '2026-06-27', payee: 'Southern Buckle Foundry', desc: 'Brass crest buckles delivery', amount: 350000, formatted: '₹3.50 Lakh', mode: 'NEFT' }
    ]
  }
};
