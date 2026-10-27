import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { usePortalSettings } from '../../context/PortalSettingsContext';

interface IntakeChartData {
  name: string;
  approvedIntake: number;
  actualEnrolment: number;
  supernumerary: number;
}

interface IntakeBarChartProps {
  data: IntakeChartData[];
  title?: string;
}

export const IntakeBarChart: React.FC<IntakeBarChartProps> = ({ data, title }) => {
  const { isDark } = usePortalSettings();

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9';
  const textColor = isDark ? '#a1a1aa' : '#64748b';
  const tooltipBg = isDark ? '#16181d' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

  const barIntake = isDark ? '#3888eb' : '#2563eb';
  const barActual = isDark ? '#c7a464' : '#d97706';
  const barSuper = isDark ? '#62b082' : '#059669';

  return (
    <div className="w-full">
      {title && (
        <div className="text-sm font-bold text-zinc-950 dark:text-white font-display mb-4">
          {title}
        </div>
      )}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: textColor, fontFamily: 'Jost, sans-serif' }}
              interval={0}
              angle={-12}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontSize: 11, fill: textColor, fontFamily: 'JetBrains Mono, monospace' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                color: isDark ? '#ffffff' : '#0f172a'
              }}
              itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontFamily: 'Jost, sans-serif' }}
            />
            <Bar dataKey="approvedIntake" name="Approved Regular Intake" fill={barIntake} radius={[4, 4, 0, 0]} />
            <Bar dataKey="actualEnrolment" name="Actual Total Admissions" fill={barActual} radius={[4, 4, 0, 0]} />
            <Bar dataKey="supernumerary" name="Supernumerary Enrolments" fill={barSuper} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
