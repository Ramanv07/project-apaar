import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { ShieldCheck, Search, CheckCircle, Clock, Lock, Building, QrCode } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const PublicVerify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [recordRef, setRecordRef] = useState('');
  const [apaarId, setApaarId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setRecordRef(ref);
      handleLookup(ref, '');
    }
  }, [searchParams]);

  const handleLookup = async (refVal?: string, apaarVal?: string) => {
    const qRef = refVal !== undefined ? refVal : recordRef;
    const qApaar = apaarVal !== undefined ? apaarVal : apaarId;

    if (!qRef.trim() && !qApaar.trim()) {
      setError("Please provide either an official Record Reference (e.g. TS-2025-MH-...) or 12-digit APAAR ID.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/verify/credential', {
        record_ref: qRef.trim() || null,
        apaar_id: qApaar.trim() || null,
        verifier_name: "Authorized Third-Party Verifier",
        verifier_organization: "National Qualification Verification Service",
        verification_purpose: "ACADEMIC_CREDENTIAL_CHECK"
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "No verified enrolment found for the provided identifier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '880px' }}>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Third-Party Credential Verification Portal</h1>
          <p className="page-subtitle">
            Employer & Regulatory Verification Service — Minimal Permitted Attribute Disclosure
          </p>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="statutory-alert-box">
        <Lock size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Privacy by Design (Section 43A IT Act & DPDP Compliance):</strong> This public endpoint returns strictly minimal verifiable confirmation of enrolment status. Private personal data (full name, raw date of birth, contact phone, and aadhaar mapping) is cryptographically shielded and never displayed.
        </div>
      </div>

      {/* Lookup Form */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Official Record Reference</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. TS-2025-MH-00100001"
              value={recordRef}
              onChange={e => setRecordRef(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Or 12-Digit APAAR / ABC ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 100000000001"
              maxLength={12}
              value={apaarId}
              onChange={e => setApaarId(e.target.value)}
            />
          </div>

          <button onClick={() => handleLookup()} className="btn btn-primary" disabled={loading} style={{ height: '36px' }}>
            <Search size={14} />
            <span>{loading ? 'Verifying...' : 'Verify Credential'}</span>
          </button>

        </div>
      </div>

      {error && (
        <div className="statutory-alert-box danger" style={{ marginBottom: '18px' }}>
          {error}
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={22} color="#15803d" />
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1b2a49' }}>
                  Official AICTE Enrolment Attestation
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Record Reference: <strong>{result.record_ref}</strong>
                </div>
              </div>
            </div>

            <StatusBadge label={result.enrolled_status} variant={result.is_valid ? 'green' : 'amber'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px', alignItems: 'center' }}>
            
            {/* Permitted Minimal Attributes */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CANDIDATE INITIALS</div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{result.student_initials}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MASKED APAAR ID</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.apaar_id_masked}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>INSTITUTION</div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{result.institution_name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{result.institution_state}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PROGRAMME & COURSE</div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{result.course_name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{result.programme_name}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ADMISSION YEAR</div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{result.year_of_admission}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>REGULATORY STATUS</div>
                  <div style={{ fontWeight: 600, color: '#15803d' }}>Council Approved Intake</div>
                </div>

              </div>

              {/* Cryptographic Signed Token */}
              <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '2px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                <div style={{ fontWeight: 600, color: '#475569' }}>DIGITAL VERIFICATION TOKEN:</div>
                <code style={{ color: '#0f4c81', wordBreak: 'break-all' }}>{result.signed_token}</code>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Timestamp: {new Date(result.verification_timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* QR Attestation Badge */}
            <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
              <div
                dangerouslySetInnerHTML={{ __html: decodeURIComponent(result.qr_data_uri.replace('data:image/svg+xml;utf8,', '')) }}
                style={{ display: 'inline-block', border: '1px solid #cbd5e1', padding: '4px', backgroundColor: '#ffffff' }}
              />
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                Tamper-evident verification hash
              </div>
            </div>

          </div>

          {/* Student-Facing Verifier Access Log */}
          {result.recent_verifications && result.recent_verifications.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                <Clock size={14} color="#0f4c81" />
                <span>Student Transparency Log (Recent Authorized Verifications):</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Under National Academic Credit regulations, the student is notified whenever this credential is queried:
              </div>
              <div style={{ marginTop: '6px', border: '1px solid #e2e8f0', borderRadius: '2px' }}>
                <table className="gov-table" style={{ fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Verifying Organization</th>
                      <th>Stated Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.recent_verifications.map((v: any, idx: number) => (
                      <tr key={idx}>
                        <td>{new Date(v.timestamp).toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>{v.verifier_organization}</td>
                        <td>{v.verification_purpose.replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
