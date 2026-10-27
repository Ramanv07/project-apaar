import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  indicatorColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, indicatorColor }) => {
  return (
    <div className="stat-card" style={indicatorColor ? { borderTop: `3px solid ${indicatorColor}` } : {}}>
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">{value}</div>
      {subtext && <div className="stat-card-subtext">{subtext}</div>}
    </div>
  );
};
