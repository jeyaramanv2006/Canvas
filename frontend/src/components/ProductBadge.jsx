import React from 'react';
import { getProductCompany } from '../lib/companyProducts';
import { cn } from '../lib/utils';

export default function ProductBadge({ product, className = '' }) {
  const company = getProductCompany(product);

  let badgeColor = "bg-white/10 text-gray-300 border-white/10";
  let prefix = "";

  if (company) {
    prefix = `${company.shortName}: `;
    if (company.id === 'ME') {
      badgeColor = "bg-amber-500/15 text-amber-300 border-amber-500/30";
    } else if (company.id === 'RGR') {
      badgeColor = "bg-blue-500/15 text-blue-300 border-blue-500/30";
    } else if (company.id === 'KC') {
      badgeColor = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    }
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border",
      badgeColor,
      className
    )}>
      <span className="opacity-75 font-black">{prefix}</span>
      <span>{product}</span>
    </span>
  );
}
