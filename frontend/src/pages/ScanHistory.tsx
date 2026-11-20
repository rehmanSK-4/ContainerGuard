import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Scan, NavPage } from '../types';
import { Card } from '../components/Common/Card';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Modal } from '../components/Common/Modal';
import { EmptyState } from '../components/Common/EmptyState';
import { api } from '../services/api';

interface ScanHistoryProps {
  scans: Scan[];
  loading: boolean;
  onRefresh: () => void;
  onSelectScan: (scanId: number) => void;
  onNavigate: (page: NavPage) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  scans,
  loading,
  onRefresh,
  onSelectScan,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'FAILED'>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Scan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.image_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.image_tag.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || s.scan_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedScans = [...filteredScans].sort((a, b) => {
    const dateA = new Date(a.scan_date).getTime();
    const dateB = new Date(b.scan_date).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteScan(deleteTarget.id);
      setIsDeleting(false);
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      setIsDeleting(false);
      alert(`Failed to delete scan: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            <span>Scan History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of container vulnerability scans persisted in SQLite.
          </p>
        </div>

        <button
          onClick={() => onNavigate('scan')}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold self-start sm:self-auto transition shadow-sm"
        >
          Start New Scan
        </button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by container image name or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-lg border border-navy-700 text-xs">
              {(['ALL', 'COMPLETED', 'FAILED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sort Order */}
            <button
              onClick={() =>
                setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
              }
              className="px-2.5 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Scans List */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs animate-pulse">
            Loading scan history records...
          </div>
        ) : sortedScans.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={scans.length === 0 ? 'No Scans Recorded Yet' : 'No Matching Scans'}
            description={
              scans.length === 0
                ? 'Your audit history is currently empty. Run your first Docker image scan to populate the database.'
                : 'No scan records matched your filter criteria.'
            }
            actionText={scans.length === 0 ? 'Start First Scan' : undefined}
            onAction={scans.length === 0 ? () => onNavigate('scan') : undefined}
          />
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Image Reference</th>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4">Scan Date</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-3 text-center">Critical</th>
                  <th className="py-3 px-3 text-center">High</th>
                  <th className="py-3 px-3 text-center">Total CVEs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {sortedScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-navy-800/40 transition group"
                  >
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-100">
                      {scan.image_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-navy-800 border border-navy-700 text-[11px]">
                        {scan.image_tag}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(scan.scan_date).toLocaleDateString()}{' '}
                      {new Date(scan.scan_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {scan.scan_duration}s
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-mono font-bold ${
                          scan.critical_count > 0 ? 'text-red-400' : 'text-slate-600'
                        }`}
                      >
                        {scan.critical_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-mono font-semibold ${
                          scan.high_count > 0 ? 'text-orange-400' : 'text-slate-600'
                        }`}
                      >
                        {scan.high_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {scan.total_vulnerabilities}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={scan.scan_status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectScan(scan.id)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-blue-400 hover:text-white hover:bg-blue-600 transition flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(scan)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Scan Record"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-slate-300 text-xs leading-relaxed">
            Are you sure you want to delete the audit record for{' '}
            <strong className="text-white font-mono">
              {deleteTarget?.image_name}:{deleteTarget?.image_tag}
            </strong>{' '}
            (Scan ID #{deleteTarget?.id})?
          </p>
          <p className="text-slate-400 text-[11px]">
            This will permanently remove the scan entry, all associated CVE vulnerability findings,
            and cached report files from SQLite.
          </p>
        </div>
      </Modal>
    </div>
  );
};
