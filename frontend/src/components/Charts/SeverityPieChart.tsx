import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface SeverityPieChartProps {
  distribution: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    UNKNOWN: number;
  };
}

const COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  UNKNOWN: '#94a3b8',
};

export const SeverityPieChart: React.FC<SeverityPieChartProps> = ({ distribution }) => {
  const data = [
    { name: 'Critical', key: 'CRITICAL', value: distribution.CRITICAL || 0 },
    { name: 'High', key: 'HIGH', value: distribution.HIGH || 0 },
    { name: 'Medium', key: 'MEDIUM', value: distribution.MEDIUM || 0 },
    { name: 'Low', key: 'LOW', value: distribution.LOW || 0 },
    { name: 'Unknown', key: 'UNKNOWN', value: distribution.UNKNOWN || 0 },
  ].filter((item) => item.value > 0);

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm">
        <div className="w-10 h-10 mb-2 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-400">
          0
        </div>
        No vulnerabilities recorded
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.key}`}
                fill={COLORS[entry.key]}
                stroke="#0f172a"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#1f2937',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-300 font-medium ml-1">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
