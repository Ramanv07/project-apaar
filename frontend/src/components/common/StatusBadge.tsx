import React from 'react';

export type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'slate';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  code?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant, code }) => {
  let effectiveVariant = variant;
  
  if (!effectiveVariant && code) {
    const c = code.toUpperCase();
    if (c === 'VALID' || c === 'COMPLIANT' || c === 'STUDENT_CONFIRMED' || c === 'ACTIVE') {
      effectiveVariant = 'green';
    } else if (c === 'WARNING' || c === 'UNDER_REVIEW' || c === 'SUBMITTED' || c === 'UNCONFIRMED_GRACE_PERIOD') {
      effectiveVariant = 'amber';
    } else if (c === 'INVALID' || c === 'FLAGGED' || c === 'DISPUTED' || c === 'REVOKED') {
      effectiveVariant = 'red';
    } else {
      effectiveVariant = 'slate';
    }
  }

  return (
    <span className={`status-badge ${effectiveVariant || 'slate'}`} role="status">
      <span style={{ fontSize: '8px' }}>●</span>
      <span>{label}</span>
    </span>
  );
};
