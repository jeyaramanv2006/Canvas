import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, User, Clock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function EditHistoryModal({ isOpen, onClose, visit }) {
  if (!isOpen || !visit) return null;

  const history = Array.isArray(visit.edit_history) ? visit.edit_history : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-murugan-card border border-white/10 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40 sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-murugan-accent/20 text-murugan-accent flex items-center justify-center font-bold text-lg border border-murugan-accent/30">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Edit & Audit History</h2>
                <p className="text-xs text-gray-400">
                  {visit.school_name} • <span className="text-murugan-accent font-semibold">{history.length} revision{history.length === 1 ? '' : 's'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Initial Log metadata */}
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-bold text-gray-200">Created by {visit.canvasser_name || 'Nettakunjan'}</p>
                  <p className="text-[11px] text-gray-400">Initial Field Visit Entry</p>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                {visit.created_at ? new Date(visit.created_at).toLocaleString() : 'Initial'}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5 p-4">
                <p className="text-xs text-gray-400">No subsequent edit records found for this visit.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {history.map((entry, idx) => {
                  const isManager = entry.editor_role?.toLowerCase().includes('manager');
                  const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '';

                  return (
                    <div key={entry.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-murugan-card ${
                        isManager ? 'bg-amber-400 ring-2 ring-amber-400/20' : 'bg-murugan-accent ring-2 ring-murugan-accent/20'
                      }`} />

                      <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3 shadow-md hover:border-white/20 transition-all">
                        
                        {/* Entry Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                              isManager 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                : 'bg-murugan-accent/20 text-murugan-accent border-murugan-accent/30'
                            }`}>
                              {entry.editor_role || 'User'}
                            </span>
                            <span className="text-xs font-bold text-white">{entry.editor_name}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-[11px] text-gray-400 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {/* Diff List */}
                        <div className="space-y-1.5 pt-1">
                          {entry.changes && entry.changes.map((chg, cIdx) => (
                            <div key={cIdx} className="text-xs bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-semibold text-murugan-accent text-[11px] uppercase tracking-wider">{chg.field}:</span>
                              <div className="flex items-center space-x-1.5 text-gray-300 text-[11px]">
                                <span className="line-through text-gray-500 max-w-[120px] truncate" title={chg.from}>{chg.from}</span>
                                <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
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
          <div className="p-4 border-t border-white/10 bg-black/40 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition"
            >
              Close Audit Trail
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
