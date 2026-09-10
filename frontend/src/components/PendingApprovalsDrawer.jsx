import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Users, 
  Percent, 
  X, 
  AlertCircle,
  ArrowRight,
  UserPlus,
  Shield,
  PauseCircle,
  PlayCircle,
  Trash2
} from 'lucide-react';
import { mockApi } from '../mockApi';

export default function PendingApprovalsDrawer({ isOpen, onClose, currentUser, onApprovalUpdated }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadApprovals();
    }
  }, [isOpen]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('mg_pending_approvals');
      if (stored) {
        setApprovals(JSON.parse(stored));
      } else {
        const defaultApprovals = [
          {
            id: "APP-101",
            type: "SCHOOL_CREATION",
            title: "New School Addition: SBOA Matriculation Higher Secondary",
            requestedBy: "Admin Executive (Admin)",
            requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            details: {
              school_name: "SBOA Matriculation Higher Secondary",
              district: "Madurai",
              cluster: "Madurai Southzone",
              board: "MATRIC",
              student_strength: 1450,
              contact_person: "Fr. Jacob (Principal)"
            },
            status: "PENDING"
          }
        ];
        localStorage.setItem('mg_pending_approvals', JSON.stringify(defaultApprovals));
        setApprovals(defaultApprovals);
      }
    } catch (e) {
      console.error("Failed to load approvals", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (approvalId, action) => {
    setProcessingId(approvalId);
    try {
      const targetReq = approvals.find(a => a.id === approvalId);

      // If approved, execute the corresponding data modification
      if (action === 'APPROVE' && targetReq) {
        if (targetReq.type === 'USER_CREATION') {
          await mockApi.createUser(targetReq.details);
        } else if (targetReq.type === 'ROLE_CHANGE') {
          await mockApi.updateUserRole(targetReq.details.target_user_id, targetReq.details.requested_role);
        } else if (targetReq.type === 'USER_PAUSE') {
          await mockApi.pauseUser(targetReq.details.target_user_id);
        } else if (targetReq.type === 'USER_RESUME') {
          await mockApi.resumeUser(targetReq.details.target_user_id);
        } else if (targetReq.type === 'USER_DELETE') {
          await mockApi.deleteUser(targetReq.details.target_user_id);
        } else if (targetReq.type === 'SCHOOL_CREATION' || targetReq.type === 'SCHOOL_CREATE') {
          await mockApi.createMasterSchool(targetReq.details);
        } else if (targetReq.type === 'SCHOOL_EDIT') {
          await mockApi.updateMasterSchool(targetReq.details.target_school_id || targetReq.details.id, targetReq.details);
        } else if (targetReq.type === 'SCHOOL_DELETE') {
          await mockApi.deleteMasterSchool(targetReq.details.target_school_id || targetReq.details.id);
        }
      }

      const updated = approvals.map(a => {
        if (a.id === approvalId) {
          return {
            ...a,
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUser?.name || 'CEO'
          };
        }
        return a;
      });
      localStorage.setItem('mg_pending_approvals', JSON.stringify(updated));
      setApprovals(updated);
      if (onApprovalUpdated) onApprovalUpdated();
    } catch (e) {
      alert("Failed to process approval: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const pendingList = approvals.filter(a => a.status === 'PENDING');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-[#14151b] border-l border-white/10 h-full flex flex-col shadow-2xl text-white"
      >
        {/* Drawer Header */}
        <div className="p-5 bg-[#181922] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">CEO Governance & Approval Center</h2>
              <p className="text-[11px] text-gray-400">Review requests from Admin Executives & Operations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Requests */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-300">Pending Review ({pendingList.length})</span>
            <span className="text-[10px] text-amber-400 uppercase font-semibold">Direct CEO Authority</span>
          </div>

          {loading ? (
            <p className="text-gray-500 text-center py-10 text-xs">Loading queue...</p>
          ) : pendingList.length === 0 ? (
            <div className="text-center py-16 p-6 bg-black/30 rounded-3xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">All Clear!</p>
              <p className="text-xs text-gray-400">No pending administrative approval requests.</p>
            </div>
          ) : (
            pendingList.map(req => (
              <div key={req.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 shadow-lg space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    {req.type === 'USER_CREATION' && <UserPlus className="w-4 h-4 text-emerald-400" />}
                    {req.type === 'ROLE_CHANGE' && <Shield className="w-4 h-4 text-purple-400" />}
                    {req.type === 'USER_PAUSE' && <PauseCircle className="w-4 h-4 text-amber-400" />}
                    {req.type === 'USER_RESUME' && <PlayCircle className="w-4 h-4 text-emerald-400" />}
                    {req.type === 'USER_DELETE' && <Trash2 className="w-4 h-4 text-rose-400" />}
                    {req.type === 'SCHOOL_CREATION' && <Building2 className="w-4 h-4 text-blue-400" />}
                    {req.type === 'DISCOUNT_APPROVAL' && <Percent className="w-4 h-4 text-amber-400" />}
                    <span className="text-xs font-bold text-white">{req.title}</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    {req.id}
                  </span>
                </div>

                <div className="bg-white/5 p-3 rounded-xl text-xs space-y-1 text-gray-300">
                  <p className="text-[10px] text-gray-400">Requested by: <strong className="text-white">{req.requestedBy}</strong></p>
                  
                  {req.details.username && <p>Username: <code className="text-amber-300">{req.details.username}</code></p>}
                  {req.details.role && <p>Role: <strong className="text-white">{req.details.role.toUpperCase()}</strong></p>}
                  {req.details.requested_role && <p>Target Role: <strong className="text-purple-300">{req.details.requested_role.toUpperCase()}</strong></p>}
                  {req.details.school_name && <p>School: <strong>{req.details.school_name}</strong> ({req.details.district})</p>}
                  {req.details.discount_percent && <p>Discount: <strong className="text-emerald-400">{req.details.discount_percent}%</strong> (₹{req.details.discount_amount})</p>}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.id, 'APPROVE')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Apply</span>
                  </button>
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.id, 'REJECT')}
                    className="flex-1 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
