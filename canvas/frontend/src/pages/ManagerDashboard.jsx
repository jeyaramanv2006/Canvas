import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Download, Users, TrendingUp, Target, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280']; // Hot, Warm, Cold, Not Interested

export default function ManagerDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await mockApi.getDashboardStats();
    // Simulate some extra chart data based on stats
    setStats({
      ...data,
      interestData: [
        { name: 'Hot', value: data.hotLeads || 15 },
        { name: 'Warm', value: 25 },
        { name: 'Cold', value: 10 },
        { name: 'Not Interested', value: 5 },
      ],
      districtData: [
        { name: 'Coimbatore', visits: 45 },
        { name: 'Madurai', visits: 32 },
        { name: 'Salem', visits: 28 },
        { name: 'Tiruppur', visits: 20 },
      ]
    });
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-murugan-dark text-white">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-murugan-dark text-white pb-10">
      {/* Header */}
      <header className="bg-murugan-card border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto p-4 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-murugan-accent to-murugan-purple rounded-xl flex items-center justify-center">
              <span className="font-bold text-black text-lg">MC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Manager Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={() => setUser(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-400">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Visits', value: stats.totalVisits, icon: Briefcase, color: 'text-blue-400' },
            { label: 'Hot Leads', value: stats.hotLeads, icon: Target, color: 'text-red-400' },
            { label: 'Orders Won', value: stats.ordersWon, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Win Rate', value: `${stats.winRate}%`, icon: Users, color: 'text-murugan-accent' },
          ].map((kpi, idx) => (
            <motion.div 
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-murugan-card p-5 rounded-2xl border border-white/5 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm text-gray-400 font-medium">{kpi.label}</p>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <h3 className="text-3xl font-bold">{kpi.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interest Breakdown */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-murugan-card p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-bold mb-6">Pipeline Interest Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.interestData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.interestData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {stats.interestData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Districts */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-murugan-card p-6 rounded-2xl border border-white/5"
          >
            <h3 className="text-lg font-bold mb-6">Top Districts (Visits)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.districtData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  />
                  <Bar dataKey="visits" fill="#FFD700" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
