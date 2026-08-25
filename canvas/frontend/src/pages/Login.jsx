import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, ShieldCheck, Briefcase, Sparkles, UserCheck } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden relative selection:bg-murugan-accent selection:text-black">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-murugan-accent/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 blur-[140px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-murugan-card/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-amber-400/20"
          >
            <span className="text-xl font-black text-black tracking-tighter">MC</span>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">Murugan Canvass</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Log visits • Track school orders • Grow districts</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent transition-all placeholder:text-gray-600 text-sm"
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
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent transition-all placeholder:text-gray-600 text-sm"
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
            className="w-full bg-murugan-accent text-black font-extrabold rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors disabled:opacity-70 shadow-lg shadow-murugan-accent/20 text-sm"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>

        {/* Demo Accounts List */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Instant Demo Access:</p>
            <span className="text-[10px] text-gray-500">Password: <strong className="text-gray-300">password</strong></span>
          </div>

          {/* Admin Role */}
          <div 
            onClick={() => loginWithDemo('manager@murugan.com')}
            className="p-3 bg-black/40 border border-amber-500/30 hover:border-amber-400 rounded-2xl cursor-pointer transition-all text-left group hover:bg-black/60 shadow-md"
          >
            <div className="flex justify-between items-center">
              <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Executive Portal (Boss Baddie)
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Manager</span>
            </div>
            <span className="text-gray-400 block text-[11px] mt-1">manager@murugan.com • Company Financials, Analytics & Invoicing</span>
          </div>

          {/* Canvasser Roles */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-murugan-accent" />
              <span>Field Sales Executives:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div 
                onClick={() => loginWithDemo('field@murugan.com')}
                className="p-3 bg-black/40 border border-white/10 hover:border-murugan-accent rounded-2xl cursor-pointer transition-all text-left hover:bg-black/60 shadow-md"
              >
                <span className="text-white font-bold block">Rascals</span>
                <span className="text-gray-500 text-[10px] block mt-0.5">field@murugan.com</span>
              </div>
              <div 
                onClick={() => loginWithDemo('field2@murugan.com')}
                className="p-3 bg-black/40 border border-white/10 hover:border-murugan-accent rounded-2xl cursor-pointer transition-all text-left hover:bg-black/60 shadow-md"
              >
                <span className="text-white font-bold block">Royal Gaint</span>
                <span className="text-gray-500 text-[10px] block mt-0.5">field2@murugan.com</span>
              </div>
              <div 
                onClick={() => loginWithDemo('field3@murugan.com')}
                className="p-3 bg-black/40 border border-white/10 hover:border-murugan-accent rounded-2xl cursor-pointer transition-all text-left hover:bg-black/60 shadow-md"
              >
                <span className="text-white font-bold block">Fireclapper</span>
                <span className="text-gray-500 text-[10px] block mt-0.5">field3@murugan.com</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
