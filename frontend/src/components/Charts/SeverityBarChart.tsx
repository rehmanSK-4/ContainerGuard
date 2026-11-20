import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface SeverityBarChartProps {
  distribution: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    UNKNOWN: number;
  };
}

const COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
  Unknown: '#94a3b8',
};

export const SeverityBarChart: React.FC<SeverityBarChartProps> = ({ distribution }) => {
  const data = [
    { name: 'Critical', count: distribution.CRITICAL || 0 },
    { name: 'High', count: distribution.HIGH || 0 },
    { name: 'Medium', count: distribution.MEDIUM || 0 },
    { name: 'Low', count: distribution.LOW || 0 },
    { name: 'Unknown', count: distribution.UNKNOWN || 0 },
  ];

  const maxVal = Math.max(...data.map((d) => d.count), 5);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            domain={[0, maxVal]}
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#1f2937',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(val: number) => [`${val} CVEs`, 'Count']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={`bar-${entry.name}`} fill={COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
