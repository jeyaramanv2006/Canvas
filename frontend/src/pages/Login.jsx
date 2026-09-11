import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await mockApi.login(username, password);
      setUser(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
        className="w-full max-w-md bg-[#16171d]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-yellow-400/30"
          >
            <span className="text-2xl font-black text-black tracking-tighter">MG</span>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight uppercase">MG The One</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Institutional Canvassing & Uniform Orders Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Username (<span className="text-amber-400 lowercase font-mono">&lt;name&gt;@&lt;role&gt;</span>)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-600 text-sm font-mono"
                placeholder="e.g. sudhan@ceo or admin@admin"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-600 text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-400 text-xs font-semibold text-center bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl"
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
            className="w-full font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 hover:brightness-105 active:brightness-95 transition-all disabled:opacity-70 shadow-lg shadow-yellow-500/30 text-sm cursor-pointer mt-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>

        {/* Security & Access Info */}
        <div className="mt-8 pt-5 border-t border-white/10 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Authorized Personnel Only</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Contact your Operations Admin or CEO if you need an account or password reset.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
