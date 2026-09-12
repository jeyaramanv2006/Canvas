import React from 'react';
import { motion } from 'framer-motion';
import { Check, Building2, ShoppingBag, Shirt, BookOpen } from 'lucide-react';
import { COMPANY_DIVISIONS } from '../lib/companyProducts';
import { cn } from '../lib/utils';

export default function CompanyProductSelector({ selectedProducts = [], onToggleProduct }) {
  const getDivisionIcon = (id) => {
    switch (id) {
      case 'ME':
        return ShoppingBag;
      case 'RGR':
        return Shirt;
      case 'KC':
        return BookOpen;
      default:
        return Building2;
    }
  };

  const totalSelected = selectedProducts.length;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            Product Interests by Company Division
          </p>
        </div>
        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          {totalSelected} Product{totalSelected === 1 ? '' : 's'} Selected
        </span>
      </div>

      <div className="space-y-3">
        {COMPANY_DIVISIONS.map(division => {
          const Icon = getDivisionIcon(division.id);
          const divisionSelectedCount = division.products.filter(p => selectedProducts.includes(p)).length;

          return (
            <div 
              key={division.id}
              className={cn(
                "p-3.5 rounded-2xl border transition-all bg-black/40",
                divisionSelectedCount > 0 ? division.borderClass : "border-white/5"
              )}
            >
              {/* Company Division Header */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", division.badgeClass)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-white">{division.shortName}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">({division.fullName.replace(` (${division.shortName})`, '')})</span>
                    </div>
                  </div>
                </div>

                {divisionSelectedCount > 0 && (
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", division.badgeClass)}>
                    {divisionSelectedCount} selected
                  </span>
                )}
              </div>

              {/* Product Pills for this Company */}
              <div className="flex flex-wrap gap-2">
                {division.products.map(product => {
                  const isSelected = selectedProducts.includes(product);

                  return (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      key={product}
                      onClick={() => onToggleProduct(product)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                        isSelected
                          ? cn("bg-white text-black shadow-md font-black", division.id === 'ME' && "bg-amber-400 text-black border-amber-300", division.id === 'RGR' && "bg-blue-400 text-black border-blue-300", division.id === 'KC' && "bg-emerald-400 text-black border-emerald-300")
                          : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:border-white/20"
                      )}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      )}
                      <span>{product}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
