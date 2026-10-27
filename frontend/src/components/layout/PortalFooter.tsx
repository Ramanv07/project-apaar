import React from 'react';

export const PortalFooter: React.FC = () => {
  return (
    <footer className="portal-footer" role="contentinfo">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ fontWeight: 600, color: '#e2e8f0' }}>
          TrustSeat — APAAR ID-Based Student Data Management and Verification Platform
        </p>
        <p style={{ color: '#94a3b8', fontSize: '11px' }}>
          All India Council for Technical Education (AICTE), Ministry of Education, Government of India.
        </p>
        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
          Synthetic data. Prototype built for Smart India Hackathon 2026 (Problem Statement 26263).
        </p>
        <p style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
          Compliant with Guidelines for Indian Government Websites (GIGW 3.0) and National Informatics Centre (NIC) Security Framework.
        </p>
      </div>
    </footer>
  );
};
