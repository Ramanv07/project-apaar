import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalSettings } from '../../context/PortalSettingsContext';
import { ShieldCheck, LogOut, UserCheck } from 'lucide-react';

export const PortalHeader: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const { t } = usePortalSettings();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value;
    if (selectedRole) {
      await quickSwitchRole(selectedRole);
    }
  };

  return (
    <header className="portal-header">
      <div className="portal-brand">
        <div className="portal-emblem-badge" title="All India Council for Technical Education">
          <span>AICTE<br />GOV</span>
        </div>
        <div className="portal-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="#FF9933" />
            <h1>{t.portalTitle}</h1>
          </div>
          <p>{t.portalSubtitle}</p>
        </div>
      </div>

      <div className="portal-user-meta">
        {user ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>{user.full_name}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {user.institution_name ? user.institution_name : user.region ? `Regional Jurisdiction: ${user.region}` : 'Central Regulatory Jurisdiction'}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="user-badge">{(user?.role || 'AICTE_ADMIN').replace(/_/g, ' ')}</span>
              
              {/* Evaluator Quick Role Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Demo Role:</span>
                <select
                  value={user?.role || 'AICTE_ADMIN'}
                  onChange={handleRoleChange}
                  style={{
                    fontSize: '11px',
                    padding: '2px 4px',
                    backgroundColor: '#0f172a',
                    color: '#FF9933',
                    border: '1px solid #475569',
                    borderRadius: '2px'
                  }}
                  title="Switch roles instantly for evaluation"
                >
                  <option value="AICTE_ADMIN">AICTE Admin</option>
                  <option value="AICTE_REGIONAL_OFFICER">Regional Officer</option>
                  <option value="INSTITUTION_NODAL_OFFICER">Nodal Officer (Meerut)</option>
                  <option value="VERIFIER">Public Verifier</option>
                </select>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ backgroundColor: 'transparent', color: '#ffffff', borderColor: '#475569' }}
              title={t.signout}
            >
              <LogOut size={14} />
              <span>{t.signout}</span>
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Institutional Access:</span>
            <a href="/login" className="btn btn-primary btn-sm">
              <UserCheck size={14} />
              <span>Official Login</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
};
