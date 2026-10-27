import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { Printer, ShieldCheck, CheckCircle } from 'lucide-react';

export const CertificateView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ref = searchParams.get('ref') || 'TS-2025-MH-00100001';

  useEffect(() => {
    fetchCertificate();
  }, [ref]);

  const fetchCertificate = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/verify/certificate/${ref}`);
      setCert(res.data);
    } catch (err) {
      console.error('Failed to load certificate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="main-content-wrapper">
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading official certificate template...
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="main-content-wrapper">
        <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
          Certificate record not found for reference "{ref}".
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '840px' }}>
      
      {/* Print Control Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="no-print">
        <span style={{ fontSize: '13px', color: '#475569' }}>
          Official Academic Enrolment Credential Attestation
        </span>
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={14} />
          <span>Print Official Certificate</span>
        </button>
      </div>

      {/* Printable Certificate Frame */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '8px double #1b2a49',
          padding: '36px',
          borderRadius: '4px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        {/* Certificate Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f4c81', paddingBottom: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'inline-block', border: '2px solid #FF9933', borderRadius: '50%', padding: '6px', width: '56px', height: '56px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#1b2a49' }}>AICTE<br />INDIA</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1b2a49', letterSpacing: '0.5px' }}>
            ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
          </h1>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
            National Academic Bank of Credits • Enrolment Attestation
          </h2>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Statutory Certificate Generated under Problem Statement 26263 (SIH 2026)
          </div>
        </div>

        {/* Certificate Body Text */}
        <div style={{ lineHeight: '1.8', fontSize: '14px', color: '#1e293b', marginBottom: '28px' }}>
          <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#475569', marginBottom: '16px' }}>
            This is to officially attest that the student identified below has been duly enrolled into an AICTE-approved technical programme:
          </p>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f4c81', textDecoration: 'underline' }}>
              {cert.student_name}
            </div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
              Date of Birth: <strong>{cert.dob}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '2px', margin: '16px 0' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ONE NATION, ONE STUDENT ID (APAAR):</div>
              <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#1b2a49' }}>
                {cert.apaar_id}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>INSTITUTIONAL ENROLMENT / ROLL NO:</div>
              <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: '#0f4c81' }}>
                {cert.student_id_enrolment}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ENROLLED INSTITUTION:</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                {cert.institution_name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>AICTE ID: {cert.aicte_id}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>APPROVED COURSE & YEAR:</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                {cert.course_name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Admitted: {cert.admission_date} ({cert.year_of_admission})</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontSize: '13px', fontWeight: 600, marginTop: '12px' }}>
            <CheckCircle size={16} />
            <span>Two-Key Authentication State: {cert.two_key_status.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Signatures & QR Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #cbd5e1', paddingTop: '18px' }}>
          
          <div>
            <div style={{ width: '90px', height: '90px', border: '1px solid #cbd5e1', padding: '3px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', fontSize: '9px', color: '#64748b' }}>
                <div style={{ fontWeight: 800, color: '#1b2a49', fontSize: '11px' }}>QR VERIFY</div>
                <span>Scan for Live Verification</span>
              </div>
            </div>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748b', marginTop: '4px' }}>
              Ref: {cert.record_ref}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Digitally Signed by Authority:</div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#0f4c81', marginTop: '2px' }}>
              {cert.signed_token}
            </div>
            <div style={{ borderTop: '1px dashed #475569', marginTop: '16px', paddingTop: '4px', fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>
              Member Secretary / Authorized Nodal Signatory
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
