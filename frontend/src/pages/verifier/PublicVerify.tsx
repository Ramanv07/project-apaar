import React, { useState } from 'react';
import api from '../../utils/api';
import { Search, ShieldCheck, Lock, CheckCircle, Clock, QrCode } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

interface VerificationResult {
  is_valid: boolean;
  enrolled_status: string;
  apaar_id_masked: string;
  student_name_masked: string;
  institution_name: string;
  programme_name: string;
  course_name: string;
  academic_year: string;
  admission_date: string;
  signed_token: string;
  verification_timestamp: string;
  qr_data_uri: string;
  record_ref: string;
  recent_verifications?: Array<{
    timestamp: string;
    verifier_organization: string;
    verification_purpose: string;
  }>;
}

export const PublicVerify: React.FC = () => {
  const [recordRef, setRecordRef] = useState('TS-2025-MH-00100001');
  const [apaarId, setApaarId] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (paramRef?: string) => {
    const qRef = paramRef || recordRef;
    if (!qRef && !apaarId) {
      setError('Please provide a valid Record Reference or 12-Digit APAAR ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params: Record<string, string> = {};
      if (qRef) params.record_ref = qRef;
      if (apaarId) params.apaar_id = apaarId;

      const res = await api.get('/verify/lookup', { params });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No verified record found matching the submitted reference.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight font-display">
          Public Admission Credential Verification
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Zero-Knowledge AICTE Attestation & Real-Time Student Enrolment Proof
        </p>
      </div>

      {/* DPDP Statutory Shield Notice */}
      <div className="statutory-alert-box">
        <Lock className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-semibold text-zinc-950 dark:text-white">Privacy by Design (Section 43A IT Act & DPDP Compliance):</strong> This public endpoint returns strictly minimal verifiable confirmation of enrolment status. Private personal data (full name, raw date of birth, contact phone, and aadhaar mapping) is cryptographically shielded and never displayed.
        </div>
      </div>

      {/* Lookup Form */}
      <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-display">
              Official Record Reference
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 px-3.5 py-2 text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors font-mono"
              placeholder="e.g. TS-2025-MH-00100001"
              value={recordRef}
              onChange={e => setRecordRef(e.target.value)}
            />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-display">
              Or 12-Digit APAAR ID
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 px-3.5 py-2 text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors font-mono"
              placeholder="e.g. 100000000001"
              maxLength={12}
              value={apaarId}
              onChange={e => setApaarId(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <button
              onClick={() => handleLookup()}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm transition-all bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 shadow-xs disabled:opacity-50 h-[38px]"
              disabled={loading}
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify Credential'}</span>
            </button>
          </div>

        </div>
      </div>

      {error && (
        <div className="statutory-alert-box danger text-xs">
          {error}
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs transition-colors space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-950 dark:text-white font-display">
                  Official AICTE Enrolment Attestation
                </h2>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Record Reference: <strong className="font-mono text-zinc-900 dark:text-zinc-200">{result.record_ref}</strong>
                </div>
              </div>
            </div>

            <StatusBadge label={result.enrolled_status} variant={result.is_valid ? 'green' : 'amber'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Permitted Minimal Attributes */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-[#111215]">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold font-display">Institution:</span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{result.institution_name}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-[#111215]">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold font-display">Programme / Course:</span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{result.programme_name} — {result.course_name}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-[#111215]">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold font-display">Academic Session:</span>
                  <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{result.academic_year}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-[#111215]">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold font-display">Admission Date:</span>
                  <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{result.admission_date}</p>
                </div>
              </div>

              {/* Cryptographic Signed Token */}
              <div className="bg-zinc-50 dark:bg-[#111215] p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1">
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-display">
                  DIGITAL VERIFICATION TOKEN:
                </div>
                <code className="text-sky-600 dark:text-sky-400 font-mono text-[11px] break-all block">
                  {result.signed_token}
                </code>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                  Timestamp: {new Date(result.verification_timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* QR Attestation Badge */}
            <div className="lg:col-span-4 text-center lg:border-l lg:border-zinc-100 lg:dark:border-zinc-800/60 lg:pl-6">
              <div
                dangerouslySetInnerHTML={{ __html: decodeURIComponent(result.qr_data_uri.replace('data:image/svg+xml;utf8,', '')) }}
                className="inline-block p-2 rounded-xl bg-white border border-zinc-200 shadow-xs"
              />
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 font-mono">
                Tamper-evident verification hash
              </div>
            </div>

          </div>

          {/* Student-Facing Verifier Access Log */}
          {result.recent_verifications && result.recent_verifications.length > 0 && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white font-display">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>Student Transparency Log (Recent Authorized Verifications):</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#121316] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Verifying Organization</th>
                      <th className="px-4 py-2.5">Stated Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200 font-mono">
                    {result.recent_verifications.map((v: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#1f2128]">
                        <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{new Date(v.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100 font-sans">{v.verifier_organization}</td>
                        <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300 font-sans">{v.verification_purpose.replace(/_/g, ' ')}</td>
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
