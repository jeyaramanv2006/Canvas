import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * AestheticSelect - Premium dark glassmorphic custom dropdown
 * Replaces plain HTML <select> with fluid animations, custom search, and Lucid Block styling.
 */
export default function AestheticSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select option...",
  label = null,
  icon: Icon = null,
  searchable = false,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  disabled = false,
  size = "md" // "sm" | "md" | "lg"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find(opt => 
    typeof opt === 'object' ? String(opt.id ?? opt.value) === String(value) : String(opt) === String(value)
  );

  const displayLabel = selectedOption 
    ? (typeof selectedOption === 'object' ? (selectedOption.label ?? selectedOption.name ?? selectedOption.value) : selectedOption)
    : placeholder;

  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter(opt => {
        const text = typeof opt === 'object' ? (opt.label || opt.name || opt.value || '') : String(opt);
        return text.toLowerCase().includes(searchTerm.toLowerCase().trim());
      })
    : options;

  const handleSelect = (optVal) => {
    onChange?.(optVal);
    setIsOpen(false);
    setSearchTerm('');
  };

  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs rounded-xl",
    md: "py-2 px-3.5 text-xs rounded-xl",
    lg: "py-2.5 px-4 text-sm rounded-2xl"
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full text-left", className)}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer text-left select-none",
          "bg-[#0e1017]/90 hover:bg-[#141724]/90 text-white border border-white/[0.08] hover:border-amber-400/40",
          "shadow-lg backdrop-blur-xl focus:outline-none focus:ring-1 focus:ring-amber-400/50",
          isOpen && "border-amber-400/60 ring-1 ring-amber-400/30 bg-[#141724]",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          sizeClasses[size] || sizeClasses.md,
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {Icon && <Icon className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className={cn(
            "truncate font-medium",
            !selectedOption ? "text-white/40" : "text-white"
          )}>
            {displayLabel}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="shrink-0 text-white/50 group-hover:text-amber-400"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute z-[999] mt-1.5 w-full min-w-[180px] max-h-64 overflow-hidden rounded-2xl",
              "bg-[#0f1118] border border-white/[0.15] shadow-2xl flex flex-col",
              "ring-1 ring-black/80 p-1.5",
              dropdownClassName
            )}
          >
            {/* Search Input if enabled */}
            {searchable && (
              <div className="relative p-1 mb-1 border-b border-white/[0.06]">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
                  autoFocus
                />
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto max-h-52 space-y-0.5 custom-scrollbar pr-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-white/40 font-medium">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const optVal = typeof opt === 'object' ? (opt.id ?? opt.value) : opt;
                  const optLabel = typeof opt === 'object' ? (opt.label ?? opt.name ?? opt.value) : opt;
                  const isSelected = String(optVal) === String(value);

                  return (
                    <button
                      key={String(optVal)}
                      type="button"
                      onClick={() => handleSelect(optVal)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer text-left",
                        isSelected
                          ? "bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 font-bold border border-amber-500/30 shadow-sm"
                          : "text-white/80 hover:text-white hover:bg-white/[0.06]"
                      )}
                    >
                      <span className="truncate">{optLabel}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
