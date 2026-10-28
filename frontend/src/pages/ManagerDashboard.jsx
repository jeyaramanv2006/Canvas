import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Users, Receipt, History, Trophy, Building2, CalendarCheck
} from 'lucide-react';
import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import ErrorBoundary from '../components/ErrorBoundary';
import UserManagementModule from '../components/UserManagementModule';
import MasterSchoolsDirectoryModule from '../components/MasterSchoolsDirectoryModule';
import FollowUpsPipelineModule from '../components/FollowUpsPipelineModule';
import { getRoleConfig } from '../lib/rbac';
import { cn } from '../lib/utils';

export default function ManagerDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('schools'); // 'schools', 'followups', 'users', 'invoicing', 'logs', 'team'
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['schools']));

  React.useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const roleConfig = getRoleConfig(user);

  const navTabs = [
    { id: 'followups', label: 'Priority Follow-ups', mobileLabel: 'Follow-ups', icon: CalendarCheck },
    { id: 'schools', label: 'Master Schools DB', mobileLabel: 'Schools', icon: Building2 },
    { id: 'users', label: 'User Directory & Roles', mobileLabel: 'Users', icon: Users },
    { id: 'invoicing', label: 'Invoicing & Records', mobileLabel: 'Invoices', icon: Receipt },
    { id: 'logs', label: 'Central Visit Logs', mobileLabel: 'Visits', icon: History },
    { id: 'team', label: 'Team Leaderboard', mobileLabel: 'Leaderboard', icon: Trophy }
  ];

  return (
    <div className="min-h-screen vivid-void-canvas text-white pb-16 selection:bg-amber-300 selection:text-black">
      {/* ── Top Header with Lucid Block Glass & Apple-grade Fluid Spring Tabs ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0c0d15]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-[70px]">
            {/* Branding Identity */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="h-10 w-20 sm:h-11 sm:w-24 rounded-xl overflow-hidden border border-[#d9b763]/25 bg-[#171615] flex items-center justify-center flex-shrink-0 shadow-inner">
                <img 
                  src="/logo.jpg" 
                  alt="Murugan Groups" 
                  className="w-full h-full object-cover scale-[1.38]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase leading-none">
                    The One
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 whitespace-nowrap tracking-wide">
                    Admin Executive
                  </span>
                </div>
                <p className="text-[11px] text-white/50 font-medium flex items-center gap-1.5 mt-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">{user?.name || 'Admin'}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40 font-mono text-[10px]">Operations &amp; Registry</span>
                </p>
              </div>
            </div>

            {/* User Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setUser(null)}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0 text-white/60" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Desktop-Only Fluid Apple-style Navigation Segmented Control */}
          <div className="hidden md:flex space-x-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none">
            <div className="inline-flex p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              {navTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 z-10",
                      isActive
                        ? "text-black font-black"
                        : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="managerActiveTopTab"
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 pb-28 md:pb-8">
        {/* Main Content with Instant Keep-Alive & Silky Smooth Fade Transition */}
        <div className="relative w-full">
          {visitedTabs.has('followups') && (
            <div className={activeTab === 'followups' ? "tab-pane-active block" : "hidden"}>
              <ErrorBoundary>
                <FollowUpsPipelineModule currentUser={user} />
              </ErrorBoundary>
            </div>
          )}

          {visitedTabs.has('schools') && (
            <div className={activeTab === 'schools' ? "tab-pane-active block" : "hidden"}>
              <ErrorBoundary>
                <MasterSchoolsDirectoryModule currentUser={user} />
              </ErrorBoundary>
            </div>
          )}

          {visitedTabs.has('users') && (
            <div className={activeTab === 'users' ? "tab-pane-active block" : "hidden"}>
              <ErrorBoundary>
                <UserManagementModule currentUser={user} />
              </ErrorBoundary>
            </div>
          )}

          {visitedTabs.has('invoicing') && (
            <div className={activeTab === 'invoicing' ? "tab-pane-active block" : "hidden"}>
              <ErrorBoundary>
                <InvoicingModule currentUser={user} />
              </ErrorBoundary>
            </div>
          )}

          {visitedTabs.has('logs') && (
            <div className={activeTab === 'logs' ? "tab-pane-active block" : "hidden"}>
              <ErrorBoundary>
                <FieldVisitRegistry currentUser={user} />
              </ErrorBoundary>
            </div>
          )}

          {visitedTabs.has('team') && (
            <div className={activeTab === 'team' ? "tab-pane-active block" : "hidden"}>
              <ErrorBoundary>
                <CanvasserLeaderboard currentUser={user} />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </main>

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#0c0d15]/90 backdrop-blur-2xl border-t border-white/[0.08] pb-safe z-50 px-2 py-2 shadow-2xl">
        <div className="grid grid-cols-6 gap-1 max-w-md mx-auto p-1 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-2 flex flex-col items-center gap-1 rounded-xl transition-colors text-center z-10", 
                  isActive 
                    ? "text-amber-300 font-black" 
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="managerActiveBottomTab"
                    className="absolute inset-0 bg-amber-400/15 border border-amber-400/35 rounded-xl shadow-[0_0_12px_rgba(251,191,36,0.15)] -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.5 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 shrink-0 relative z-10 transition-transform duration-200", isActive && "scale-110")} />
                <span className="text-[10px] font-bold tracking-tight truncate max-w-full relative z-10">
                  {tab.mobileLabel || tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
