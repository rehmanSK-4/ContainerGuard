import React, { useState } from 'react';
import {
  ShieldAlert,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Flame,
  AlertTriangle,
  Lightbulb,
  Clock,
  ArrowLeft,
  FileCode,
  FileText,
  FileCheck2,
} from 'lucide-react';
import { ScanDetail, Severity } from '../types';
import { Card } from '../components/Common/Card';
import { SeverityBadge } from '../components/Common/SeverityBadge';
import { StatusBadge } from '../components/Common/StatusBadge';
import { api } from '../services/api';

interface ScanResultsProps {
  scan: ScanDetail | null;
  onBack: () => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ scan, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'severity' | 'package'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (!scan) {
    return (
      <div className="text-center py-16 space-y-4">
        <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">No Scan Selected</h3>
        <p className="text-xs text-slate-400">
          Select an inspection record from Scan History or run a new scan.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Filter & Search
  const filteredVulns = scan.vulnerabilities.filter((v) => {
    const matchesSearch =
      v.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === 'ALL' || v.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  // Sort
  const severityRank: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    UNKNOWN: 0,
  };

  const sortedVulns = [...filteredVulns].sort((a, b) => {
    if (sortField === 'severity') {
      const diff = severityRank[a.severity] - severityRank[b.severity];
      return sortOrder === 'desc' ? -diff : diff;
    } else {
      const cmp = a.package_name.localeCompare(b.package_name);
      return sortOrder === 'asc' ? cmp : -cmp;
    }
  });

  const handleDownload = (format: 'json' | 'html' | 'pdf') => {
    const filename = `containerguard-${scan.image_name.replace('/', '_')}-${scan.image_tag}-${scan.id}.${format}`;
    api.downloadReport(scan.id, format, filename);
  };

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-navy-850 hover:bg-navy-750 text-slate-400 hover:text-white border border-navy-700 transition"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-100 font-mono">
                {scan.image_name}:{scan.image_tag}
              </h2>
              <StatusBadge status={scan.scan_status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(scan.scan_date).toLocaleString()}
              </span>
              <span>•</span>
              <span>Duration: {scan.scan_duration}s</span>
              <span>•</span>
              <span>Scan ID: #{scan.id}</span>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('json')}
            className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-750 border border-navy-700 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
            title="Download JSON Report"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => handleDownload('html')}
            className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-750 border border-navy-700 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
            title="Download HTML Report"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>HTML</span>
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            title="Download PDF Report"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* Severity Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-navy-850 border border-red-900/50">
          <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
            Critical
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-400">
            {scan.critical_count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Highest Priority</div>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-orange-900/50">
          <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
            High
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-orange-400">
            {scan.high_count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Urgent Fixes</div>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-yellow-900/50">
          <div className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">
            Medium
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-yellow-400">
            {scan.medium_count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scheduled Patching</div>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-emerald-900/50">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Low
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {scan.low_count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Low Impact</div>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total CVEs
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {scan.total_vulnerabilities}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Identified Findings</div>
        </div>
      </div>

      {/* Security Recommendations Section */}
      {scan.recommendations && scan.recommendations.length > 0 && (
        <Card
          title="Security Recommendations & Remediation Plan"
          subtitle="Actionable security advice derived from actual scan telemetry"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {scan.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg bg-navy-900 border border-navy-700/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{rec.title}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900 shrink-0">
                      {rec.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {rec.description}
                  </p>
                </div>
                <div className="p-2 rounded bg-black/40 border border-navy-800 text-[11px] text-slate-300 font-mono">
                  <span className="text-blue-400 font-semibold block mb-0.5">Action:</span>
                  <span>{rec.suggested_action}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Vulnerabilities Table */}
      <Card
        title={`Vulnerability Findings (${sortedVulns.length} / ${scan.total_vulnerabilities})`}
        subtitle="Detailed CVE advisories extracted by Aqua Trivy engine"
      >
        {/* Controls: Search, Filter, Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by CVE ID, package, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wider transition ${
                  severityFilter === sev
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-navy-900 text-slate-400 hover:text-slate-200 border border-navy-700'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {sortedVulns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {scan.total_vulnerabilities === 0 ? (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
                  ✓
                </div>
                <div className="font-semibold text-emerald-300">Clean Image!</div>
                <p className="text-slate-400 max-w-xs mx-auto">
                  No vulnerabilities detected in this container image by Trivy scanner.
                </p>
              </div>
            ) : (
              'No vulnerabilities match your search and filter criteria.'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5 border-t border-navy-700/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">CVE ID</th>
                  <th className="py-3 px-4">Package Name</th>
                  <th className="py-3 px-4">Installed Version</th>
                  <th className="py-3 px-4">Fixed Version</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4 text-right">Advisory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {sortedVulns.map((v) => {
                  const isExpanded = expandedRow === v.id;
                  return (
                    <React.Fragment key={v.id}>
                      <tr
                        onClick={() => toggleRow(v.id)}
                        className="hover:bg-navy-800/40 cursor-pointer transition select-none"
                      >
                        <td className="py-3 px-4 text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-100">
                          {v.cve_id}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {v.package_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {v.installed_version || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {v.fixed_version ? (
                            <span className="text-emerald-400 font-semibold">
                              {v.fixed_version}
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <SeverityBadge severity={v.severity} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {v.primary_url ? (
                            <a
                              href={v.primary_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              <span>NVD / AVD</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-navy-900/90 border-b border-navy-700">
                          <td colSpan={7} className="p-4 pl-12 text-xs">
                            <div className="space-y-2">
                              {v.title && (
                                <div className="font-semibold text-slate-200">
                                  {v.title}
                                </div>
                              )}
                              <p className="text-slate-400 leading-relaxed max-w-4xl">
                                {v.description || 'No detailed CVE description provided in database advisory.'}
                              </p>
                              {v.fixed_version && (
                                <div className="pt-1 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                                  <span>Remediation Target:</span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                                    Upgrade {v.package_name} to {v.fixed_version}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
