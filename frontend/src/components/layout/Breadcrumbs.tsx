import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'Regulatory Dashboard',
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
    <nav className="flex items-center text-xs text-zinc-400 dark:text-zinc-500 py-1" aria-label="Breadcrumb">
      <Link to="/" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
        Home
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[value] || value;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
            {isLast ? (
              <span className="text-zinc-900 dark:text-zinc-200 font-medium truncate">
                {label}
              </span>
            ) : (
              <Link to={to} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors truncate">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
