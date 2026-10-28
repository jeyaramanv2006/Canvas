import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Shield, KeyRound, UserX, CheckCircle2, 
  AlertTriangle, RefreshCw, Clock, Search, Filter, ShieldCheck,
  Building2, ChevronRight, Lock, Eye, EyeOff, PauseCircle, PlayCircle,
  Trash2, ShieldAlert, Sparkles, Send, AlertCircle, X, RotateCcw
} from 'lucide-react';
import { mockApi, formatUsername } from '../mockApi';
import { cn } from '../lib/utils';
import AestheticSelect from './AestheticSelect';

const ROLE_OPTIONS = [
  { value: 'canvasser', label: 'Field Canvasser', slug: 'cvs', roleTitle: 'Field Sales', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'admin_exec', label: 'Admin Executive', slug: 'admin', roleTitle: 'Admin & Operations', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { value: 'cfo', label: 'Chief Financial Officer', slug: 'cfo', roleTitle: 'Financial Governance', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { value: 'cco', label: 'Chief Coordinating Officer', slug: 'cco', roleTitle: 'Coordinating Strategy', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'cso', label: 'Chief Strategy Officer', slug: 'cso', roleTitle: 'Strategy & Expansion', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  { value: 'ceo', label: 'Chief Executive Officer', slug: 'ceo', roleTitle: 'Strategic Command', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' }
];

export default function UserManagementModule({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals & Confirmation States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'DELETE' | 'PAUSE' | 'RESUME', user }
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('canvasser');
  const [newPassword, setNewPassword] = useState('password');
  const [submitting, setSubmitting] = useState(false);

  // Edit Role State
  const [updatedRole, setUpdatedRole] = useState('canvasser');

  const isCEO = currentUser?.role === 'ceo';

  useEffect(() => {
    if (createModalOpen || editRoleModalOpen || confirmModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [createModalOpen, editRoleModalOpen, confirmModal]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (force = false) => {
    setLoading(true);
    try {
      const data = await mockApi.getUsers({ forceRefresh: force });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load users", e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setActionError('');
    setTimeout(() => setActionSuccess(''), 4500);
  };

  const showError = (msg) => {
    setActionError(msg);
    setActionSuccess('');
    setTimeout(() => setActionError(''), 6000);
  };

  // ── 1. Create User ──────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const selectedRoleObj = ROLE_OPTIONS.find(r => r.value === newRole);
      const generatedUsername = formatUsername(newName, newRole);

      if (isCEO) {
        await mockApi.createUser({
          name: newName,
          username: generatedUsername,
          role: newRole,
          roleTitle: selectedRoleObj?.roleTitle || 'Staff',
          password: newPassword,
          initial_password: newPassword
        });
        showSuccess(`User "${newName}" (${generatedUsername}) provisioned successfully!`);
      } else {
        // Admin submits request to CEO approval queue
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "USER_CREATION",
          title: `New User Provisioning: ${newName} (${generatedUsername})`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            name: newName,
            username: generatedUsername,
            role: newRole,
            roleTitle: selectedRoleObj?.roleTitle,
            initial_password: newPassword
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`User creation request for "${generatedUsername}" submitted to CEO for approval!`);
      }

      setCreateModalOpen(false);
      setNewName('');
      setNewPassword('password');
      await loadUsers();
    } catch (err) {
      showError("Failed to create user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 2. Update User Role ─────────────────────────────────────────────────────
  const handleOpenEditRole = (u) => {
    setSelectedUser(u);
    setUpdatedRole(u.role || 'canvasser');
    setEditRoleModalOpen(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const selectedRoleObj = ROLE_OPTIONS.find(r => r.value === updatedRole);
      const generatedUsername = formatUsername(selectedUser.name, updatedRole);

      if (isCEO) {
        await mockApi.updateUser(selectedUser.id, {
          role: updatedRole,
          roleTitle: selectedRoleObj?.roleTitle || 'Staff',
          username: generatedUsername
        });
        showSuccess(`Role for "${selectedUser.name}" updated to ${selectedRoleObj?.label}!`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "ROLE_CHANGE",
          title: `Role Change: ${selectedUser.name} → ${selectedRoleObj?.label}`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            userId: selectedUser.id,
            name: selectedUser.name,
            oldRole: selectedUser.role,
            newRole: updatedRole,
            roleTitle: selectedRoleObj?.roleTitle,
            newUsername: generatedUsername
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`Role change request for "${selectedUser.name}" submitted to CEO for approval!`);
      }

      setEditRoleModalOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      showError("Failed to update role: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 3. Pause User Access ───────────────────────────────────────────────────
  const handlePauseUser = async (u) => {
    setSubmitting(true);
    try {
      if (isCEO) {
        await mockApi.pauseUser(u.id);
        showSuccess(`Account for "${u.name}" has been paused. Login is disabled.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "USER_PAUSE",
          title: `Pause User Access: ${u.name} (${u.username})`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            userId: u.id,
            name: u.name,
            username: u.username,
            role: u.role
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`Pause request for "${u.username || u.name}" submitted to CEO for approval!`);
      }
      setConfirmModal(null);
      await loadUsers();
    } catch (err) {
      showError("Failed to pause user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 4. Resume User Access ──────────────────────────────────────────────────
  const handleResumeUser = async (u) => {
    setSubmitting(true);
    try {
      if (isCEO) {
        await mockApi.resumeUser(u.id);
        showSuccess(`Account for "${u.name}" has been resumed. Login re-enabled.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "USER_RESUME",
          title: `Resume User Access: ${u.name} (${u.username})`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            userId: u.id,
            name: u.name,
            username: u.username,
            role: u.role
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`Resume request for "${u.username || u.name}" submitted to CEO for approval!`);
      }
      setConfirmModal(null);
      await loadUsers();
    } catch (err) {
      showError("Failed to resume user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 5. Delete User ──────────────────────────────────────────────────────────
  const handleDeleteUser = async (u) => {
    setSubmitting(true);
    try {
      if (isCEO) {
        await mockApi.deleteUser(u.id);
        showSuccess(`User "${u.name}" completely deleted from system.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "USER_DELETION",
          title: `Delete User: ${u.name} (${u.username})`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            userId: u.id,
            name: u.name,
            username: u.username,
            role: u.role
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`Deletion request for "${u.username || u.name}" submitted to CEO for approval!`);
      }
      setConfirmModal(null);
      await loadUsers();
    } catch (err) {
      showError("Failed to delete user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 6. Send Reset Password (Instant for both Admin & CEO) ───────────────────
  const handleTriggerResetPassword = async (u) => {
    setSubmitting(true);
    try {
      await mockApi.triggerPasswordReset(u.id);
      showSuccess(`Temporary password set to "reset" for "${u.username || u.name}". User can log in and set a new password.`);
      await loadUsers();
    } catch (err) {
      showError("Failed to trigger password reset: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (u.status || 'ACTIVE') === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // KPI calculations
  const totalAccounts = users.length;
  const activeAccounts = users.filter(u => (u.status || 'ACTIVE') === 'ACTIVE').length;
  const pausedAccounts = users.filter(u => u.status === 'PAUSED').length;

  const roleFilterOptions = [
    { value: 'all', label: `All Roles (${users.length})` },
    { value: 'ceo', label: 'CEO (Command)' },
    { value: 'cfo', label: 'CFO (Treasury)' },
    { value: 'cco', label: 'CCO (Commercial)' },
    { value: 'admin_exec', label: 'Admin Executive (Operations)' },
    { value: 'canvasser', label: 'Field Canvassers' }
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active Only' },
    { value: 'PAUSED', label: 'Paused / Stopped' }
  ];

  const modalRoleOptions = ROLE_OPTIONS.map(r => ({
    value: r.value,
    label: `${r.label} (${r.roleTitle})`
  }));

  return (
    <div className="space-y-6 selection:bg-amber-400 selection:text-black">
      {/* ── TOP BANNER & STATS OVERVIEW ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#14151f]/95 via-[#0e1017]/90 to-[#0c0d15]/90 border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-black font-black shadow-lg shadow-amber-400/20 shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md border font-mono",
                  isCEO ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                )}>
                  {isCEO ? "CEO Master Control" : "Admin Executive"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Team Directory &amp; User Roles
              </h2>
              <p className="text-xs text-white/55 mt-0.5 max-w-xl">
                Manage accounts, assign roles, pause or resume logins, and issue instant password resets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              onClick={() => loadUsers(true)}
              disabled={loading}
              className="px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.09] text-white/80 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-white/[0.1] hover:border-amber-400/30 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Sync and pull latest team members from database"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", loading && "animate-spin")} />
              <span>{loading ? "Syncing..." : "Sync Team"}</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-400/20 transition whitespace-nowrap cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 stroke-[3]" />
              <span>{isCEO ? "Add New User" : "Request New User"}</span>
            </button>
          </div>
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5 mt-5 border-t border-white/[0.08] relative z-10">
          <div className="p-4 bg-black/40 rounded-2xl border border-white/[0.08] relative overflow-hidden">
            <span className="text-[10px] font-bold uppercase text-white/45 block tracking-wider font-mono">Total System Accounts</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{totalAccounts}</span>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Users
            </span>
            <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">{activeAccounts}</span>
          </div>

          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 relative overflow-hidden">
            <span className="text-[10px] font-bold uppercase text-amber-400 block tracking-wider font-mono">
              Paused Access
            </span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">{pausedAccounts}</span>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATIONS ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2.5 shadow-lg backdrop-blur-md"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SEARCH & FILTERS BAR ─────────────────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-2xl relative z-30">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, username (<name>@<role>), or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl pl-10 pr-9 text-xs text-white placeholder:text-white/40 focus:outline-none transition-colors shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-3 relative focus-within:z-40">
            <AestheticSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleFilterOptions}
              placeholder="Filter by Role..."
              icon={Shield}
              buttonClassName="min-h-[44px] bg-black/40 border-white/[0.1] hover:border-white/20"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3 relative focus-within:z-40">
            <AestheticSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilterOptions}
              placeholder="Filter by Status..."
              icon={Filter}
              buttonClassName="min-h-[44px] bg-black/40 border-white/[0.1] hover:border-white/20"
            />
          </div>
        </div>
      </div>

      {/* ── USER DIRECTORY TABLE ─────────────────────────────────────────── */}
      <div className="bg-[#0c0d15]/85 rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead className="bg-black/50 text-white/50 uppercase text-[10px] border-b border-white/[0.08] font-bold tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-4 px-4 sm:px-5">Operator / User</th>
                <th className="py-4 px-4 sm:px-5">Username (<span className="font-mono text-amber-400">&lt;name&gt;@&lt;role&gt;</span>)</th>
                <th className="py-4 px-4 sm:px-5 text-center">Assigned Role</th>
                <th className="py-4 px-4 sm:px-5">Status &amp; Flags</th>
                <th className="py-4 px-4 sm:px-5 text-right">Actions &amp; Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-white/50">
                    <RefreshCw className="w-7 h-7 animate-spin mx-auto text-amber-400 mb-3" />
                    <span className="text-xs font-bold text-white/70">Loading User Accounts...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-white/50">
                    <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white/70">No matching users found in directory.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const roleObj = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
                  const isUserCEO = u.role === 'ceo';
                  const isTargetProtected = isUserCEO;
                  const isDeleted = u.status === 'DELETED';
                  const isPaused = u.status === 'PAUSED';
                  const isActive = !isDeleted && !isPaused;

                  return (
                    <tr key={u.id} className={cn(
                      "transition-colors group",
                      isDeleted ? "bg-rose-500/[0.02] opacity-75" : isPaused ? "bg-amber-500/[0.02]" : "hover:bg-white/[0.03]"
                    )}>
                      {/* Name & Title */}
                      <td className="py-4 px-4 sm:px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-2xl border flex items-center justify-center font-black shrink-0 text-xs shadow-sm",
                            isUserCEO ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                            isDeleted ? "bg-rose-500/20 border-rose-500/40 text-rose-300" :
                            isPaused ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                            "bg-blue-500/20 border-blue-500/40 text-blue-300"
                          )}>
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isUserCEO && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black font-mono">
                                  CHIEF
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-white/45">{u.roleTitle || roleObj.roleTitle}</span>
                          </div>
                        </div>
                      </td>

                      {/* Strict Monospace Username */}
                      <td className="py-4 px-4 sm:px-5 font-mono whitespace-nowrap">
                        <span className="bg-black/50 px-2.5 py-1 rounded-lg border border-white/[0.08] text-amber-300 text-[11px] font-bold">
                          {u.username || formatUsername(u.name, u.role)}
                        </span>
                      </td>

                      {/* Assigned Role */}
                      <td className="py-4 px-4 sm:px-5 whitespace-nowrap text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center justify-center whitespace-nowrap font-mono shadow-xs",
                          roleObj.color
                        )}>
                          {roleObj.label}
                        </span>
                      </td>

                      {/* Status & Flags */}
                      <td className="py-4 px-4 sm:px-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isActive && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ACTIVE
                            </span>
                          )}
                          {isPaused && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                              PAUSED
                            </span>
                          )}
                          {isDeleted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
                              DELETED
                            </span>
                          )}
                          {u.requires_password_reset && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1 font-mono" title="User must reset password on next login">
                              <KeyRound className="w-2.5 h-2.5" />
                              Reset Required
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-5 text-right whitespace-nowrap">
                        {isTargetProtected ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 font-mono">
                              <Shield className="w-3 h-3 text-amber-400" />
                              Protected
                            </span>
                            <button
                              onClick={() => handleTriggerResetPassword(u)}
                              className="px-2.5 py-1 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/25 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Reset password to 'reset'"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset Pass</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Edit Role Button */}
                            {!isDeleted && (
                              <button
                                onClick={() => handleOpenEditRole(u)}
                                className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.1] text-[11px] font-bold transition cursor-pointer"
                                title={isCEO ? "Edit User Role Immediately" : "Submit Role Change Request to CEO"}
                              >
                                {isCEO ? "Edit Role" : "Req. Role"}
                              </button>
                            )}

                            {/* 2. Pause / Resume Button */}
                            {!isDeleted && (
                              <button
                                onClick={() => isPaused ? handleResumeUser(u) : setConfirmModal({ type: 'PAUSE', user: u })}
                                className={cn(
                                  "px-2.5 py-1 rounded-xl border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer",
                                  isPaused 
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                                )}
                                title={isPaused ? "Resume user login access" : "Temporarily pause user access"}
                              >
                                {isPaused ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                                <span>{isPaused ? (isCEO ? "Resume" : "Req. Resume") : (isCEO ? "Pause" : "Req. Pause")}</span>
                              </button>
                            )}

                            {/* 3. Send Reset Password Button */}
                            {!isDeleted && (
                              <button
                                onClick={() => handleTriggerResetPassword(u)}
                                className="px-2.5 py-1 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/25 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Reset password to 'reset'"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Reset Pass</span>
                              </button>
                            )}

                            {/* 4. Delete Button */}
                            {!isDeleted && (
                              <button
                                onClick={() => setConfirmModal({ type: 'DELETE', user: u })}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                                title={isCEO ? "Delete user completely" : "Submit deletion request to CEO"}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE USER MODAL ──────────────────────────────────────────────── */}
      {createModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e0f17]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl backdrop-blur-2xl text-white my-auto max-h-[90vh] overflow-y-auto relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-400/15 text-amber-400 border border-amber-400/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {isCEO ? "Provision System Account" : "Submit Provisioning Request"}
                </h3>
                <p className="text-[11px] text-white/50">Team Directory Management</p>
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Provision account with Name and Role. Login identifier is generated in strict <code className="text-amber-300 font-mono">&lt;name&gt;@&lt;role&gt;</code> format.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-white/70 font-bold block mb-1.5">Full Name</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-white/70 font-bold block mb-1.5">System Role</label>
                <AestheticSelect
                  value={newRole}
                  onChange={setNewRole}
                  options={modalRoleOptions}
                  buttonClassName="min-h-[42px] bg-black/40 border-white/[0.1]"
                />
              </div>

              {/* Username live preview */}
              <div className="p-3 bg-black/50 rounded-xl border border-amber-500/20 text-xs">
                <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider font-mono">Generated Login Identifier:</span>
                <span className="font-mono text-amber-300 font-bold text-sm mt-0.5 block">
                  {formatUsername(newName || 'username', newRole)}
                </span>
              </div>

              <div>
                <label className="text-white/70 font-bold block mb-1.5">Initial Temporary Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.1] hover:border-white/20 focus:border-amber-400/80 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none transition font-mono"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-black font-black rounded-xl transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : isCEO ? "Create Immediately" : "Submit Request to CEO"}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white font-bold rounded-xl transition cursor-pointer border border-white/[0.08]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── EDIT ROLE MODAL ────────────────────────────────────────────────── */}
      {editRoleModalOpen && selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e0f17]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl backdrop-blur-2xl text-white my-auto max-h-[90vh] overflow-y-auto relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {isCEO ? `Modify Role: ${selectedUser.name}` : `Request Role Upgrade: ${selectedUser.name}`}
                </h3>
                <p className="text-[11px] text-white/50">User Role Authorization</p>
              </div>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-3.5 text-xs">
              <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.08] space-y-1">
                <p className="text-white/50">Current Role: <strong className="text-white font-mono">{selectedUser.role?.toUpperCase()}</strong></p>
                <p className="text-white/50">Current Identifier: <span className="font-mono text-amber-300">{selectedUser.username || selectedUser.email}</span></p>
              </div>

              <div>
                <label className="text-white/70 font-bold block mb-1.5">New Assigned Role</label>
                <AestheticSelect
                  value={updatedRole}
                  onChange={setUpdatedRole}
                  options={modalRoleOptions}
                  buttonClassName="min-h-[42px] bg-black/40 border-white/[0.1]"
                />
              </div>

              {/* Updated Username preview */}
              <div className="p-3 bg-black/50 rounded-xl border border-purple-500/20 text-xs">
                <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider font-mono">New Login Identifier:</span>
                <span className="font-mono text-purple-300 font-bold text-sm mt-0.5 block">
                  {formatUsername(selectedUser.name, updatedRole)}
                </span>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black rounded-xl transition cursor-pointer shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : isCEO ? "Confirm Role Update" : "Submit Request to CEO"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditRoleModalOpen(false)}
                  className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white font-bold rounded-xl transition cursor-pointer border border-white/[0.08]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── CONFIRMATION MODAL FOR PAUSE / DELETE ──────────────────────────── */}
      {confirmModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e0f17]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl backdrop-blur-2xl text-white my-auto relative">
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent to-transparent pointer-events-none",
              confirmModal.type === 'DELETE' ? "via-rose-500/40" : "via-amber-400/40"
            )} />

            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-2xl border",
                confirmModal.type === 'DELETE' ? "bg-rose-500/15 text-rose-400 border-rose-500/30" : "bg-amber-400/15 text-amber-400 border-amber-400/30"
              )}>
                {confirmModal.type === 'DELETE' ? <Trash2 className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {confirmModal.type === 'DELETE' 
                    ? (isCEO ? "Confirm User Deletion" : "Submit Deletion Request") 
                    : (isCEO ? "Pause User Access" : "Submit Pause Request")}
                </h3>
                <p className="text-[11px] text-white/50">Account Lifecycle</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              {confirmModal.type === 'DELETE' ? (
                <>
                  Are you sure you want to permanently delete <strong className="text-white">{confirmModal.user.name}</strong> ({confirmModal.user.username})?
                  <span className="block text-rose-300 mt-2.5 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-medium">
                    🗑️ This account will be completely removed from the database.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to pause access for <strong className="text-white">{confirmModal.user.name}</strong> ({confirmModal.user.username})?
                  <span className="block text-amber-300 mt-2.5 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 font-medium">
                    ⏸️ This will temporarily prevent the user from logging in while preserving all historical data.
                  </span>
                </>
              )}
            </p>

            <div className="flex gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={submitting}
                onClick={() => confirmModal.type === 'DELETE' ? handleDeleteUser(confirmModal.user) : handlePauseUser(confirmModal.user)}
                className={cn(
                  "flex-1 py-3 font-black rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50",
                  confirmModal.type === 'DELETE'
                    ? "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"
                    : "bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 text-black shadow-lg shadow-amber-400/20"
                )}
              >
                {submitting ? "Processing..." : confirmModal.type === 'DELETE'
                  ? (isCEO ? "Delete User Immediately" : "Submit Deletion Request")
                  : (isCEO ? "Pause User Immediately" : "Submit Pause Request")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white font-bold rounded-xl transition cursor-pointer border border-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
