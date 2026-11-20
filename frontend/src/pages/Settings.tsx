import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
  Github,
  Terminal,
  ShieldCheck,
  Server,
  FileCode,
  Info,
} from 'lucide-react';
import { SystemInfo, HealthStatus } from '../types';
import { Card } from '../components/Common/Card';
import { api } from '../services/api';

interface SettingsProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  isHealthChecking: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  health,
  onRefreshHealth,
  isHealthChecking,
}) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const fetchSystemInfo = async () => {
    setLoadingInfo(true);
    try {
      const data = await api.getSystemInfo();
      setSystemInfo(data);
    } catch (err) {
      console.error('Failed to load system info:', err);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const handleManualCheck = () => {
    onRefreshHealth();
    fetchSystemInfo();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <span>Settings & System Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor container security engine health, database parameters, and environment telemetry.
          </p>
        </div>

        {/* Check Health Button */}
        <button
          onClick={handleManualCheck}
          disabled={isHealthChecking}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isHealthChecking ? 'animate-spin' : ''}`} />
          <span>{isHealthChecking ? 'Checking Telemetry...' : 'Check System Health'}</span>
        </button>
      </div>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backend API */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span>FastAPI Backend</span>
            </span>
            {health?.backend_running ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Uvicorn ASGI Engine • Python {systemInfo?.python_version || '3.12+'}
          </div>
        </div>

        {/* Trivy Scanner */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Trivy Scanner CLI</span>
            </span>
            {health?.trivy_available ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Missing
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">
            {systemInfo?.trivy_version || 'Not installed in system PATH'}
          </div>
        </div>

        {/* Docker Daemon */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Docker Daemon</span>
            </span>
            {health?.docker_available ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Inactive
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">
            {systemInfo?.docker_version || 'Docker socket inactive'}
          </div>
        </div>
      </div>

      {/* Detailed Technical Specs */}
      <Card title="System & Environment Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Application Name:</span>
              <span className="text-slate-200">{systemInfo?.project_name || 'ContainerGuard'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Release Version:</span>
              <span className="text-blue-400 font-bold">{systemInfo?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Host Operating System:</span>
              <span className="text-slate-200">{systemInfo?.host_os || 'macOS'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Python Version:</span>
              <span className="text-slate-200">{systemInfo?.python_version || '3.12'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400 font-sans">Trivy Binary Path:</span>
              <span className="text-slate-300">{systemInfo?.trivy_path || 'None'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Database Engine:</span>
              <span className="text-slate-200">SQLite 3 (SQLAlchemy ORM)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Database Location:</span>
              <span className="text-slate-300 truncate max-w-xs">{systemInfo?.database_path || 'containerguard.db'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Scans Persisted:</span>
              <span className="text-emerald-400 font-bold">{systemInfo?.total_scans_recorded ?? 0}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-navy-700/60">
              <span className="text-slate-400 font-sans">Vulnerabilities Recorded:</span>
              <span className="text-orange-400 font-bold">{systemInfo?.total_vulnerabilities_recorded ?? 0}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400 font-sans">Repository:</span>
              <a
                href={systemInfo?.github_repository || 'https://github.com/containerguard/containerguard'}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-sans"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Source</span>
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Setup Guide Card */}
      <Card title="Installation & Prerequisite Commands" subtitle="Quick instructions to ensure real scans run seamlessly">
        <div className="space-y-4 text-xs">
          <div>
            <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
              <span>1. Install Trivy CLI (macOS Homebrew)</span>
              {copySuccess === 'trivy' && <span className="text-emerald-400 text-[11px]">Copied!</span>}
            </div>
            <div
              onClick={() => copyToClipboard('brew install trivy', 'trivy')}
              className="p-2.5 rounded-lg bg-navy-900 border border-navy-700 text-emerald-400 font-mono cursor-pointer hover:border-navy-600 transition flex items-center justify-between"
            >
              <span>brew install trivy</span>
              <span className="text-slate-500 text-[10px]">Click to copy</span>
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
              <span>2. Install Docker Desktop for macOS</span>
              {copySuccess === 'docker' && <span className="text-emerald-400 text-[11px]">Copied!</span>}
            </div>
            <div
              onClick={() => copyToClipboard('brew install --cask docker', 'docker')}
              className="p-2.5 rounded-lg bg-navy-900 border border-navy-700 text-emerald-400 font-mono cursor-pointer hover:border-navy-600 transition flex items-center justify-between"
            >
              <span>brew install --cask docker</span>
              <span className="text-slate-500 text-[10px]">Click to copy</span>
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
              <span>3. Run ContainerGuard with Docker Compose</span>
              {copySuccess === 'compose' && <span className="text-emerald-400 text-[11px]">Copied!</span>}
            </div>
            <div
              onClick={() => copyToClipboard('docker compose up --build', 'compose')}
              className="p-2.5 rounded-lg bg-navy-900 border border-navy-700 text-blue-400 font-mono cursor-pointer hover:border-navy-600 transition flex items-center justify-between"
            >
              <span>docker compose up --build</span>
              <span className="text-slate-500 text-[10px]">Click to copy</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
