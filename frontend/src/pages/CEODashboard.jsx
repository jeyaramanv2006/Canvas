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
  LayoutDashboard,
  CalendarCheck
} from 'lucide-react';

import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import ErrorBoundary from '../components/ErrorBoundary';
import MasterSchoolsDirectoryModule from '../components/MasterSchoolsDirectoryModule';
import UserManagementModule from '../components/UserManagementModule';
import PendingApprovalsDrawer from '../components/PendingApprovalsDrawer';
import FollowUpsPipelineModule from '../components/FollowUpsPipelineModule';
import CEODashboardOverview from '../components/CEODashboardOverview';
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
    { id: 'followups', label: 'Priority Follow-ups', mobileLabel: 'Follow-ups', icon: CalendarCheck },
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
    <div className="min-h-screen vivid-void-canvas text-white flex flex-col font-sans selection:bg-amber-300 selection:text-black">

      {/* CEO Command Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0c0d15]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-10 w-20 sm:h-11 sm:w-24 rounded-xl overflow-hidden border border-[#d9b763]/25 bg-[#171615] flex items-center justify-center flex-shrink-0 shadow-inner">
              <img 
                src="/logo.jpg" 
                alt="MG The One" 
                className="w-full h-full object-cover scale-[1.38]"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase leading-none">
                  THE ONE
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 whitespace-nowrap tracking-wide">
                  CEO
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-medium flex items-center gap-1.5 mt-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">{user?.name || 'Chief Executive Officer'}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40 font-mono text-[10px]">Canvassing &amp; Financials</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Approvals Badge Trigger */}
            <button
              onClick={() => setApprovalsDrawerOpen(true)}
              className="px-3 py-1.5 sm:py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Approvals</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0 text-white/60" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 space-y-6 pb-28 md:pb-8">

        {/* Desktop Navigation Tabs Bar with Apple-grade Fluid Spring Layout */}
        <div className="hidden md:flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="inline-flex p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
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
                      : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="ceoActiveTopTab"
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-xl shadow-[0_2px_12px_rgba(251,191,36,0.28)] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-200", isActive ? "text-black scale-105" : "text-white/50")} />
                  <span className="relative z-10 tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
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
            <ErrorBoundary>
              {/* TAB 1: CEO DASHBOARD COMMAND CENTER */}
              {(activeTab === 'dashboard' || activeTab === 'overview') && (
                <CEODashboardOverview
                  currentUser={user}
                  onOpenApprovals={() => setApprovalsDrawerOpen(true)}
                  onNavigateTab={(tabId) => setActiveTab(tabId)}
                />
              )}

              {/* TAB: PRIORITY FOLLOW-UPS */}
              {activeTab === 'followups' && (
                <FollowUpsPipelineModule currentUser={user} />
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
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#0c0d15]/90 backdrop-blur-2xl border-t border-white/[0.08] pb-safe z-50 px-1.5 py-2 shadow-2xl">
        <div className="grid grid-cols-7 gap-0.5 max-w-lg mx-auto p-1 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
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
                    ? "text-amber-300 font-black" 
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="ceoActiveBottomTab"
                    className="absolute inset-0 bg-amber-400/15 border border-amber-400/35 rounded-xl shadow-[0_0_12px_rgba(251,191,36,0.15)] -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 shrink-0 relative z-10 transition-transform duration-200", isActive && "scale-110")} />
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
