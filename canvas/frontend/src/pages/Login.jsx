import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2 } from 'lucide-react';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-murugan-accent/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-murugan-purple/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-murugan-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-murugan-accent to-murugan-purple rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
          >
            <span className="text-2xl font-bold text-black tracking-tighter">MC</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Murugan Canvass</h1>
          <p className="text-murugan-gray/80 text-sm">Log visits. Capture interest. Grow districts.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent/50 transition-all placeholder:text-gray-600"
                placeholder="user@murugan.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-murugan-accent/50 transition-all placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full bg-murugan-accent text-black font-bold rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-500">
          <p>Demo Accounts:</p>
          <p>Canvasser: field@murugan.com / password</p>
          <p>Manager: manager@murugan.com / password</p>
        </div>
      </motion.div>
    </div>
  );
}
