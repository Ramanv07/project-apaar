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
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px', marginBottom: '18px' }}>
      {title && (
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          {title}
        </div>
      )}
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '12px', borderRadius: '2px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="approvedIntake" name="Approved Regular Intake" fill="#0f4c81" radius={[2, 2, 0, 0]} />
            <Bar dataKey="actualEnrolment" name="Actual Total Admissions" fill="#e65100" radius={[2, 2, 0, 0]} />
            <Bar dataKey="supernumerary" name="Supernumerary Enrolments" fill="#1b5e20" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
