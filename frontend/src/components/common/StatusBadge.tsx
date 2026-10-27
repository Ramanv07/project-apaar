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
    if (c === 'VALID' || c === 'COMPLIANT' || c === 'STUDENT_CONFIRMED' || c === 'ACTIVE' || c === 'CONFIRMED' || c === 'SUCCESS') {
      effectiveVariant = 'green';
    } else if (c === 'WARNING' || c === 'UNDER_REVIEW' || c === 'SUBMITTED' || c === 'UNCONFIRMED_GRACE_PERIOD' || c === 'PENDING') {
      effectiveVariant = 'amber';
    } else if (c === 'INVALID' || c === 'FLAGGED' || c === 'DISPUTED' || c === 'REVOKED' || c === 'BREACH' || c === 'ERROR') {
      effectiveVariant = 'red';
    } else if (c === 'INFO' || c === 'PROCESSING' || c === 'AUDITED') {
      effectiveVariant = 'blue';
    } else {
      effectiveVariant = 'slate';
    }
  }

  const v = effectiveVariant || 'slate';

  const variantStyles: Record<BadgeVariant, { pill: string; dot: string }> = {
    green: {
      pill: 'text-emerald-700 dark:text-[#62b082] bg-emerald-500/10 border-emerald-500/25',
      dot: 'bg-emerald-500'
    },
    amber: {
      pill: 'text-amber-700 dark:text-[#c7a464] bg-amber-500/10 border-amber-500/25',
      dot: 'bg-amber-500'
    },
    red: {
      pill: 'text-rose-700 dark:text-[#c77884] bg-rose-500/10 border-rose-500/25',
      dot: 'bg-rose-500'
    },
    blue: {
      pill: 'text-sky-700 dark:text-[#3888eb] bg-sky-500/10 border-sky-500/25',
      dot: 'bg-sky-500'
    },
    slate: {
      pill: 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      dot: 'bg-zinc-400 dark:bg-zinc-500'
    }
  };

  const style = variantStyles[v] || variantStyles.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border font-mono tracking-tight select-none ${style.pill}`}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{label}</span>
    </span>
  );
};
