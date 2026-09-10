import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  LogOut,
  Building2,
  Receipt,
  History,
  Trophy,
  UserCheck,
  Bell,
  LayoutDashboard
} from 'lucide-react';

import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import MasterSchoolsDirectoryModule from '../components/MasterSchoolsDirectoryModule';
import UserManagementModule from '../components/UserManagementModule';
import PendingApprovalsDrawer from '../components/PendingApprovalsDrawer';

export default function CEODashboard() {
  const { user, setUser } = useContext(AuthContext);

  // Top Functional Navigation Tabs
  const [activeTab, setActiveTab] = useState('dashboard');

  // Governance Drawer State
  const [approvalsDrawerOpen, setApprovalsDrawerOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schools', label: 'Master Schools DB', icon: Building2 },
    { id: 'invoicing', label: 'Invoicing & Records', icon: Receipt },
    { id: 'logs', label: 'Central Visit Logs', icon: History },
    { id: 'team', label: 'Team Leaderboard', icon: Trophy },
    { id: 'users', label: 'User Directory & Roles', icon: UserCheck },
  ];

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col font-sans">

      {/* CEO Command Navigation Header */}
      <header className="bg-[#14151b]/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
              ME
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-2">
                MG THE ONE <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">CEO</span>
              </h1>
              <p className="text-[11px] text-gray-400">Executive Dashboard • {user?.name || 'Chief Executive Officer'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Approvals Badge Trigger */}
            <button
              onClick={() => setApprovalsDrawerOpen(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Approvals</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-[#14151c] border border-white/10 p-2 rounded-2xl">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CEO DASHBOARD COMMAND CENTER */}
        {(activeTab === 'dashboard' || activeTab === 'overview') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-[#0f1015] p-16 sm:p-24 flex items-center justify-center text-center shadow-2xl min-h-[360px]"
          >
            <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase">
              Under Construction
            </h2>
          </motion.div>
        )}

        {/* TAB 2: MASTER SCHOOLS DATABASE */}
        {activeTab === 'schools' && (
          <MasterSchoolsDirectoryModule currentUser={user} />
        )}

        {/* TAB 3: INVOICING & FINANCIAL RECORDS */}
        {activeTab === 'invoicing' && (
          <InvoicingModule currentUser={user} />
        )}

        {/* TAB 4: CENTRAL VISIT LOGS */}
        {activeTab === 'logs' && (
          <FieldVisitRegistry currentUser={user} />
        )}

        {/* TAB 5: TEAM LEADERBOARD */}
        {activeTab === 'team' && (
          <CanvasserLeaderboard currentUser={user} />
        )}

        {/* TAB 6: USER DIRECTORY & ROLES */}
        {activeTab === 'users' && (
          <UserManagementModule currentUser={user} />
        )}

      </main>

      {/* Pending Approvals Governance Drawer */}
      <PendingApprovalsDrawer
        isOpen={approvalsDrawerOpen}
        onClose={() => setApprovalsDrawerOpen(false)}
        currentUser={user}
        onCountChange={(newCount) => setPendingCount(newCount)}
      />

    </div>
  );
}
