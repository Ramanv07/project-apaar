import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const DiscrepancyQueue: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDiscrepancies();
  }, []);

  const fetchDiscrepancies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admissions/discrepancy-queue');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load discrepancy queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (approved: boolean) => {
    if (!selectedRecord) return;
    setResolving(true);
    try {
      await api.post('/admissions/resolve-mismatch', {
        admission_id: selectedRecord.id,
        approved,
        officer_notes: officerNotes || (approved ? "Verified candidate identity via Class 10 Certificate." : "Rejected due to material identity discrepancy.")
      });
      setSelectedRecord(null);
      setOfficerNotes('');
      fetchDiscrepancies();
    } catch (err: any) {
      alert("Resolution failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Discrepancy Resolution Queue</h1>
          <p className="page-subtitle">
            Manual Verification Workflow for Transliteration Variances, Registry Discrepancies & Flagged Records
          </p>
        </div>
      </div>

      <div className="statutory-alert-box warning">
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Statutory Identity Reconciliation:</strong> Records listed below exhibited phonetic or registry mismatches against the National Academic Bank of Credits citizen registry. The Institution Nodal Officer must physically examine Class 10/12 matriculation certificates before resolving.
        </div>
      </div>

      <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <h2 className="text-sm font-bold text-zinc-950 dark:text-white font-display">
            Pending Discrepancy Items ({items.length})
          </h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Action required by Institution Nodal Officer
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#166534', backgroundColor: '#f0fdf4', borderRadius: '4px', border: '1px solid #86efac' }}>
            <CheckCircle size={28} style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: '14px' }}>All Discrepancies Resolved</div>
            <p style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
              No pending identity or transliteration discrepancies require nodal action.
            </p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Record Ref</th>
                  <th>Submitted Name</th>
                  <th>APAAR ID</th>
                  <th>Flagged Rule & Finding</th>
                  <th>Severity</th>
                  <th>Nodal Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.record_ref}</td>
                    <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{r.apaar_id}</td>
                    <td>
                      {r.validation_findings?.map((f: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{f.rule_name}</span>: {f.reason}
                          <div style={{ fontSize: '11px', color: '#0f4c81', marginTop: '2px' }}>
                            Value: <code>{f.actual_value}</code>
                          </div>
                        </div>
                      ))}
                    </td>
                    <td>
                      <StatusBadge label={r.validation_status} code={r.validation_status} />
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedRecord(r); setOfficerNotes(''); }}
                        className="btn btn-primary btn-sm"
                      >
                        Inspect & Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Nodal Officer Discrepancy Adjudication"
      >
        {selectedRecord && (
          <div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '2px', marginBottom: '14px', fontSize: '12px' }}>
              <div><strong>Record Reference:</strong> {selectedRecord.record_ref}</div>
              <div style={{ marginTop: '4px' }}><strong>Submitted Name:</strong> {selectedRecord.student_name}</div>
              <div style={{ marginTop: '4px' }}><strong>APAAR ID:</strong> {selectedRecord.apaar_id}</div>
              <div style={{ marginTop: '4px' }}><strong>Course:</strong> {selectedRecord.course_name}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
                Algorithmic Validation Finding:
              </div>
              {selectedRecord.validation_findings?.map((f: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#fff5f5', borderLeft: '3px solid #dc2626', padding: '8px', fontSize: '12px', color: '#1e293b', marginBottom: '6px' }}>
                  <strong>{f.rule_name}:</strong> {f.reason}
                  <div style={{ fontSize: '11px', color: '#0f4c81', marginTop: '4px' }}>Suggested Fix: {f.suggested_fix}</div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">
                Nodal Verification Notes (Class 10/12 Certificate Evidence) *
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Verified candidate Class 10 Marks Number 401928; name spelling confirmed as authentic transliteration variance."
                value={officerNotes}
                onChange={e => setOfficerNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => handleResolve(false)}
                className="btn btn-danger"
                disabled={resolving}
              >
                <XCircle size={14} />
                <span>Reject & Flag Record</span>
              </button>
              <button
                onClick={() => handleResolve(true)}
                className="btn btn-primary"
                disabled={resolving}
                style={{ backgroundColor: '#15803d', borderColor: '#166534' }}
              >
                <CheckCircle size={14} />
                <span>Approve Identity Resolution</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
