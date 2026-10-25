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
                "p-3.5 rounded-2xl border transition-all bg-[#0d0e17]/70 backdrop-blur-md",
                divisionSelectedCount > 0 
                  ? cn(division.borderClass, "bg-[#0d0e17]/90 shadow-lg") 
                  : "border-white/[0.07] hover:border-white/15"
              )}
            >
              {/* Company Division Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-xl shadow-sm", division.badgeClass)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-white tracking-tight">{division.shortName}</h4>
                      <span className="text-[10px] text-white/40 font-medium">({division.fullName.replace(` (${division.shortName})`, '')})</span>
                    </div>
                  </div>
                </div>

                {divisionSelectedCount > 0 && (
                  <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm", division.badgeClass)}>
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
                        "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm",
                        isSelected
                          ? division.id === 'ME' 
                            ? "bg-gradient-to-r from-amber-400 to-amber-300 text-black border-amber-300 shadow-amber-400/20 font-black" 
                            : division.id === 'RGR' 
                            ? "bg-gradient-to-r from-blue-400 to-sky-300 text-black border-blue-300 shadow-blue-400/20 font-black" 
                            : "bg-gradient-to-r from-emerald-400 to-teal-300 text-black border-emerald-300 shadow-emerald-400/20 font-black"
                          : "bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white border-white/[0.08] hover:border-white/20"
                      )}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3] text-black shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/25 shrink-0" />
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
