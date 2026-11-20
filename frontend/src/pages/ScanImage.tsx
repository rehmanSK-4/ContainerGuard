import React, { useState } from 'react';
import {
  Shield,
  Play,
  RotateCcw,
  Loader2,
  AlertCircle,
  Terminal,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { ScanDetail, HealthStatus } from '../types';
import { Card } from '../components/Common/Card';

interface ScanImageProps {
  health: HealthStatus | null;
  onScanCompleted: (scan: ScanDetail) => void;
}

export const ScanImage: React.FC<ScanImageProps> = ({
  health,
  onScanCompleted,
}) => {
  const [imageName, setImageName] = useState('');
  const [imageTag, setImageTag] = useState('latest');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const samplePresets = [
    { name: 'nginx', tag: 'latest', desc: 'Standard web server' },
    { name: 'python', tag: '3.12-slim', desc: 'Lightweight Python runtime' },
    { name: 'ubuntu', tag: '24.04', desc: 'Canonical Ubuntu LTS base' },
    { name: 'alpine', tag: '3.19', desc: 'Minimal musl/BusyBox image' },
  ];

  const handleApplyPreset = (name: string, tag: string) => {
    setImageName(name);
    setImageTag(tag);
    setError(null);
  };

  const handleClear = () => {
    setImageName('');
    setImageTag('latest');
    setError(null);
    setScanStep('');
  };

  const handleStartScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageName.trim()) {
      setError('Please provide a Docker container image name.');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanStep('Validating container image reference...');

    try {
      // Step simulation indicators while awaiting backend subprocess
      const stepTimer1 = setTimeout(() => {
        setScanStep('Invoking Aqua Trivy security scanner CLI...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setScanStep('Downloading vulnerability database & inspecting layers...');
      }, 3500);

      const scanResult = await api.triggerScan(imageName.trim(), imageTag.trim() || 'latest');

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setScanStep('Parsing vulnerability advisory results & saving to database...');

      setTimeout(() => {
        setIsScanning(false);
        onScanCompleted(scanResult);
      }, 600);
    } catch (err: any) {
      setIsScanning(false);
      setScanStep('');
      const detail = err.response?.data?.detail || err.message || 'Container scan failed.';
      setError(detail);
    }
  };

  const isTrivyMissing = health && !health.trivy_available;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-blue-400" />
          <span>Scan Container Image</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Perform in-depth CVE vulnerability inspection against Docker images using official Aqua Trivy.
        </p>
      </div>

      {/* Warning banner if Trivy or Docker is not detected */}
      {isTrivyMissing && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Trivy Vulnerability Scanner is not installed on the host</span>
          </div>
          <p className="text-amber-200/90 leading-relaxed">
            The host system does not have the <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-amber-300">trivy</code> CLI available in PATH.
            To execute real scans directly on macOS, run:
          </p>
          <div className="p-2 rounded bg-black/60 font-mono text-xs text-emerald-400 border border-amber-900/60 flex items-center justify-between">
            <span>brew install trivy</span>
          </div>
          <p className="text-amber-300/80 text-[11px]">
            Alternatively, launch ContainerGuard with <code className="font-mono text-white">docker compose up</code> where Trivy is pre-bundled in the container!
          </p>
        </div>
      )}

      {/* Scan Input Form */}
      <Card>
        <form onSubmit={handleStartScan} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Docker Image Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. nginx, python, ubuntu, redis"
                  value={imageName}
                  onChange={(e) => {
                    setImageName(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isScanning}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-navy-900 border border-navy-700 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-60"
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Official Docker Hub library or private registry (e.g. <code className="text-slate-400">ghcr.io/org/repo</code>)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Image Tag
              </label>
              <input
                type="text"
                placeholder="latest"
                value={imageTag}
                onChange={(e) => setImageTag(e.target.value)}
                disabled={isScanning}
                className="w-full px-3.5 py-2.5 rounded-lg bg-navy-900 border border-navy-700 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-60"
              />
              <span className="text-[11px] text-slate-500">
                Defaults to <code className="text-slate-400">latest</code>
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Quick Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePresets.map((preset) => (
                <button
                  key={`${preset.name}:${preset.tag}`}
                  type="button"
                  onClick={() => handleApplyPreset(preset.name, preset.tag)}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-750 border border-navy-700 text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <span className="text-blue-400 font-semibold">{preset.name}</span>
                  <span className="text-slate-500">:</span>
                  <span>{preset.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Scan Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Progress / Status Indicator */}
          {isScanning && (
            <div className="p-4 rounded-lg bg-blue-950/40 border border-blue-800/80 text-blue-200 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <span>Scanning Image:</span>
                    <span className="font-mono text-blue-400">
                      {imageName}:{imageTag || 'latest'}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">{scanStep}</div>
                </div>
              </div>
              <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-1.5 rounded-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-700/60">
            <button
              type="button"
              onClick={handleClear}
              disabled={isScanning}
              className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="submit"
              disabled={isScanning || !imageName.trim()}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning in progress...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Scan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Information Box */}
      <div className="p-4 rounded-xl bg-navy-850/60 border border-navy-700/60 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-300">
          <Info className="w-4 h-4 text-blue-400" />
          <span>How ContainerGuard Scans Docker Images</span>
        </div>
        <p className="leading-relaxed">
          The backend runs Trivy CLI in a secure isolated subprocess. Trivy parses package manifests
          (dpkg, rpm, apk, pip, npm) and queries the Aqua Vulnerability Database (NVD, Red Hat, Debian, GitHub Security Advisories)
          to correlate reported CVE IDs, affected versions, and security patches.
        </p>
      </div>
    </div>
  );
};
