import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  count
}) => {
  const norm = (severity || 'UNKNOWN').toUpperCase();

  const styles: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: {
      bg: 'bg-red-950/70',
      text: 'text-red-400',
      border: 'border-red-800/80',
    },
    HIGH: {
      bg: 'bg-orange-950/70',
      text: 'text-orange-400',
      border: 'border-orange-800/80',
    },
    MEDIUM: {
      bg: 'bg-yellow-950/70',
      text: 'text-yellow-400',
      border: 'border-yellow-800/80',
    },
    LOW: {
      bg: 'bg-emerald-950/70',
      text: 'text-emerald-400',
      border: 'border-emerald-800/80',
    },
    UNKNOWN: {
      bg: 'bg-slate-900',
      text: 'text-slate-400',
      border: 'border-slate-700',
    },
  };

  const current = styles[norm] || styles.UNKNOWN;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded border ${current.bg} ${current.text} ${current.border} ${sizeClasses} tracking-wide uppercase`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${norm === 'CRITICAL' ? 'bg-red-400 animate-pulse' : (norm === 'HIGH' ? 'bg-orange-400' : (norm === 'MEDIUM' ? 'bg-yellow-400' : 'bg-emerald-400'))}`} />
      <span>{norm}</span>
      {count !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 bg-black/40 rounded text-slate-200 text-xs font-mono">
          {count}
        </span>
      )}
    </span>
  );
};
