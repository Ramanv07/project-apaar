import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  indicatorColor?: string;
  trend?: string;
  isPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  indicatorColor,
  trend,
  isPositive
}) => {
  return (
    <div
      className="bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors relative overflow-hidden"
      style={indicatorColor ? { borderTop: `3px solid ${indicatorColor}` } : undefined}
    >
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 font-display">
        {title}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight tabular-nums font-mono">
          {value}
        </span>
      </div>
      {(trend || subtext) && (
        <div className="flex items-center gap-1.5 mt-2.5 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center font-semibold ${
                isPositive !== false
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive !== false ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend}
            </span>
          )}
          {subtext && <span className="text-zinc-400 dark:text-zinc-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
