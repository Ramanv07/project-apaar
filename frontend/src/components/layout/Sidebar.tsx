import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePortalSettings } from '../../context/PortalSettingsContext';
import {
  LayoutDashboard,
  Upload,
  Users,
  AlertTriangle,
  GitBranch,
  ShieldAlert,
  Search,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { isDark, t } = usePortalSettings();

  const isAicteOfficer = user?.role === 'AICTE_ADMIN' || user?.role === 'AICTE_REGIONAL_OFFICER';
  const isNodal = user?.role === 'INSTITUTION_NODAL_OFFICER';
  const isVerifier = user?.role === 'VERIFIER';

  const portalTitle = isAicteOfficer
    ? 'AICTE Regulatory Portal'
    : isNodal
    ? 'Institution Portal'
    : isVerifier
    ? 'Verifier Consent Portal'
    : 'TrustSeat National Portal';

  const portalSubtitle = user?.institution_name
    ? user.institution_name
    : user?.region
    ? `Region: ${user.region}`
    : 'National Student & Quota Ledger';

  return (
    <aside
      className="hidden md:flex w-64 flex-shrink-0 border-r border-zinc-200/80 dark:border-zinc-800/80 h-screen sticky top-0 flex-col justify-between select-none relative overflow-y-auto transition-colors z-30"
      style={{
        backgroundColor: isDark ? '#0e1013' : '#fbfcfd',
        backgroundImage: isDark
          ? 'radial-gradient(rgba(255, 255, 255, 0.045) 1.1px, transparent 1.1px)'
          : 'radial-gradient(rgba(100, 116, 139, 0.14) 1.1px, transparent 1.1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div>
        {/* Frosted Header */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#131519]/90 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <p className="text-sm font-bold text-zinc-950 dark:text-white tracking-tight font-display truncate">
              {portalTitle}
            </p>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
            {portalSubtitle}
          </p>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {!user && (
            <>
              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <Search className="w-4 h-4 flex-shrink-0 text-sky-500" />
                <span className="truncate">{t.navPublicVerify}</span>
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Portal Login</span>
              </NavLink>
            </>
          )}

          {isAicteOfficer && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navDashboard}</span>
              </NavLink>

              <NavLink
                to="/quota-waterfall"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <GitBranch className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navQuotaWaterfall}</span>
              </NavLink>

              <NavLink
                to="/review-flags"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navReviewFlags} & Fraud Graph</span>
              </NavLink>

              <NavLink
                to="/audit-ledger"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navAuditLedger}</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navPublicVerify}</span>
              </NavLink>
            </>
          )}

          {isNodal && (
            <>
              <NavLink
                to="/institution-dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navInstitutionDashboard}</span>
              </NavLink>

              <NavLink
                to="/upload-admissions"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <Upload className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navUpload}</span>
              </NavLink>

              <NavLink
                to="/students"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navStudents}</span>
              </NavLink>

              <NavLink
                to="/discrepancies"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navDiscrepancy}</span>
              </NavLink>

              <NavLink
                to="/quota-waterfall"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <GitBranch className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navQuotaWaterfall}</span>
              </NavLink>

              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navPublicVerify}</span>
              </NavLink>
            </>
          )}

          {isVerifier && (
            <>
              <NavLink
                to="/verify"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t.navPublicVerify}</span>
              </NavLink>
              <NavLink
                to="/audit-ledger"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-950 dark:text-white font-semibold border-l-2 border-l-sky-500'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`
                }
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Consent Ledger</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Frosted Footer */}
      <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#131519]/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
            System Status: Operational
          </p>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
          APAAR Protocol v2.4 • SIH 2026
        </p>
      </div>
    </aside>
  );
};
