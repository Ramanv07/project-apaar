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
  FileText
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { user } = useAuth();
  const { t } = usePortalSettings();

  if (!user) {
    return (
      <nav className="gov-nav-bar">
        <NavLink to="/verify" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <Search size={15} />
          <span>{t.navPublicVerify}</span>
        </NavLink>
        <NavLink to="/login" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <span>Official Portal Login</span>
        </NavLink>
      </nav>
    );
  }

  const isAicteOfficer = user.role === 'AICTE_ADMIN' || user.role === 'AICTE_REGIONAL_OFFICER';
  const isNodal = user.role === 'INSTITUTION_NODAL_OFFICER';
  const isVerifier = user.role === 'VERIFIER';

  return (
    <nav className="gov-nav-bar" aria-label="Main Navigation">
      {isAicteOfficer && (
        <>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={15} />
            <span>{t.navDashboard}</span>
          </NavLink>
          <NavLink to="/quota-waterfall" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <GitBranch size={15} />
            <span>{t.navQuotaWaterfall} & Policy</span>
          </NavLink>
          <NavLink to="/review-flags" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={15} />
            <span>{t.navReviewFlags} & Fraud Graph</span>
          </NavLink>
          <NavLink to="/audit-ledger" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <FileText size={15} />
            <span>{t.navAuditLedger}</span>
          </NavLink>
          <NavLink to="/verify" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <Search size={15} />
            <span>{t.navPublicVerify}</span>
          </NavLink>
        </>
      )}

      {isNodal && (
        <>
          <NavLink to="/institution-dashboard" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={15} />
            <span>{t.navInstitutionDashboard}</span>
          </NavLink>
          <NavLink to="/upload-admissions" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <Upload size={15} />
            <span>{t.navUpload}</span>
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <Users size={15} />
            <span>{t.navStudents}</span>
          </NavLink>
          <NavLink to="/discrepancies" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={15} />
            <span>{t.navDiscrepancy}</span>
          </NavLink>
          <NavLink to="/quota-waterfall" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <GitBranch size={15} />
            <span>{t.navQuotaWaterfall}</span>
          </NavLink>
          <NavLink to="/verify" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <Search size={15} />
            <span>{t.navPublicVerify}</span>
          </NavLink>
        </>
      )}

      {isVerifier && (
        <>
          <NavLink to="/verify" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <Search size={15} />
            <span>{t.navPublicVerify}</span>
          </NavLink>
          <NavLink to="/audit-ledger" className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}>
            <FileText size={15} />
            <span>Consent Ledger</span>
          </NavLink>
        </>
      )}
    </nav>
  );
};
