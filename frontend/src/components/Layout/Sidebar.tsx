import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  History,
  AlertOctagon,
  FileText,
  Settings,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { NavPage, HealthStatus } from '../../types';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  health: HealthStatus | null;
  activeScanId: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  health,
  activeScanId,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavPage,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'scan' as NavPage,
      label: 'Scan Image',
      icon: ShieldCheck,
    },
    {
      id: 'history' as NavPage,
      label: 'Scan History',
      icon: History,
    },
    {
      id: 'results' as NavPage,
      label: 'Vulnerabilities',
      icon: AlertOctagon,
      badge: activeScanId ? `#${activeScanId}` : undefined,
    },
    {
      id: 'reports' as NavPage,
      label: 'Reports',
      icon: FileText,
    },
    {
      id: 'settings' as NavPage,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-navy-950 border-r border-navy-700/80 flex flex-col h-screen select-none">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-navy-700/80">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-100 text-base tracking-tight block">
            ContainerGuard
          </span>
          <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase block">
            v1.0.0 • DevSecOps
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-850/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-blue-400' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status Banner */}
      <div className="p-4 border-t border-navy-700/80 bg-navy-950/80">
        <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-medium">Scanner Engine</span>
            <span
              className={`w-2 h-2 rounded-full ${
                health?.trivy_available
                  ? 'bg-emerald-400'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {health?.trivy_available ? (
              <span className="text-emerald-400 font-mono">Trivy Ready</span>
            ) : (
              <span className="text-amber-400 font-mono">Trivy Not Found</span>
            )}
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="mt-2 w-full text-center text-[10px] text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 font-medium transition"
          >
            System Diagnostics <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
