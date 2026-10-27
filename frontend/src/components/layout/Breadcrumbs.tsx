import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'National Dashboard',
  'institution-dashboard': 'Institution Overview',
  'upload-admissions': 'Upload Admissions',
  'students': 'Admission Records',
  'discrepancies': 'Discrepancy Resolution Queue',
  'quota-waterfall': 'Quota Waterfall & Policy Engine',
  'review-flags': 'Review Flags & Anomaly Graph',
  'verify': 'Public Credential Verification',
  'certificate': 'Official Credential Certificate',
  'audit-ledger': 'Statutory Audit & Consent Ledger',
  'login': 'Official Portal Authentication'
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length === 0) return null;

  return (
    <div className="breadcrumb-container" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[value] || value;

        return (
          <span key={to}>
            <span style={{ margin: '0 6px', color: '#94a3b8' }}>/</span>
            {isLast ? (
              <span style={{ color: '#1e293b', fontWeight: 600 }}>{label}</span>
            ) : (
              <Link to={to}>{label}</Link>
            )}
          </span>
        );
      })}
    </div>
  );
};
