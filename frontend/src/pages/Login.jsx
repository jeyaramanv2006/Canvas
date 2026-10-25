import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Fingerprint, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { mockApi } from '../mockApi';
import { AuthContext } from '../App';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
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
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden bg-transparent text-white selection:bg-amber-400 selection:text-black">
      {/* Login-only ambient lighting glow that blends with the topographic background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px] sm:h-[30rem] sm:w-[30rem]" />
        <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-amber-400/[0.08] blur-[110px] sm:h-[34rem] sm:w-[34rem]" />
      </div>

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] items-center px-4 py-5 sm:px-8 sm:py-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#101117]/75 shadow-[0_30px_120px_rgba(0,0,0,0.48)] backdrop-blur-[18px] lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* Brand panel: compact on mobile, architectural hero on desktop. */}
          <section className="relative flex min-h-[168px] flex-col justify-between overflow-hidden border-b border-white/10 p-5 sm:min-h-[210px] sm:p-8 lg:min-h-full lg:border-b-0 lg:border-r lg:border-white/10 lg:p-11">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* Clean static architectural circles */}
              <div className="absolute -right-16 -top-28 h-64 w-64 rounded-full border border-white/10 lg:h-[28rem] lg:w-[28rem]" />
              <div className="absolute -right-7 -top-20 h-48 w-48 rounded-full border border-white/[0.07] lg:right-0 lg:top-[-7rem] lg:h-[22rem] lg:w-[22rem]" />

              {/* Diamond with specular shine running along the perimeter edges */}
              <div className="absolute bottom-[-4rem] left-[-4rem] h-40 w-40 rotate-45 border border-lime-300/20 bg-gradient-to-br from-lime-300/[0.08] to-transparent lg:bottom-12 lg:left-12 lg:h-56 lg:w-56">
                <svg className="absolute -inset-[1px] h-[calc(100%+2px)] w-[calc(100%+2px)] overflow-visible" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="shine-specular" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="35%" stopColor="#ffffff" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="65%" stopColor="#ffffff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow-specular" x="-40%" y="-40%" width="180%" height="180%">
                      <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#ffffff" floodOpacity="0.95" />
                      <feDropShadow dx="0" dy="0" stdDeviation="3.0" floodColor="rgba(190, 242, 100, 0.6)" />
                    </filter>
                  </defs>
                  <rect
                    x="0.5"
                    y="0.5"
                    width="99"
                    height="99"
                    pathLength="100"
                    fill="none"
                    stroke="url(#shine-specular)"
                    strokeWidth="1.1"
                    strokeDasharray="4.8 95.2"
                    strokeLinecap="round"
                    filter="url(#glow-specular)"
                    className="animate-stroke-dash"
                  />
                </svg>
              </div>
            </div>

            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              className="group relative z-10 mt-4 flex w-fit cursor-default items-center gap-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] px-2 py-2 transition-colors duration-300 hover:border-[#d9b763]/35 hover:bg-white/[0.045] sm:mt-12 sm:gap-4 sm:px-12 sm:py-8"
              aria-label="Murugan Groups — The One"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-[#e8cc83]/[0.14] to-transparent opacity-0 transition-all duration-700 group-hover:left-[130%] group-hover:opacity-100" />
              <div className="relative h-[70px] w-[84px] shrink-0 overflow-hidden rounded-xl border border-[#d9b763]/25 bg-[#242321] transition-colors duration-300 group-hover:border-[#d9b763]/50 sm:h-[98px] sm:w-[142px]">
                <img src="/logo.jpg" alt="Murugan Groups logo" className="h-full w-full scale-[1.6] object-cover transition-transform duration-500 group-hover:scale-[1.24] -translate-x-1 -translate-y-1" />
              </div>
              <div className="relative min-w-0 pr-1">
                <p style={{ fontFamily: '"Google Sans Flex", "Google Sans", sans-serif' }} className="whitespace-nowrap text-[clamp(0.78rem,4.5vw,1.35rem)] font-bold leading-tight tracking-[0.035em] text-[#f4f0e7] sm:text-2xl sm:tracking-[0.055em]">
                  MURUGAN GROUPS
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.34em] text-[#d9b763] sm:mt-2 sm:text-sm sm:tracking-[0.42em]">
                  THE ONE
                </p>
                <span aria-hidden="true" className="mt-2 block h-px w-0 bg-gradient-to-r from-[#e6c875]/80 to-transparent transition-all duration-500 group-hover:w-full" />
              </div>
            </motion.div>

            <div className="relative z-10 mt-7 lg:mb-8 lg:mt-auto lg:max-w-lg">
              <div className="mb-4 hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-200/75 lg:flex">
                <span className="h-px w-8 bg-lime-300/70" />
                Canvassing &amp; Financials
              </div>
              <h1 className="max-w-[12ch] text-[clamp(2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] tracking-[-0.065em] text-white">
                One team.<br />One view.
              </h1>
              <div className="mt-5 hidden max-w-sm items-center justify-between border-t border-white/15 pt-4 text-xs text-white/45 lg:flex">
                <span>Field activity</span><span className="text-white/20">/</span><span>Operations</span><span className="text-white/20">/</span><span>Financials</span>
              </div>
              <p className="mt-3 text-xs font-medium tracking-wide text-white/55 lg:hidden">Canvassing and Financials</p>
            </div>

            <div className="relative z-10 mt-6 hidden items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30 lg:flex">
              <span className="font-mono">MG</span><span className="h-px w-8 bg-white/20" /><span>Authorized workspace</span>
            </div>
          </section>

          {/* Sign-in panel */}
          <section className="flex items-center justify-center p-5 sm:p-9 lg:p-12">
            <div className="w-full max-w-[420px]">
              <div className="mb-7 sm:mb-9">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-lime-200/20 bg-lime-300/[0.08] text-lime-200">
                  <Fingerprint className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-lime-200/75">Secure access</p>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Sign in to continue</h2>
                <p className="mt-2 text-sm leading-6 text-white/50">Use your assigned account to access your workspace.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4" aria-busy={loading}>
                <div className="space-y-1.5">
                  <label htmlFor="login-username" className="block text-xs font-semibold text-white/75">Username</label>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="min-h-[52px] w-full rounded-xl border border-white/[0.14] bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/25 hover:border-white/25 focus:border-lime-200/70 focus:ring-2 focus:ring-lime-300/20"
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-white/75">Password</label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="min-h-[52px] w-full rounded-xl border border-white/[0.14] bg-black/25 px-4 text-base text-white outline-none transition placeholder:text-white/25 hover:border-white/25 focus:border-lime-200/70 focus:ring-2 focus:ring-lime-300/20"
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <motion.p
                    id="login-error"
                    role="alert"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-rose-300/20 bg-rose-400/[0.08] px-3.5 py-3 text-sm leading-5 text-rose-200"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={loading ? undefined : { y: -1 }}
                  whileTap={loading ? undefined : { scale: 0.99 }}
                  disabled={loading}
                  type="submit"
                  className="mt-2 flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-extrabold text-[#11130a] shadow-[0_8px_28px_rgba(190,255,0,0.16)] transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101117] disabled:cursor-wait disabled:opacity-65"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
                  <span>{loading ? 'Authenticating…' : 'Sign In'}</span>
                  {!loading && <ArrowUpRight className="ml-auto h-4 w-4 opacity-60" aria-hidden="true" />}
                </motion.button>
              </form>

              <div className="mt-7 border-t border-white/10 pt-5 sm:mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/65">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-lime-200/80" aria-hidden="true" />
                  <span>Authorized Personnel Only</span>
                </div>
                <p className="mt-2 max-w-sm text-xs leading-5 text-white/40">
                  Contact your Operations Admin or CEO if you need an account or password reset.
                </p>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
