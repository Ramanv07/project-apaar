import React from 'react';
import { Sun, Moon, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePortalSettings } from '../../context/PortalSettingsContext';

export const FloatingPillHeader: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const { isDark, toggleTheme, t } = usePortalSettings();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value;
    if (selectedRole) {
      await quickSwitchRole(selectedRole);
    }
  };

  return (
    <header className="sticky top-2 sm:top-3.5 z-40 px-3 sm:px-6 w-full flex justify-center pointer-events-none transition-all">
      <div className="pointer-events-auto w-full max-w-7xl mx-auto rounded-full bg-white/90 dark:bg-[#16181d]/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-md dark:shadow-2xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 text-zinc-900 dark:text-zinc-100">
        
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 dark:bg-[#121316] text-white flex items-center justify-center border border-zinc-700/50 flex-shrink-0">
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-zinc-950 dark:text-white tracking-tight text-sm sm:text-base font-display truncate block">
              TrustSeat
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block truncate leading-none">
              AICTE Data & Quota Portal
            </span>
          </div>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          {/* Demo Quick Role Switcher */}
          {user && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-[#111215] border border-zinc-200/70 dark:border-zinc-800 text-xs">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Role:</span>
              <select
                value={user.role}
                onChange={handleRoleChange}
                className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 border-none outline-none cursor-pointer pr-1 py-0.5"
                title="Switch demo role instantly"
              >
                <option value="AICTE_ADMIN" className="bg-white dark:bg-[#16181d] text-zinc-900 dark:text-zinc-100">AICTE Admin</option>
                <option value="AICTE_REGIONAL_OFFICER" className="bg-white dark:bg-[#16181d] text-zinc-900 dark:text-zinc-100">Regional Officer</option>
                <option value="INSTITUTION_NODAL_OFFICER" className="bg-white dark:bg-[#16181d] text-zinc-900 dark:text-zinc-100">Nodal Officer (Meerut)</option>
                <option value="VERIFIER" className="bg-white dark:bg-[#16181d] text-zinc-900 dark:text-zinc-100">Public Verifier</option>
              </select>
            </div>
          )}

          {/* Theme Toggle Pill */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1a1d23] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
            title="Toggle theme (Light / Matte Charcoal Dark)"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          {/* User Profile Pill */}
          {user ? (
            <div className="flex items-center gap-2 p-1 pl-1.5 pr-3 rounded-full bg-zinc-50 dark:bg-[#1a1d23] border border-zinc-200 dark:border-zinc-800">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-xs uppercase font-mono">
                {user.full_name ? user.full_name[0] : 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-tight truncate max-w-[140px]">
                  {user.full_name || user.username}
                </p>
                <p className="text-[10px] text-zinc-400 capitalize truncate max-w-[140px]">
                  {user.role.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login</span>
            </a>
          )}

          {/* Logout Action */}
          {user && (
            <button
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-rose-500 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={t.signout || 'Sign out'}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
