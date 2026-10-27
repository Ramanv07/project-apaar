import React from 'react';
import { LucideIcon } from 'lucide-react';

// 5.3 Enterprise Card
export function EnterpriseCard({
  title,
  subtitle,
  action,
  children,
  className = ''
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-[#16181d] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white font-display tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// 5.3 Inner Sub-Well
export function InnerWell({
  title,
  value,
  caption,
  icon: Icon
}: {
  title: string;
  value: React.ReactNode;
  caption?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="bg-zinc-50/80 dark:bg-[#111215] p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-display">
          {title}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400" />}
      </div>
      <div className="text-lg font-bold text-zinc-950 dark:text-white tabular-nums tracking-tight font-mono">
        {value}
      </div>
      {caption && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
          {caption}
        </p>
      )}
    </div>
  );
}

// 5.6 Input Control
export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  error,
  className = ''
}: {
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-xl border px-3.5 py-2 text-sm transition-colors
        bg-white dark:bg-[#111215]
        text-zinc-900 dark:text-zinc-100
        placeholder-zinc-400 dark:placeholder-zinc-600
        ${error
          ? 'border-rose-500 focus:outline-rose-500'
          : 'border-zinc-300 dark:border-zinc-800 focus:border-blue-600 dark:focus:border-sky-500 focus:outline-2 focus:outline-sky-500/20'
        }
        ${disabled ? 'bg-zinc-100 dark:bg-zinc-900 cursor-not-allowed opacity-60' : ''}
        ${className}
      `}
    />
  );
}

// 5.7 Button System
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: {
  variant?: 'primary' | 'secondary' | 'emerald' | 'ghost';
  size?: 'sm' | 'md' | 'pill';
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center font-semibold transition-all select-none disabled:opacity-50 disabled:pointer-events-none";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2.5 text-sm rounded-xl gap-2",
    pill: "px-4 py-2 text-xs rounded-full gap-2",
  };

  const variants = {
    primary: "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-95 shadow-xs",
    secondary: "bg-white dark:bg-[#1a1d23] text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-[#24272f]",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs",
    ghost: "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f2128]",
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// 5.9 Tabbed Switchers
export function Tabs({
  tabs,
  activeKey,
  onChange
}: {
  tabs: { key: string; label: string; count?: number }[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800/80 flex gap-6 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap ${
              isActive
                ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-md font-mono bg-zinc-100 dark:bg-[#1a1d23] text-zinc-600 dark:text-zinc-400">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 5.10 SVG Circular Metric & Progress Gauges
export function CircularGauge({
  percentage,
  size = 120,
  strokeWidth = 10,
  label = "Quota"
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-200 dark:text-[#27272a]"
          fill="transparent"
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-emerald-500 transition-all duration-700 ease-out"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-zinc-950 dark:text-white font-mono tabular-nums">
          {percentage}%
        </span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold font-display">
          {label}
        </span>
      </div>
    </div>
  );
}
