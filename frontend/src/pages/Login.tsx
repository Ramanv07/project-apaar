import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('aicte_admin');
  const [password, setPassword] = useState('Admin@TrustSeat2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, quickSwitchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (roleKey: string, targetPath: string) => {
    try {
      await quickSwitchRole(roleKey);
      navigate(targetPath);
    } catch (err: any) {
      setError('Quick login failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Official Login Form */}
        <div className="lg:col-span-5 bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-xs transition-colors">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-[#111215] text-white flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white font-display tracking-tight">
                Official Portal Access
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AICTE Institutional Identity Service
              </p>
            </div>
          </div>

          {error && (
            <div className="statutory-alert-box danger text-xs mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5" htmlFor="username">
                Official Username / AICTE ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="username"
                  type="text"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 pl-10 pr-3.5 py-2.5 text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors font-mono"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 pl-10 pr-3.5 py-2.5 text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                Demo default: <code className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Admin@TrustSeat2026</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 shadow-xs disabled:opacity-50"
              disabled={loading}
            >
              <span>{loading ? 'Authenticating Credentials...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-400 dark:text-zinc-500">
            Notice: All access attempts are recorded in the immutable statutory audit ledger.
          </div>
        </div>

        {/* Right: Evaluator Quick Access Cards (Built for SIH 2026 Jury) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-xs transition-colors">
          <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-4">
            <h3 className="text-base font-bold text-zinc-950 dark:text-white font-display tracking-tight">
              Evaluation Persona Switcher
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select any role below to authenticate instantly with appropriate statutory permissions:
            </p>
          </div>

          <div className="space-y-3">
            
            <div
              onClick={() => handleQuickRole('AICTE_ADMIN', '/dashboard')}
              className="group p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#111215] hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-[#1a1d23] cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white font-display group-hover:text-sky-500 transition-colors">
                  1. AICTE Central Administrator
                </span>
                <StatusBadge label="National Scope" variant="blue" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                National quota waterfall simulator, intake compliance analytics, review score anomaly graph, central audit ledger.
              </p>
            </div>

            <div
              onClick={() => handleQuickRole('AICTE_REGIONAL_OFFICER', '/dashboard')}
              className="group p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#111215] hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-[#1a1d23] cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white font-display group-hover:text-sky-500 transition-colors">
                  2. AICTE Regional Officer (Western Region)
                </span>
                <StatusBadge label="Regional Scope" variant="slate" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Jurisdictional view of Western Region institutions (Maharashtra & Gujarat), over-intake alerts and enforcement.
              </p>
            </div>

            <div
              onClick={() => handleQuickRole('INSTITUTION_NODAL_OFFICER', '/institution-dashboard')}
              className="group p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#111215] hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-[#1a1d23] cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white font-display group-hover:text-amber-500 transition-colors">
                  3. Institution Nodal Officer (ITAM Meerut)
                </span>
                <StatusBadge label="Planted Cluster" variant="amber" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Upload batch admissions, dry-run row validator with suggested fix, resolve Hindi-English transliteration queue.
              </p>
            </div>

            <div
              onClick={() => handleQuickRole('VERIFIER', '/verify')}
              className="group p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#111215] hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-[#1a1d23] cursor-pointer transition-all"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white font-display group-hover:text-emerald-500 transition-colors">
                  4. Third-Party Verifier (Employer / Regulator)
                </span>
                <StatusBadge label="Read-Only" variant="green" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                QR scan & record reference verification, zero personal data leak, cryptographic verification token proof.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
