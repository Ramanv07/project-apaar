import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, CheckCircle2 } from 'lucide-react';

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
    <div className="main-content-wrapper" style={{ maxWidth: '980px', marginTop: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left: Official Login Form */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <ShieldCheck size={26} color="#0f4c81" />
            <div>
              <h2 style={{ fontSize: '17px', color: '#1b2a49', fontWeight: 700 }}>Official Portal Access</h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>AICTE Institutional Identity Service</p>
            </div>
          </div>

          {error && (
            <div className="statutory-alert-box danger" style={{ fontSize: '12px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Official Username / AICTE ID
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px' }}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '32px' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-helper">Demo password: <code>Admin@TrustSeat2026</code></div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Authenticating Credentials...' : 'Sign In to Portal'}
            </button>
          </form>

          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
            Notice: All access attempts are timestamped and recorded in the append-only statutory audit trail.
          </div>
        </div>

        {/* Right: Evaluator Quick Access Cards (Built for SIH 2026 Jury) */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '24px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', color: '#0f4c81', fontWeight: 700 }}>
              Smart India Hackathon 2026 Evaluation Switcher
            </h3>
            <p style={{ fontSize: '12px', color: '#475569' }}>
              Select any persona below to authenticate instantly with appropriate role permissions:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <div
              onClick={() => handleQuickRole('AICTE_ADMIN', '/dashboard')}
              style={{
                border: '1px solid #cbd5e1',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0f4c81'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1b2a49' }}>
                  1. AICTE Central Administrator
                </span>
                <span className="status-badge blue">National Scope</span>
              </div>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                National oversight, What-If Quota Policy simulator, Review score anomaly graph, central audit.
              </p>
            </div>

            <div
              onClick={() => handleQuickRole('AICTE_REGIONAL_OFFICER', '/dashboard')}
              style={{
                border: '1px solid #cbd5e1',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0f4c81'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1b2a49' }}>
                  2. AICTE Regional Officer (Western Region)
                </span>
                <span className="status-badge slate">Regional Scope</span>
              </div>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                Jurisdictional view of Western Region institutions (Maharashtra & Gujarat), over-intake alerts.
              </p>
            </div>

            <div
              onClick={() => handleQuickRole('INSTITUTION_NODAL_OFFICER', '/institution-dashboard')}
              style={{
                border: '1px solid #cbd5e1',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0f4c81'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1b2a49' }}>
                  3. Institution Nodal Officer (ITAM Meerut)
                </span>
                <span className="status-badge amber">Planted Cluster</span>
              </div>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                Upload admissions, dry-run row validator with suggested fix, resolve transliteration queue.
              </p>
            </div>

            <div
              onClick={() => handleQuickRole('VERIFIER', '/verify')}
              style={{
                border: '1px solid #cbd5e1',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0f4c81'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1b2a49' }}>
                  4. Third-Party Verifier (Employer / Regulator)
                </span>
                <span className="status-badge green">Read-Only</span>
              </div>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                QR scan & record reference verification, zero personal data leak, cryptographic verification token.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
