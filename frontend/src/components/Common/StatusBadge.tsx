import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: 'COMPLETED' | 'FAILED' | 'RUNNING' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Completed
      </span>
    );
  }

  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/60 text-red-400 border border-red-800/60">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950/60 text-blue-400 border border-blue-800/60">
      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
      Running
    </span>
  );
};
