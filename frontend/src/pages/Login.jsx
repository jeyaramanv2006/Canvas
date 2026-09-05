import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, Crown, BarChart3, TrendingUp, Settings, Briefcase } from 'lucide-react';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await mockApi.login(email, password);
      setUser(res.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password');
    setLoading(true);
    setError('');
    try {
      const res = await mockApi.login(demoEmail, 'password');
      setUser(res.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ onClick, icon: Icon, iconColor, borderColor, bgColor, badgeBg, badgeText, badgeTextColor, label, subtitle, email: cardEmail }) => (
    <div
      onClick={onClick}
      className={`p-3 bg-black/40 border ${borderColor} hover:${bgColor} rounded-2xl cursor-pointer transition-all text-left group shadow-md`}
    >
      <div className="flex justify-between items-center">
        <span className={`${iconColor} font-bold text-xs flex items-center gap-1.5`}>
          <Icon className="w-4 h-4" />
          {label}
        </span>
        <span className={`text-[10px] ${badgeBg} ${badgeTextColor} px-2 py-0.5 rounded-full font-bold`}>{badgeText}</span>
      </div>
      <span className="text-gray-400 block text-[11px] mt-1">{cardEmail} • {subtitle}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden relative selection:bg-yellow-400 selection:text-black">
      {/* Dynamic Glow Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-yellow-400/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-amber-500/15 blur-[140px] rounded-full" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-[#16171d]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-yellow-400/30"
          >
            <span className="text-xl font-black text-black tracking-tighter">MC</span>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">Murugan Canvass</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Enterprise field sales & financial command platform</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-600 text-sm"
                placeholder="user@murugan.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-600 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-400 text-xs font-semibold text-center bg-red-500/10 border border-red-500/20 py-2 rounded-xl"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            type="submit"
            style={{ backgroundColor: '#FFD700', color: '#000000' }}
            className="w-full font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 hover:brightness-105 active:brightness-95 transition-all disabled:opacity-70 shadow-lg shadow-yellow-500/30 text-sm cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Instant Demo Access</p>
            <span className="text-[10px] text-gray-500">Password: <strong className="text-gray-300">password</strong></span>
          </div>

          {/* C-Suite Section */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">C-Suite Executive</p>

            {/* CEO */}
            <div
              onClick={() => loginWithDemo('arjun@murugan.com')}
              className="p-3 bg-black/40 border border-yellow-500/40 hover:border-yellow-400 hover:bg-black/60 rounded-2xl cursor-pointer transition-all text-left shadow-md"
            >
              <div className="flex justify-between items-center">
                <span className="text-yellow-400 font-bold text-xs flex items-center gap-1.5">
                  <Crown className="w-4 h-4" />
                  Arjun — CEO
                </span>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full font-bold">SUPER ADMIN</span>
              </div>
              <span className="text-gray-400 block text-[11px] mt-1">arjun@murugan.com • Global access — all dashboards & financials</span>
            </div>

            {/* CFO */}
            <div
              onClick={() => loginWithDemo('priya@murugan.com')}
              className="p-3 bg-black/40 border border-blue-500/40 hover:border-blue-400 hover:bg-black/60 rounded-2xl cursor-pointer transition-all text-left shadow-md"
            >
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  Priya — CFO
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">FINANCIAL</span>
              </div>
              <span className="text-gray-400 block text-[11px] mt-1">priya@murugan.com • Sales, GP, Collections, Receivables, Cash & Bank</span>
            </div>

            {/* CCO */}
            <div
              onClick={() => loginWithDemo('karthik@murugan.com')}
              className="p-3 bg-black/40 border border-emerald-500/40 hover:border-emerald-400 hover:bg-black/60 rounded-2xl cursor-pointer transition-all text-left shadow-md"
            >
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Karthik — CCO
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">COMMERCIAL</span>
              </div>
              <span className="text-gray-400 block text-[11px] mt-1">karthik@murugan.com • Field ops, conversion rates & canvassing KPIs</span>
            </div>
          </div>

          {/* Operations & Field */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-2">Operations & Field</p>

            {/* Admin Exec */}
            <div
              onClick={() => loginWithDemo('sudhan@murugan.com')}
              className="p-3 bg-black/40 border border-amber-500/30 hover:border-amber-400 hover:bg-black/60 rounded-2xl cursor-pointer transition-all text-left shadow-md"
            >
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  Sudhan — Admin Executive
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">OPERATIONS</span>
              </div>
              <span className="text-gray-400 block text-[11px] mt-1">sudhan@murugan.com • Visit logs, invoicing & field data management</span>
            </div>

            {/* Canvassers */}
            <div className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 mt-1">
              <Briefcase className="w-3.5 h-3.5 text-yellow-400" />
              <span>Field Sales Executives:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {[
                { name: 'Gokul', email: 'gokul@murugan.com', title: 'Senior Canvasser' },
                { name: 'Murugan', email: 'murugan@murugan.com', title: 'Field Sales Lead' },
                { name: 'Suhas', email: 'suhas@murugan.com', title: 'Field Canvasser' },
              ].map(({ name, email: e, title }) => (
                <div
                  key={e}
                  onClick={() => loginWithDemo(e)}
                  className="p-3 bg-black/40 border border-white/10 hover:border-yellow-400/50 rounded-2xl cursor-pointer transition-all text-left hover:bg-black/60 shadow-md"
                >
                  <span className="text-white font-bold block">{name}</span>
                  <span className="text-gray-400 text-[10px] block">{title}</span>
                  <span className="text-gray-500 text-[10px] block mt-0.5">{e}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
