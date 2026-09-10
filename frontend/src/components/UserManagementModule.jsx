import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Shield, KeyRound, UserX, CheckCircle2, 
  AlertTriangle, RefreshCw, Clock, Search, Filter, ShieldCheck,
  Building2, ChevronRight, Lock, Eye, EyeOff, PauseCircle, PlayCircle,
  Trash2, ShieldAlert, Sparkles, Send
} from 'lucide-react';
import { mockApi, formatUsername } from '../mockApi';
import { cn } from '../lib/utils';

const ROLE_OPTIONS = [
  { value: 'canvasser', label: 'Field Canvasser', slug: 'cvs', roleTitle: 'Field Sales', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'admin_exec', label: 'Admin Executive', slug: 'admin', roleTitle: 'Admin & Operations', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { value: 'cfo', label: 'Chief Financial Officer', slug: 'cfo', roleTitle: 'Financial Governance', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { value: 'cco', label: 'Chief Commercial Officer', slug: 'cco', roleTitle: 'Commercial Strategy', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
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

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('canvasser');
  const [newPassword, setNewPassword] = useState('password');
  const [submitting, setSubmitting] = useState(false);

  // Edit Role State
  const [updatedRole, setUpdatedRole] = useState('canvasser');

  const isCEO = currentUser?.role === 'ceo';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  // ── 1. Create User ──────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
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
          password: newPassword
        });
        showSuccess(`User "${newName}" (${generatedUsername}) provisioned and activated immediately!`);
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
      alert("Failed to create user: " + err.message);
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
      const newUsername = formatUsername(selectedUser.name, updatedRole);

      if (isCEO) {
        await mockApi.updateUserRole(selectedUser.id, updatedRole);
        showSuccess(`Role for ${selectedUser.name} updated to ${selectedRoleObj?.label} (${newUsername}) immediately!`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "ROLE_CHANGE",
          title: `Role Upgrade Request: ${selectedUser.name} -> ${selectedRoleObj?.label}`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            target_user_id: selectedUser.id,
            target_user_name: selectedUser.name,
            current_role: selectedUser.role,
            requested_role: updatedRole,
            current_username: selectedUser.username,
            new_username: newUsername,
            new_role_title: selectedRoleObj?.roleTitle
          },
          status: "PENDING"
        };
        storedApprovals.unshift(newApproval);
        localStorage.setItem('mg_pending_approvals', JSON.stringify(storedApprovals));
        showSuccess(`Role update request for "${selectedUser.name}" to ${selectedRoleObj?.label} submitted to CEO for approval!`);
      }

      setEditRoleModalOpen(false);
      await loadUsers();
    } catch (err) {
      alert("Failed to update role: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 3. Pause User (Stop) ────────────────────────────────────────────────────
  const handlePauseUser = async (u) => {
    setSubmitting(true);
    try {
      if (isCEO) {
        await mockApi.pauseUser(u.id);
        showSuccess(`User ${u.username || u.name} paused. Login access temporarily paused; all progress preserved.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "USER_PAUSE",
          title: `Account Pause Request: ${u.name} (${u.username || u.email})`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            target_user_id: u.id,
            target_user_name: u.name,
            username: u.username || u.email,
            current_status: u.status
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
      alert("Failed to pause user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 4. Resume User ──────────────────────────────────────────────────────────
  const handleResumeUser = async (u) => {
    setSubmitting(true);
    try {
      if (isCEO) {
        await mockApi.resumeUser(u.id);
        showSuccess(`User ${u.username || u.name} resumed. Login access restored.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "USER_RESUME",
          title: `Account Resume Request: ${u.name} (${u.username || u.email})`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            target_user_id: u.id,
            target_user_name: u.name,
            username: u.username || u.email
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
      alert("Failed to resume user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 5. Delete User (Preserves progress, marks DELETED) ───────────────────────
  const handleDeleteUser = async (u) => {
    setSubmitting(true);
    try {
      if (isCEO) {
        await mockApi.deleteUser(u.id);
        showSuccess(`User ${u.username || u.name} marked as DELETED. Login disabled; all historical data preserved.`);
      } else {
        const storedApprovals = JSON.parse(localStorage.getItem('mg_pending_approvals') || '[]');
        const newApproval = {
          id: `APP-${Date.now().toString().slice(-4)}`,
          type: "USER_DELETE",
          title: `User Deletion Request: ${u.name} (${u.username || u.email})`,
          requestedBy: currentUser?.name ? `${currentUser.name} (Admin)` : "Admin Executive",
          requestedAt: new Date().toISOString(),
          details: {
            target_user_id: u.id,
            target_user_name: u.name,
            username: u.username || u.email
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
      alert("Failed to delete user: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 6. Send Reset Password (Instant for both Admin & CEO) ───────────────────
  const handleTriggerResetPassword = async (u) => {
    setSubmitting(true);
    try {
      await mockApi.triggerPasswordReset(u.id);
      showSuccess(`Password reset triggered for "${u.username || u.name}"! They will be prompted to change their password on login.`);
      await loadUsers();
    } catch (err) {
      alert("Failed to trigger password reset: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered dataset
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (u.status || 'ACTIVE') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI calculations
  const totalAccounts = users.length;
  const activeAccounts = users.filter(u => (u.status || 'ACTIVE') === 'ACTIVE').length;
  const pausedAccounts = users.filter(u => u.status === 'PAUSED').length;
  const deletedAccounts = users.filter(u => u.status === 'DELETED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-400/20 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">Team Directory & User Roles</h2>
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border",
                  isCEO ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                )}>
                  {isCEO ? "CEO Access (Direct Action)" : "Admin Executive (Requires CEO Approval)"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage team member accounts, adjust roles, pause or resume access, and reset passwords.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-400/20 transition whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isCEO ? "Add New User" : "Request New User"}</span>
          </button>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Total Accounts</span>
            <span className="text-xl font-black text-white mt-0.5 block">{totalAccounts}</span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Users
            </span>
            <span className="text-xl font-black text-emerald-300 mt-0.5 block">{activeAccounts}</span>
          </div>
          <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <span className="text-[10px] font-bold uppercase text-amber-400 block tracking-wider">Paused / Stopped</span>
            <span className="text-xl font-black text-amber-300 mt-0.5 block">{pausedAccounts}</span>
          </div>
          <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20">
            <span className="text-[10px] font-bold uppercase text-rose-400 block tracking-wider">Deleted (Archived)</span>
            <span className="text-xl font-black text-rose-300 mt-0.5 block">{deletedAccounts}</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </motion.div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, username (<name>@<role>), or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#16171d] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full bg-[#16171d] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="ceo">CEO (Command)</option>
            <option value="cfo">CFO (Treasury)</option>
            <option value="cco">CCO (Commercial)</option>
            <option value="admin_exec">Admin Executive (Operations)</option>
            <option value="canvasser">Field Canvassers</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-[#16171d] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="PAUSED">Paused / Stopped</option>
            <option value="DELETED">Deleted (Data Preserved)</option>
          </select>
        </div>
      </div>

      {/* User Directory Dataset Table */}
      <div className="bg-gradient-to-br from-[#181922] via-[#14151c] to-[#101116] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-black/50 text-gray-400 uppercase text-[10px] border-b border-white/10 font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Operator / User</th>
                <th className="py-3.5 px-4">Username (<span className="font-mono text-amber-400">&lt;name&gt;@&lt;role&gt;</span>)</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Status & Flags</th>
                <th className="py-3.5 px-4 text-right">Actions & Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No matching users found in the directory.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const roleObj = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
                  const isUserCEO = u.role === 'ceo';
                  const isTargetProtected = isUserCEO && !isCEO;
                  const isDeleted = u.status === 'DELETED';
                  const isPaused = u.status === 'PAUSED';
                  const isActive = !isDeleted && !isPaused;

                  return (
                    <tr key={u.id} className={cn(
                      "transition-colors",
                      isDeleted ? "bg-rose-500/[0.03] opacity-75" : isPaused ? "bg-amber-500/[0.03]" : "hover:bg-white/5"
                    )}>
                      {/* Name & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-xl border flex items-center justify-center font-bold flex-shrink-0 text-xs",
                            isUserCEO ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                            isDeleted ? "bg-rose-500/20 border-rose-500/40 text-rose-300" :
                            isPaused ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                            "bg-blue-500/20 border-blue-500/40 text-blue-300"
                          )}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isUserCEO && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black">
                                  CHIEF
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-gray-400">{u.roleTitle || roleObj.roleTitle}</span>
                          </div>
                        </div>
                      </td>

                      {/* Strict Username */}
                      <td className="py-3.5 px-4 font-mono text-gray-300">
                        <span className="bg-black/40 px-2 py-1 rounded-lg border border-white/5 text-amber-300 text-[11px]">
                          {u.username || formatUsername(u.name, u.role)}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border", roleObj.color)}>
                          {roleObj.label}
                        </span>
                      </td>

                      {/* Status & Flags */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ACTIVE
                            </span>
                          )}
                          {isPaused && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              PAUSED
                            </span>
                          )}
                          {isDeleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              DELETED (Preserved)
                            </span>
                          )}
                          {u.requires_password_reset && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1" title="User must reset password on login">
                              <KeyRound className="w-2.5 h-2.5" />
                              Reset Required
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isTargetProtected ? (
                          <span className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-400" />
                            Protected Account
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Edit Role Button */}
                            {!isDeleted && (
                              <button
                                onClick={() => handleOpenEditRole(u)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-semibold transition"
                                title={isCEO ? "Edit User Role Immediately" : "Submit Role Change Request to CEO"}
                              >
                                {isCEO ? "Edit Role" : "Request Role"}
                              </button>
                            )}

                            {/* 2. Pause / Resume Button */}
                            {!isDeleted && (
                              <button
                                onClick={() => isPaused ? handleResumeUser(u) : setConfirmModal({ type: 'PAUSE', user: u })}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition flex items-center gap-1",
                                  isPaused 
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                                )}
                                title={isPaused ? "Resume user login access" : "Temporarily pause user access while preserving progress"}
                              >
                                {isPaused ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                                <span>{isPaused ? (isCEO ? "Resume" : "Req. Resume") : (isCEO ? "Pause" : "Req. Pause")}</span>
                              </button>
                            )}

                            {/* 3. Send Reset Password Button (Instant for both Admin & CEO) */}
                            {!isDeleted && (
                              <button
                                onClick={() => handleTriggerResetPassword(u)}
                                className="px-2.5 py-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[11px] font-semibold transition flex items-center gap-1"
                                title="Send a password reset trigger so user is prompted to set new password on login"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Reset Pass</span>
                              </button>
                            )}

                            {/* 4. Delete Button */}
                            {!isDeleted && (
                              <button
                                onClick={() => setConfirmModal({ type: 'DELETE', user: u })}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
                                title={isCEO ? "Delete user (Disables login, preserves past data)" : "Request deletion to CEO"}
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
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181922] border border-white/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              {isCEO ? "Provision New System Account" : "Submit User Creation Request to CEO"}
            </h3>

            <p className="text-xs text-gray-400">
              Users are provisioned with Name, Role, and Initial Password. Usernames are automatically generated in strict <code className="text-amber-300">&lt;name&gt;@&lt;role&gt;</code> format.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">System Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label} ({r.roleTitle})</option>
                  ))}
                </select>
              </div>

              {/* Username live preview */}
              <div className="p-3 bg-black/50 rounded-xl border border-amber-500/20 text-xs">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Generated Login Identifier:</span>
                <span className="font-mono text-amber-300 font-bold text-sm mt-0.5 block">
                  {formatUsername(newName || 'username', newRole)}
                </span>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Initial Temporary Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black rounded-xl transition cursor-pointer"
                >
                  {isCEO ? "Create & Activate Immediately" : "Submit Request to CEO"}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ROLE MODAL ────────────────────────────────────────────────── */}
      {editRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181922] border border-white/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              {isCEO ? `Modify Role: ${selectedUser.name}` : `Request Role Upgrade: ${selectedUser.name}`}
            </h3>

            <form onSubmit={handleUpdateRole} className="space-y-3.5 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <p className="text-gray-400">Current Role: <strong className="text-white">{selectedUser.role?.toUpperCase()}</strong></p>
                <p className="text-gray-400">Current Login: <span className="font-mono text-amber-300">{selectedUser.username || selectedUser.email}</span></p>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">New Assigned Role</label>
                <select
                  value={updatedRole}
                  onChange={e => setUpdatedRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label} ({r.roleTitle})</option>
                  ))}
                </select>
              </div>

              {/* Updated Username preview */}
              <div className="p-3 bg-black/50 rounded-xl border border-purple-500/20 text-xs">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">New Login Identifier:</span>
                <span className="font-mono text-purple-300 font-bold text-sm mt-0.5 block">
                  {formatUsername(selectedUser.name, updatedRole)}
                </span>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black rounded-xl transition cursor-pointer"
                >
                  {isCEO ? "Confirm Role Update" : "Submit Request to CEO"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditRoleModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL FOR PAUSE / DELETE ──────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181922] border border-white/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {confirmModal.type === 'DELETE' ? (
                <>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>{isCEO ? "Confirm User Deletion" : "Submit Deletion Request to CEO"}</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4 text-amber-400" />
                  <span>{isCEO ? "Pause User Access" : "Submit Pause Request to CEO"}</span>
                </>
              )}
            </h3>

            <p className="text-xs text-gray-300 leading-relaxed">
              {confirmModal.type === 'DELETE' ? (
                <>
                  Are you sure you want to delete <strong>{confirmModal.user.name}</strong> ({confirmModal.user.username})?
                  <span className="block text-rose-300 mt-2 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                    ⚠️ The account will be marked <strong>DELETED</strong> and login will be permanently disabled. All past visit progress, quotations, and invoiced sales remain completely preserved in reports and leaderboard history.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to pause <strong>{confirmModal.user.name}</strong> ({confirmModal.user.username})?
                  <span className="block text-amber-300 mt-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    ⏸️ This will temporarily prevent the user from logging in. All historical data and active progress will remain intact. The account can be resumed at any time.
                  </span>
                </>
              )}
            </p>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => confirmModal.type === 'DELETE' ? handleDeleteUser(confirmModal.user) : handlePauseUser(confirmModal.user)}
                className={cn(
                  "flex-1 py-2.5 font-black rounded-xl transition cursor-pointer",
                  confirmModal.type === 'DELETE'
                    ? "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"
                    : "bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20"
                )}
              >
                {confirmModal.type === 'DELETE'
                  ? (isCEO ? "Delete User (Preserve Data)" : "Submit Deletion Request")
                  : (isCEO ? "Pause User Immediately" : "Submit Pause Request")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
