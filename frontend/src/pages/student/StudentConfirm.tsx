import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { ShieldCheck, CheckCircle, AlertTriangle, Building, BookOpen, User, Calendar, FileText } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StudentConfirm: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [admission, setAdmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disputeMode, setDisputeMode] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionDone, setActionDone] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAdmissionDetails();
    }
  }, [token]);

  const fetchAdmissionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/two-key/token/${token}`);
      setAdmission(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'This confirmation link is invalid, expired, or has already been completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (confirm: boolean) => {
    if (!confirm && !disputeReason) {
      alert("Please select or specify the reason for reporting this admission as incorrect.");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/two-key/confirm', {
        token,
        confirm,
        dispute_reason: confirm ? null : disputeReason,
        student_remarks: remarks || (confirm ? "Confirmed by student via TrustSeat Two-Key verification." : "Disputed by student.")
      });
      setActionDone(res.data);
      fetchAdmissionDetails();
    } catch (err: any) {
      alert("Action failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px 10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* Mobile-Width Simulator Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* Mobile Header */}
        <div style={{ backgroundColor: '#1b2a49', color: '#ffffff', padding: '16px', borderBottom: '3px solid #FF9933' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="#FF9933" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>TrustSeat — Key 2 Verification</div>
              <div style={{ fontSize: '10px', color: '#cbd5e1' }}>National Student Two-Key Enrolment Authentication</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Retrieving official admission record from central registry...
          </div>
        ) : error ? (
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <AlertTriangle size={32} color="#dc2626" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <h2 style={{ fontSize: '15px', color: '#991b1b', fontWeight: 700 }}>Security Token Notice</h2>
            <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>{error}</p>
          </div>
        ) : admission ? (
          <div style={{ padding: '18px' }}>
            
            {/* Status Callout */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Enrolment State</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Ref: {admission.record_ref}</div>
              </div>
              <StatusBadge label={admission.two_key_status.replace(/_/g, ' ')} code={admission.two_key_status} />
            </div>

            {actionDone && (
              <div style={{ backgroundColor: actionDone.action === 'CONFIRMED' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${actionDone.action === 'CONFIRMED' ? '#86efac' : '#fca5a5'}`, padding: '12px', borderRadius: '4px', marginBottom: '14px', fontSize: '12px' }}>
                <strong style={{ color: actionDone.action === 'CONFIRMED' ? '#166534' : '#991b1b' }}>
                  {actionDone.action === 'CONFIRMED' ? 'Enrolment Successfully Confirmed!' : 'Dispute Recorded in Ledger'}
                </strong>
                <p style={{ color: '#334155', marginTop: '4px' }}>{actionDone.message}</p>
              </div>
            )}

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
              The following institution has submitted your admission under your 12-digit APAAR ID. Please review the details carefully:
            </div>

            {/* Admission Details Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px', marginBottom: '16px' }}>
              
              <div style={{ marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  <User size={13} color="#0f4c81" />
                  <span>CANDIDATE IDENTITY</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                  {admission.student_name}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  APAAR ID: <strong>{admission.apaar_id_masked}</strong> | DOB: {admission.dob}
                </div>
              </div>

              <div style={{ marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  <Building size={13} color="#0f4c81" />
                  <span>INSTITUTION</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                  {admission.institution_name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{admission.institution_state}</div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  <BookOpen size={13} color="#0f4c81" />
                  <span>PROGRAMME & ALLOCATION</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                  {admission.course_name}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px' }}>
                  <span className="status-badge slate">{admission.category}</span>
                  <span className="status-badge blue">{admission.quota_type} Quota</span>
                  <span style={{ color: '#64748b' }}>Year: {admission.year_of_admission}</span>
                </div>
              </div>

            </div>

            {/* Action Buttons if not yet confirmed */}
            {admission.two_key_status === 'STUDENT_CONFIRMED' ? (
              <div style={{ textAlign: 'center', padding: '14px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', fontSize: '12px', color: '#166534' }}>
                <CheckCircle size={20} style={{ margin: '0 auto 6px auto', display: 'block' }} />
                <strong>You have verified and confirmed this admission.</strong>
                <div style={{ fontSize: '11px', color: '#14532d', marginTop: '4px' }}>
                  Timestamp: {new Date(admission.confirmation_timestamp).toLocaleString()}
                </div>
              </div>
            ) : admission.two_key_status === 'DISPUTED' ? (
              <div style={{ textAlign: 'center', padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', fontSize: '12px', color: '#991b1b' }}>
                <AlertTriangle size={20} style={{ margin: '0 auto 6px auto', display: 'block' }} />
                <strong>Dispute is Active</strong>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  Reason: {admission.dispute_reason}
                </div>
              </div>
            ) : !disputeMode ? (
              <div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Optional Remarks:</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    placeholder="e.g. Verified and approved my seat allotment."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleAction(true)}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#15803d', borderColor: '#166534', padding: '10px' }}
                    disabled={processing}
                  >
                    <CheckCircle size={16} />
                    <span>Confirm My Enrolment (Key 2)</span>
                  </button>

                  <button
                    onClick={() => setDisputeMode(true)}
                    className="btn btn-secondary"
                    style={{ color: '#dc2626', borderColor: '#cbd5e1', padding: '8px' }}
                    disabled={processing}
                  >
                    <span>Report Incorrect / I Did Not Enrol</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Dispute Mode Form */
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
                  Dispute Admission Record
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Reason for Dispute *</label>
                  <select
                    className="form-select"
                    style={{ fontSize: '11px' }}
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="I never applied or took admission to this institution">I never applied or took admission to this institution</option>
                    <option value="Allocated course/branch does not match my admission letter">Allocated course/branch does not match my admission letter</option>
                    <option value="Incorrect category or quota recorded by institution">Incorrect category or quota recorded by institution</option>
                    <option value="Already enrolled in another institution with valid admission">Already enrolled in another institution with valid admission</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button onClick={() => setDisputeMode(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(false)}
                    className="btn btn-danger btn-sm"
                    style={{ flex: 2 }}
                    disabled={processing || !disputeReason}
                  >
                    Submit Dispute
                  </button>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px', color: '#64748b' }}>
              National Academic Bank of Credits • Two-Key Security Framework
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
