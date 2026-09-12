export const COMPANY_DIVISIONS = [
  {
    id: 'ME',
    shortName: 'ME',
    fullName: 'Murugan Enterprises (ME)',
    tagline: 'Apparel & Accessories',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    headerGradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    borderClass: 'border-amber-500/30',
    accentColor: 'text-amber-400',
    products: [
      'Socks',
      'Ties',
      'Belts',
      'Shoes',
      'T-Shirts',
      'Tracks'
    ]
  },
  {
    id: 'RGR',
    shortName: 'RGR',
    fullName: 'RGR Uniforms & Suiting',
    tagline: 'Tailored Garments & Fabrics',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    headerGradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
    borderClass: 'border-blue-500/30',
    accentColor: 'text-blue-400',
    products: [
      'Stitched Shirts',
      'Stitched Trousers / Pants',
      'Fabrics Suiting',
      'Fabrics Shirting'
    ]
  },
  {
    id: 'KC',
    shortName: 'K&C',
    fullName: 'K&C Stationery & Supplies',
    tagline: 'Notebooks & Student Gear',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    headerGradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderClass: 'border-emerald-500/30',
    accentColor: 'text-emerald-400',
    products: [
      'Notebooks',
      'Stationery',
      'Bags'
    ]
  }
];

export const ALL_PRODUCTS = COMPANY_DIVISIONS.flatMap(d => d.products);

/**
 * Returns the company division for a given product name
 */
export function getProductCompany(productName) {
  if (!productName) return null;
  const clean = productName.toLowerCase();
  for (const div of COMPANY_DIVISIONS) {
    if (div.products.some(p => p.toLowerCase() === clean || clean.includes(p.toLowerCase()) || p.toLowerCase().includes(clean))) {
      return div;
    }
  }
  return null;
}
