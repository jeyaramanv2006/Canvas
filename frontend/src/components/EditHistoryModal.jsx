import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, User, Clock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function EditHistoryModal({ isOpen, onClose, visit }) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !visit) return null;

  const history = Array.isArray(visit.edit_history) ? visit.edit_history : [];

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0c0d15]/95 border border-white/[0.12] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto backdrop-blur-2xl"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-black/40 sticky top-0 z-10">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-300 flex items-center justify-center font-bold text-lg border border-amber-400/30 shadow-inner">
                <History className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight">Edit &amp; Audit History</h2>
                <p className="text-xs text-white/50 mt-0.5">
                  {visit.school_name} • <span className="text-amber-400 font-bold">{history.length} revision{history.length === 1 ? '' : 's'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-white/10">
            
            {/* Initial Log metadata */}
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Created by {visit.canvasser_name || 'Nettakunjan'}</p>
                  <p className="text-[11px] text-white/40">Initial Field Visit Entry</p>
                </div>
              </div>
              <span className="text-[11px] text-white/50 font-mono">
                {visit.created_at ? new Date(visit.created_at).toLocaleString() : 'Initial'}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 bg-black/30 rounded-2xl border border-white/[0.06] p-4">
                <p className="text-xs text-white/40">No subsequent edit records found for this visit.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
                {history.map((entry, idx) => {
                  const isManager = entry.editor_role?.toLowerCase().includes('manager');
                  const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '';

                  return (
                    <div key={entry.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#0c0d15] ${
                        isManager ? 'bg-amber-400 ring-2 ring-amber-400/20' : 'bg-emerald-400 ring-2 ring-emerald-400/20'
                      }`} />

                      <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-md hover:border-white/20 transition-all backdrop-blur-md">
                        
                        {/* Entry Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                              isManager 
                                ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' 
                                : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
                            }`}>
                              {entry.editor_role || 'User'}
                            </span>
                            <span className="text-xs font-bold text-white">{entry.editor_name}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-[11px] text-white/40 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {/* Diff List */}
                        <div className="space-y-1.5 pt-1">
                          {entry.changes && entry.changes.map((chg, cIdx) => (
                            <div key={cIdx} className="text-xs bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">{chg.field}:</span>
                              <div className="flex items-center space-x-2 text-[11px]">
                                <span className="line-through text-white/40 max-w-[120px] truncate" title={chg.from}>{chg.from}</span>
                                <ArrowRight className="w-3 h-3 text-white/30 shrink-0" />
                                <span className="font-bold text-emerald-400 max-w-[140px] truncate" title={chg.to}>{chg.to}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/40 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Audit Trail
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
