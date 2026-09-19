import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Users, Receipt, History, Trophy, Building2
} from 'lucide-react';
import { AuthContext } from '../App';
import InvoicingModule from '../components/InvoicingModule';
import FieldVisitRegistry from '../components/FieldVisitRegistry';
import CanvasserLeaderboard from '../components/CanvasserLeaderboard';
import ErrorBoundary from '../components/ErrorBoundary';
import UserManagementModule from '../components/UserManagementModule';
import MasterSchoolsDirectoryModule from '../components/MasterSchoolsDirectoryModule';
import { getRoleConfig } from '../lib/rbac';
import { cn } from '../lib/utils';

export default function ManagerDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('schools'); // 'schools', 'users', 'invoicing', 'logs', 'team'

  const roleConfig = getRoleConfig(user);

  const navTabs = [
    { id: 'schools', label: 'Master Schools DB', mobileLabel: 'Schools', icon: Building2 },
    { id: 'users', label: 'User Directory & Roles', mobileLabel: 'Users', icon: Users },
    { id: 'invoicing', label: 'Invoicing & Records', mobileLabel: 'Invoices', icon: Receipt },
    { id: 'logs', label: 'Central Visit Logs', mobileLabel: 'Visits', icon: History },
    { id: 'team', label: 'Team Leaderboard', mobileLabel: 'Leaderboard', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-16 selection:bg-murugan-accent selection:text-black">
      {/* Header */}
      <header className="bg-[#14151b]/95 border-b border-white/10 sticky top-0 z-40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-20 rounded-xl overflow-hidden border border-white/10 shadow-md bg-[#14151b] flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="MG The One" 
                  className="w-full h-full object-cover scale-[1.38]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">The One</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    Admin Executive
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">{user?.name || 'Admin'} (Admin Executive)</span>
                </p>
              </div>

            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setUser(null)}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Desktop-Only Navigation Bar */}
          <div className="hidden md:flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 z-10",
                    isActive
                      ? "text-black font-black"
                      : "bg-[#1c1d25] text-gray-400 hover:text-white hover:bg-[#252632] border border-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="managerActiveTopTab"
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl shadow-xl shadow-amber-400/25 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10", isActive ? "text-black" : "text-gray-400")} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 pb-28 md:pb-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            <ErrorBoundary>
              {activeTab === 'schools' && (
                <MasterSchoolsDirectoryModule currentUser={user} />
              )}

              {activeTab === 'users' && (
                <UserManagementModule currentUser={user} />
              )}

              {activeTab === 'invoicing' && (
                <InvoicingModule currentUser={user} />
              )}

              {activeTab === 'logs' && (
                <FieldVisitRegistry currentUser={user} />
              )}

              {activeTab === 'team' && (
                <CanvasserLeaderboard currentUser={user} />
              )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile-Only Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#14151b]/95 backdrop-blur-2xl border-t border-white/10 pb-safe z-50 px-1.5 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-2 flex flex-col items-center gap-1 rounded-2xl transition-colors text-center z-10", 
                  isActive 
                    ? "text-amber-400 font-black" 
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="managerActiveBottomTab"
                    className="absolute inset-0 bg-amber-500/15 border border-amber-500/40 rounded-2xl shadow-lg shadow-amber-500/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0 relative z-10" />
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
