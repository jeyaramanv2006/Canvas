import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * AestheticDatePicker - Luxury glassmorphic date picker with month calendar grid.
 * Clean, minimal, direct date picking with smooth Apple-like fluid feel.
 */
export default function AestheticDatePicker({
  value = '',
  onChange,
  placeholder = "Pick target date...",
  label = null,
  minDate = null,
  allowClear = true,
  className = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current selected date or fallback to today for view month
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth()); // 0-11

  // Synchronize view month when value changes
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // Click outside to close
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

  // Format date helper: returns "YYYY-MM-DD"
  const formatYMD = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = useMemo(() => {
    const now = new Date();
    return formatYMD(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Format readable label for display
  const displayLabel = useMemo(() => {
    if (!value) return null;
    try {
      const [y, m, d] = value.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = dateObj.getDate();
      const yearNum = dateObj.getFullYear();
      
      if (value === todayStr) {
        return `Today (${monthShort} ${dayNum})`;
      }
      
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      const tmrwStr = formatYMD(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate());
      if (value === tmrwStr) {
        return `Tomorrow (${monthShort} ${dayNum})`;
      }

      return `${monthShort} ${dayNum}, ${yearNum}`;
    } catch {
      return value;
    }
  }, [value, todayStr]);

  // Calendar calculations
  const monthData = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true
      });
    }

    // Next month padding to make full 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({
        day: n,
        month: viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (item) => {
    const dateStr = formatYMD(item.year, item.month, item.day);
    onChange?.(dateStr);
    setIsOpen(false);
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
          "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-left select-none",
          "bg-[#0f1118] hover:bg-[#151824] text-white border border-white/[0.08] hover:border-amber-400/40",
          "shadow-lg focus:outline-none focus:ring-1 focus:ring-amber-400/50",
          isOpen && "border-amber-400/60 ring-1 ring-amber-400/30 bg-[#151824]",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0" />
          <span className={cn(
            "text-xs truncate font-medium",
            !value ? "text-white/40" : "text-white font-bold"
          )}>
            {displayLabel || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {allowClear && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange?.('');
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <span className="text-[10px] font-semibold text-amber-400/80">
            Pick Date
          </span>
        </div>
      </button>

      {/* Custom Animated Calendar Popover (Solid Opaque - Non-Transparent) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute z-[9999] mt-2 w-72 sm:w-80 p-3.5 rounded-2xl",
              "bg-[#0f1118] border border-white/[0.15] shadow-2xl",
              "ring-1 ring-black/90 space-y-3 left-0"
            )}
          >
            {/* Calendar Month & Navigation */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <h4 className="text-xs font-black text-white tracking-wide">
                  {monthNames[viewMonth]} {viewYear}
                </h4>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setViewYear(now.getFullYear());
                      setViewMonth(now.getMonth());
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of week labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <span
                    key={d}
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      i === 0 || i === 6 ? "text-amber-400/60" : "text-white/30"
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthData.map((item, idx) => {
                  const dateStr = formatYMD(item.year, item.month, item.day);
                  const isSelected = value === dateStr;
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={`${dateStr}-${idx}`}
                      type="button"
                      onClick={() => handleSelectDay(item)}
                      className={cn(
                        "h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer relative",
                        !item.isCurrentMonth && "text-white/20 hover:text-white/40",
                        item.isCurrentMonth && !isSelected && "text-white/80 hover:bg-white/10 hover:text-white",
                        isToday && !isSelected && "border border-amber-400/50 text-amber-300 font-bold",
                        isSelected && "bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-black shadow-lg shadow-amber-400/30 scale-105"
                      )}
                    >
                      <span>{item.day}</span>
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
              <span className="text-white/40">
                {value ? `Selected: ${value}` : 'No date chosen'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
