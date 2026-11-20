import React from 'react';
import { ShieldCheck, Plus, RefreshCw, UserCheck } from 'lucide-react';
import { HealthStatus, NavPage } from '../../types';

interface HeaderProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  onNavigate: (page: NavPage) => void;
  isHealthChecking?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onRefreshHealth,
  onNavigate,
  isHealthChecking = false,
}) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="h-16 px-8 border-b border-navy-700/80 bg-navy-950/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>Security Inspector</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-950/80 text-blue-400 border border-blue-800/60">
            Audit Workspace
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* System Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 border border-navy-700/80 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
            }`}
          />
          <span className="text-slate-300 font-medium">
            System: {isHealthy ? 'Online' : 'Attention Required'}
          </span>
          <button
            onClick={onRefreshHealth}
            title="Refresh System Status"
            className="text-slate-400 hover:text-slate-200 transition ml-1"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isHealthChecking ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Start Scan Button */}
        <button
          onClick={() => onNavigate('scan')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Scan</span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-navy-700/80">
          <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center text-slate-300">
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-200 leading-tight">
              DevSecOps Admin
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Security Analyst
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
