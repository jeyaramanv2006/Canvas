import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import ErrorBoundary from '../components/ErrorBoundary';
import MasterSchoolsDirectoryModule from '../components/MasterSchoolsDirectoryModule';
import UserManagementModule from '../components/UserManagementModule';
import PendingApprovalsDrawer from '../components/PendingApprovalsDrawer';
import { cn } from '../lib/utils';

export default function CEODashboard() {
  const { user, setUser } = useContext(AuthContext);

  // Top Functional Navigation Tabs
  const [activeTab, setActiveTab] = useState('dashboard');

  // Governance Drawer State
  const [approvalsDrawerOpen, setApprovalsDrawerOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Overview', icon: LayoutDashboard },
    { id: 'schools', label: 'Master Schools DB', mobileLabel: 'Schools', icon: Building2 },
    { id: 'invoicing', label: 'Invoicing & Records', mobileLabel: 'Invoices', icon: Receipt },
    { id: 'logs', label: 'Central Visit Logs', mobileLabel: 'Visits', icon: History },
    { id: 'team', label: 'Team Leaderboard', mobileLabel: 'Leaderboard', icon: Trophy },
    { id: 'users', label: 'User Directory & Roles', mobileLabel: 'Users', icon: UserCheck },
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
            <div className="h-10 w-20 rounded-xl overflow-hidden border border-white/10 shadow-md bg-[#14151b] flex items-center justify-center flex-shrink-0">
              <img 
                src="/logo.jpg" 
                alt="MG The One" 
                className="w-full h-full object-cover scale-[1.38]"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white flex items-center gap-2">
                THE ONE <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">CEO</span>
              </h1>
              <p className="text-[11px] text-gray-400 truncate">Canvassing & Financials • {user?.name || 'Chief Executive Officer'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Approvals Badge Trigger */}
            <button
              onClick={() => setApprovalsDrawerOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Approvals</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="px-2.5 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 space-y-6 pb-28 md:pb-8">

        {/* Desktop Navigation Tabs Bar */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-[#14151c] border border-white/10 p-2 rounded-2xl">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 z-10",
                  isActive
                    ? "text-black font-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="ceoActiveTopTab"
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl shadow-lg shadow-amber-400/25 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content with Seamless Animation */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* TAB 1: CEO DASHBOARD COMMAND CENTER */}
            {(activeTab === 'dashboard' || activeTab === 'overview') && (
              <div className="rounded-3xl border border-white/10 bg-[#0f1015] p-16 sm:p-24 flex items-center justify-center text-center shadow-2xl min-h-[360px]">
                <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase">
                  Under Construction
                </h2>
              </div>
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
              <ErrorBoundary>
                <CanvasserLeaderboard currentUser={user} />
              </ErrorBoundary>
            )}

            {/* TAB 6: USER DIRECTORY & ROLES */}
            {activeTab === 'users' && (
              <UserManagementModule currentUser={user} />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#14151b]/95 backdrop-blur-2xl border-t border-white/10 pb-safe z-50 px-1.5 py-1.5 shadow-2xl">
        <div className="grid grid-cols-6 gap-1 max-w-lg mx-auto">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-1.5 px-0.5 flex flex-col items-center gap-1 rounded-xl transition-colors text-center z-10",
                  isActive 
                    ? "text-amber-400 font-black" 
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="ceoActiveBottomTab"
                    className="absolute inset-0 bg-amber-500/15 border border-amber-500/40 rounded-xl shadow-lg shadow-amber-500/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0 relative z-10" />
                <span className="text-[9px] font-bold tracking-tight truncate max-w-full relative z-10">
                  {tab.mobileLabel || tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

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
