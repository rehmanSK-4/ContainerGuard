import React from 'react';
import {
  ShieldAlert,
  Layers,
  Flame,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { DashboardStats, NavPage } from '../types';
import { Card } from '../components/Common/Card';
import { SeverityBadge } from '../components/Common/SeverityBadge';
import { StatusBadge } from '../components/Common/StatusBadge';
import { EmptyState } from '../components/Common/EmptyState';
import { SeverityPieChart } from '../components/Charts/SeverityPieChart';
import { SeverityBarChart } from '../components/Charts/SeverityBarChart';

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (page: NavPage) => void;
  onSelectScan: (scanId: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  loading,
  onNavigate,
  onSelectScan,
}) => {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-navy-850 rounded-xl border border-navy-700/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-navy-850 rounded-xl border border-navy-700/60" />
          <div className="h-80 bg-navy-850 rounded-xl border border-navy-700/60" />
        </div>
      </div>
    );
  }

  const hasScans = stats && stats.total_scans > 0;

  const getOverallStatusBanner = () => {
    if (!stats || stats.total_scans === 0) {
      return {
        label: 'No Scans Yet',
        desc: 'Scan your first Docker image to assess security posture.',
        color: 'bg-slate-900 border-slate-700 text-slate-300',
        icon: ShieldCheck,
      };
    }
    if (stats.critical_vulnerabilities > 0) {
      return {
        label: 'Critical Risk Detected',
        desc: `${stats.critical_vulnerabilities} critical vulnerabilities require immediate remediation.`,
        color: 'bg-red-950/40 border-red-800/80 text-red-400',
        icon: Flame,
      };
    }
    if (stats.high_vulnerabilities > 0) {
      return {
        label: 'High Risk Exposure',
        desc: `${stats.high_vulnerabilities} high severity vulnerabilities identified across scanned images.`,
        color: 'bg-orange-950/40 border-orange-800/80 text-orange-400',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'Security Posture Healthy',
      desc: 'All analyzed container images have zero critical or high severity vulnerabilities.',
      color: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400',
      icon: ShieldCheck,
    };
  };

  const statusBanner = getOverallStatusBanner();
  const StatusIcon = statusBanner.icon;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Overall Status Banner */}
      <div className={`p-5 rounded-xl border ${statusBanner.color} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm`}>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                {statusBanner.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-black/40 text-slate-300">
                Security Health
              </span>
            </div>
            <p className="text-xs text-slate-300/90 mt-0.5">{statusBanner.desc}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('scan')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-2 shadow-sm shrink-0"
        >
          <span>Run Container Scan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <Card className="hover:border-navy-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Scans
            </span>
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/60">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {stats?.total_scans || 0}
            </span>
            <span className="text-xs text-slate-400">audits executed</span>
          </div>
        </Card>

        {/* Unique Images */}
        <Card className="hover:border-navy-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Images Scanned
            </span>
            <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {stats?.unique_images || 0}
            </span>
            <span className="text-xs text-slate-400">unique repositories</span>
          </div>
        </Card>

        {/* Critical Vulnerabilities */}
        <Card className="hover:border-red-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-400 uppercase tracking-wider">
              Critical
            </span>
            <div className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-800/60">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-400">
              {stats?.critical_vulnerabilities || 0}
            </span>
            <span className="text-xs text-slate-400">CVEs requiring fix</span>
          </div>
        </Card>

        {/* High Vulnerabilities */}
        <Card className="hover:border-orange-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
              High
            </span>
            <div className="p-2 rounded-lg bg-orange-950 text-orange-400 border border-orange-800/60">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-orange-400">
              {stats?.high_vulnerabilities || 0}
            </span>
            <span className="text-xs text-slate-400">CVEs to remediate</span>
          </div>
        </Card>
      </div>

      {/* Security Overview Charts */}
      {hasScans ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Vulnerability Distribution"
            subtitle="Breakdown by CVSS severity rating across all scans"
          >
            <SeverityPieChart
              distribution={
                stats?.severity_distribution || {
                  CRITICAL: 0,
                  HIGH: 0,
                  MEDIUM: 0,
                  LOW: 0,
                  UNKNOWN: 0,
                }
              }
            />
          </Card>

          <Card
            title="Vulnerabilities by Severity"
            subtitle="Frequency distribution of identified CVE findings"
          >
            <SeverityBarChart
              distribution={
                stats?.severity_distribution || {
                  CRITICAL: 0,
                  HIGH: 0,
                  MEDIUM: 0,
                  LOW: 0,
                  UNKNOWN: 0,
                }
              }
            />
          </Card>
        </div>
      ) : null}

      {/* Recent Scan Activity */}
      <Card
        title="Recent Scan Activity"
        subtitle="Latest automated container security inspections"
        action={
          hasScans && (
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )
        }
      >
        {!hasScans ? (
          <EmptyState
            icon={ShieldAlert}
            title="No Scans Executed Yet"
            description="ContainerGuard has not performed any image inspections. Start by analyzing a container image like nginx:latest or python:3.12-slim."
            actionText="Start First Container Scan"
            onAction={() => onNavigate('scan')}
          />
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Image Name</th>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4">Scan Date</th>
                  <th className="py-3 px-3 text-center">Critical</th>
                  <th className="py-3 px-3 text-center">High</th>
                  <th className="py-3 px-3 text-center">Medium</th>
                  <th className="py-3 px-3 text-center">Low</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {stats.recent_scans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-navy-800/40 transition group"
                  >
                    <td className="py-3.5 px-5 font-medium text-slate-100 font-mono">
                      {scan.image_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-navy-800 border border-navy-700 text-[11px]">
                        {scan.image_tag}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(scan.scan_date).toLocaleDateString()} {new Date(scan.scan_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-mono font-semibold ${scan.critical_count > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                        {scan.critical_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-mono font-semibold ${scan.high_count > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                        {scan.high_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-mono ${scan.medium_count > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {scan.medium_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-mono ${scan.low_count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {scan.low_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={scan.scan_status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onSelectScan(scan.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-blue-400 hover:text-white hover:bg-blue-600 transition"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
