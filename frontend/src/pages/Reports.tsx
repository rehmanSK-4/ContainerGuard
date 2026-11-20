import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  FileCheck2,
  Download,
  ExternalLink,
  ShieldAlert,
  Search,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Scan, NavPage } from '../types';
import { Card } from '../components/Common/Card';
import { SeverityBadge } from '../components/Common/SeverityBadge';
import { StatusBadge } from '../components/Common/StatusBadge';
import { EmptyState } from '../components/Common/EmptyState';
import { api } from '../services/api';

interface ReportsProps {
  scans: Scan[];
  loading: boolean;
  onNavigate: (page: NavPage) => void;
  onSelectScan: (scanId: number) => void;
}

export const Reports: React.FC<ReportsProps> = ({
  scans,
  loading,
  onNavigate,
  onSelectScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const completedScans = scans.filter((s) => s.scan_status === 'COMPLETED');
  const filteredScans = completedScans.filter((s) =>
    s.image_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.image_tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (scan: Scan, format: 'json' | 'html' | 'pdf') => {
    const key = `${scan.id}-${format}`;
    setDownloadingFormat(key);
    try {
      const filename = `containerguard-audit-${scan.image_name.replace('/', '_')}-${scan.image_tag}-${scan.id}.${format}`;
      await api.downloadReport(scan.id, format, filename);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Security Audit Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export executive and technical container compliance reports in JSON, HTML, and PDF formats.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by image name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-navy-850 border border-navy-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Reports Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <FileCode className="w-4 h-4" />
            <span>JSON Reports</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Machine-readable raw audit payload formatted for CI/CD integrations, SIEM ingestion, and automated pipelines.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>HTML Reports</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interactive, standalone dark-themed security reports with styled CVE lists, recommendations, and print CSS.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>PDF Export</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Executive-ready paginated PDF audit certificates generated via ReportLab with formal breakdown and mitigation steps.
          </p>
        </div>
      </div>

      {/* Reports Table */}
      <Card title={`Available Security Reports (${filteredScans.length})`}>
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs animate-pulse">
            Loading report records...
          </div>
        ) : filteredScans.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={completedScans.length === 0 ? 'No Completed Scans Available' : 'No Reports Match Search'}
            description={
              completedScans.length === 0
                ? 'Security audit reports are generated automatically whenever a container scan completes successfully.'
                : 'Try adjusting your search query.'
            }
            actionText={completedScans.length === 0 ? 'Run First Scan' : undefined}
            onAction={completedScans.length === 0 ? () => onNavigate('scan') : undefined}
          />
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Target Image</th>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4">Vulnerability Summary</th>
                  <th className="py-3 px-5 text-right">Download Formats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {filteredScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-navy-800/40 transition group"
                  >
                    <td className="py-4 px-5">
                      <div className="font-mono font-bold text-slate-100">
                        {scan.image_name}
                      </div>
                      <button
                        onClick={() => onSelectScan(scan.id)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>View Scan Findings</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-navy-800 border border-navy-700 text-[11px]">
                        {scan.image_tag}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(scan.scan_date).toLocaleDateString()}{' '}
                      {new Date(scan.scan_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {scan.critical_count > 0 && (
                          <SeverityBadge severity="CRITICAL" size="sm" count={scan.critical_count} />
                        )}
                        {scan.high_count > 0 && (
                          <SeverityBadge severity="HIGH" size="sm" count={scan.high_count} />
                        )}
                        {scan.total_vulnerabilities === 0 && (
                          <span className="text-emerald-400 text-xs font-semibold">
                            ✓ Zero CVEs (Clean)
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({scan.total_vulnerabilities} total)
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* JSON */}
                        <button
                          onClick={() => handleDownload(scan, 'json')}
                          disabled={downloadingFormat === `${scan.id}-json`}
                          className="px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-750 border border-navy-700 text-blue-400 hover:text-blue-300 text-xs font-medium transition flex items-center gap-1.5"
                          title="Download JSON Report"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>JSON</span>
                        </button>

                        {/* HTML */}
                        <button
                          onClick={() => handleDownload(scan, 'html')}
                          disabled={downloadingFormat === `${scan.id}-html`}
                          className="px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-750 border border-navy-700 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition flex items-center gap-1.5"
                          title="Download HTML Report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>HTML</span>
                        </button>

                        {/* PDF */}
                        <button
                          onClick={() => handleDownload(scan, 'pdf')}
                          disabled={downloadingFormat === `${scan.id}-pdf`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                          title="Download PDF Audit Report"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
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
