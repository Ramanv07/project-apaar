import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet, ArrowRight, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const UploadAdmission: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'csv' | 'single'>('csv');
  const [csvText, setCsvText] = useState<string>('');
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);

  // Single record state
  const [singleForm, setSingleForm] = useState({
    apaar_id: '556677889900',
    student_name: 'Ananya Deshmukh',
    dob: '2005-04-12',
    gender: 'Female',
    programme_name: 'Engineering & Technology',
    course_name: 'B.Tech Computer Science & Engineering',
    year_of_admission: 2025,
    admission_date: '2025-07-18',
    student_id_enrolment: 'ADM-2025-0912',
    mobile: '9820123456',
    email: 'ananya.deshmukh@gmail.com',
    category: 'GENERAL',
    quota_type: 'GENERAL',
    supernumerary_flag: false
  });

  const loadSampleBatch = () => {
    // 3 sample rows: 1 valid, 1 transliteration variance, 1 category/quota inconsistency
    const sample = `apaar_id,student_name,dob,gender,programme_name,course_name,year_of_admission,admission_date,student_id_enrolment,mobile,email,category,quota_type,supernumerary_flag
123456789012,Aarav Sharma,2005-04-12,Male,Engineering & Technology,B.Tech Computer Science & Engineering,2025,2025-07-15,ENR-2025-001,9812345678,aarav@gmail.com,GENERAL,GENERAL,false
445566778899,Mohammed Tariq Khan,2005-08-15,Male,Engineering & Technology,B.Tech Computer Science & Engineering,2025,2025-07-16,ENR-2025-002,9876543210,tariq@gmail.com,GENERAL,GENERAL,false
100000000055,Devendra Yadav,2004-11-20,Male,Engineering & Technology,B.Tech Computer Science & Engineering,2025,2025-07-17,ENR-2025-003,9823456789,dev@gmail.com,OBC_NCL,EWS,true`;
    setCsvText(sample);
    setDryRunResult(null);
    setSubmissionSuccess(null);
  };

  const parseCsvToRecords = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, idx) => {
        let val: any = values[idx];
        if (h === 'supernumerary_flag') val = val === 'true';
        if (h === 'year_of_admission') val = parseInt(val) || 2025;
        obj[h] = val;
      });
      records.push(obj);
    }
    return records;
  };

  const handleDryRun = async () => {
    let records = [];
    if (activeTab === 'csv') {
      records = parseCsvToRecords(csvText);
      if (records.length === 0) {
        alert("Please paste or load valid CSV rows first.");
        return;
      }
    } else {
      records = [singleForm];
    }

    setValidating(true);
    setSubmissionSuccess(null);
    try {
      const res = await api.post('/admissions/dry-run', {
        records,
        institution_id: user?.institution_id
      });
      setDryRunResult(res.data);
    } catch (err: any) {
      alert("Validation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setValidating(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!dryRunResult) return;
    let records = [];
    if (activeTab === 'csv') {
      records = parseCsvToRecords(csvText);
    } else {
      records = [singleForm];
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admissions/submit', {
        records,
        institution_id: user?.institution_id
      });
      setSubmissionSuccess(res.data);
      setDryRunResult(null);
    } catch (err: any) {
      alert("Submission error: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Institution Admission Upload & Dry-Run Verification</h1>
          <p className="page-subtitle">
            Upload Enrolment Data, Execute Regulatory Rule Checks with Suggested Fixes, and Finalize Submissions
          </p>
        </div>
      </div>

      {submissionSuccess && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '16px', borderRadius: '4px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700 }}>
            <CheckCircle size={18} />
            <span>Admission Batch Committed Successfully to National Ledger!</span>
          </div>
          <p style={{ fontSize: '12px', color: '#14532d', marginTop: '6px' }}>
            {submissionSuccess.message}
          </p>
          <div style={{ marginTop: '10px' }}>
            <button onClick={() => navigate('/students')} className="btn btn-primary btn-sm">
              <span>View Enrolment Records</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 mb-5">
        <button
          onClick={() => { setActiveTab('csv'); setDryRunResult(null); }}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'csv'
              ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          Spreadsheet / CSV Batch Upload
        </button>
        <button
          onClick={() => { setActiveTab('single'); setDryRunResult(null); }}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'single'
              ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          Single Record Form
        </button>
      </div>

      {/* CSV Batch Upload View */}
      {activeTab === 'csv' && (
        <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors mb-5">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-display">
              Paste CSV Content or Load Evaluator Demonstration Template:
            </label>
            <button onClick={loadSampleBatch} className="btn btn-secondary btn-sm">
              <FileSpreadsheet size={13} />
              <span>Load 3-Row Sample Batch</span>
            </button>
          </div>

          <textarea
            className="form-textarea"
            rows={7}
            style={{ fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre' }}
            placeholder="apaar_id,student_name,dob,gender,programme_name,course_name,year_of_admission,admission_date,student_id_enrolment,mobile,email,category,quota_type,supernumerary_flag..."
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Standard CSV fields: <code>apaar_id, student_name, dob, gender, programme_name, course_name, year_of_admission, admission_date, student_id_enrolment, mobile, email, category, quota_type, supernumerary_flag</code>
            </div>
            <button onClick={handleDryRun} className="btn btn-primary" disabled={validating || !csvText.trim()}>
              <RefreshCw size={14} className={validating ? 'spin' : ''} />
              <span>{validating ? 'Validating Batch...' : 'Check Before Submitting (Dry-Run)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Single Record Form View */}
      {activeTab === 'single' && (
        <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors mb-5">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            
            <div className="form-group">
              <label className="form-label">APAAR ID (12 Digits) *</label>
              <input
                type="text"
                className="form-input"
                maxLength={12}
                value={singleForm.apaar_id}
                onChange={e => setSingleForm({ ...singleForm, apaar_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={singleForm.student_name}
                onChange={e => setSingleForm({ ...singleForm, student_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth (YYYY-MM-DD) *</label>
              <input
                type="date"
                className="form-input"
                value={singleForm.dob}
                onChange={e => setSingleForm({ ...singleForm, dob: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={singleForm.gender}
                onChange={e => setSingleForm({ ...singleForm, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Course Name *</label>
              <input
                type="text"
                className="form-input"
                value={singleForm.course_name}
                onChange={e => setSingleForm({ ...singleForm, course_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Enrolment / Roll Number *</label>
              <input
                type="text"
                className="form-input"
                value={singleForm.student_id_enrolment}
                onChange={e => setSingleForm({ ...singleForm, student_id_enrolment: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student Mobile (10 Digits) *</label>
              <input
                type="text"
                className="form-input"
                maxLength={10}
                value={singleForm.mobile}
                onChange={e => setSingleForm({ ...singleForm, mobile: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student Email *</label>
              <input
                type="email"
                className="form-input"
                value={singleForm.email}
                onChange={e => setSingleForm({ ...singleForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admission Date *</label>
              <input
                type="date"
                className="form-input"
                value={singleForm.admission_date}
                onChange={e => setSingleForm({ ...singleForm, admission_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={singleForm.category}
                onChange={e => setSingleForm({ ...singleForm, category: e.target.value })}
              >
                <option value="GENERAL">General</option>
                <option value="OBC_NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quota Type</label>
              <select
                className="form-select"
                value={singleForm.quota_type}
                onChange={e => setSingleForm({ ...singleForm, quota_type: e.target.value })}
              >
                <option value="GENERAL">General</option>
                <option value="EWS">EWS Supernumerary</option>
                <option value="TFW">Tuition Fee Waiver (TFW)</option>
                <option value="STATE_ALLOTMENT">State Govt Allotment</option>
                <option value="MANAGEMENT">Management</option>
                <option value="NRI">NRI Quota</option>
                <option value="FN">Foreign National (FN)</option>
                <option value="OCI">Overseas Citizen of India (OCI)</option>
                <option value="CIWGC">CIWGC</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={singleForm.supernumerary_flag}
                  onChange={e => setSingleForm({ ...singleForm, supernumerary_flag: e.target.checked })}
                />
                <span>Supernumerary Seat Allocation</span>
              </label>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button onClick={handleDryRun} className="btn btn-primary" disabled={validating}>
              <span>Check Before Submitting (Dry-Run)</span>
            </button>
          </div>
        </div>
      )}

      {/* Dry-Run Validation Findings Drawer */}
      {dryRunResult && (
        <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors mb-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white font-display">
                Dry-Run Validation Report
              </h2>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Total Processed: <span className="font-mono">{dryRunResult.total_rows}</span> • Valid: <span className="font-mono">{dryRunResult.valid_rows}</span> • Warnings: <span className="font-mono">{dryRunResult.warning_rows}</span> • Blocking Errors: <span className="font-mono">{dryRunResult.invalid_rows}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleFinalSubmit}
                className="btn btn-primary"
                disabled={submitting || dryRunResult.has_blocking_errors}
                style={{
                  backgroundColor: dryRunResult.has_blocking_errors ? '#94a3b8' : '#15803d',
                  borderColor: dryRunResult.has_blocking_errors ? '#cbd5e1' : '#166534',
                  cursor: dryRunResult.has_blocking_errors ? 'not-allowed' : 'pointer'
                }}
              >
                <span>{submitting ? 'Submitting...' : 'Commit & Finalise Submission'}</span>
              </button>
            </div>
          </div>

          {dryRunResult.has_blocking_errors && (
            <div className="statutory-alert-box danger" style={{ marginBottom: '14px' }}>
              <XCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Blocking Errors Found:</strong> You must correct the flagged errors below before the AICTE admission ledger can commit these records.
              </div>
            </div>
          )}

          {/* Row-by-Row Findings Table */}
          <div className="data-table-container">
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Row</th>
                  <th>Student & APAAR</th>
                  <th>Validation Finding</th>
                  <th>Severity</th>
                  <th>Why It Failed</th>
                  <th>Suggested Regulatory Fix</th>
                </tr>
              </thead>
              <tbody>
                {dryRunResult.results.map((row: any) => {
                  const hasErrors = row.findings.some((f: any) => f.severity === 'ERROR');
                  const hasWarnings = row.findings.some((f: any) => f.severity === 'WARNING');
                  const rowBg = hasErrors ? '#fef2f2' : hasWarnings ? '#fffbeb' : '#f0fdf4';

                  return (
                    <tr key={row.row_index} style={{ backgroundColor: rowBg }}>
                      <td style={{ fontWeight: 700, textAlign: 'center' }}>{row.row_index}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.data.student_name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                          APAAR: {row.data.apaar_id}
                        </div>
                      </td>
                      <td>
                        {row.findings.length === 0 ? (
                          <span style={{ color: '#166534', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={13} /> Passed All Regulatory Checks
                          </span>
                        ) : (
                          row.findings.map((f: any, idx: number) => (
                            <div key={idx} style={{ marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{f.rule_name}</span>: {f.field} = {f.actual_value}
                            </div>
                          ))
                        )}
                      </td>
                      <td>
                        {row.findings.length === 0 ? (
                          <StatusBadge label="PASS" variant="green" />
                        ) : (
                          row.findings.map((f: any, idx: number) => (
                            <div key={idx} style={{ marginBottom: '2px' }}>
                              <StatusBadge label={f.severity} variant={f.severity === 'ERROR' ? 'red' : 'amber'} />
                            </div>
                          ))
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#334155' }}>
                        {row.findings.map((f: any, idx: number) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>{f.reason}</div>
                        ))}
                      </td>
                      <td style={{ fontSize: '12px', color: '#0f4c81', fontWeight: 500 }}>
                        {row.findings.map((f: any, idx: number) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>💡 {f.suggested_fix}</div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
