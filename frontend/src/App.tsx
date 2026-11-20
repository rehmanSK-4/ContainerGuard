import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './pages/Dashboard';
import { ScanImage } from './pages/ScanImage';
import { ScanResults } from './pages/ScanResults';
import { ScanHistory } from './pages/ScanHistory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import {
  NavPage,
  Scan,
  ScanDetail,
  HealthStatus,
  DashboardStats,
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [activeScan, setActiveScan] = useState<ScanDetail | null>(null);

  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [loadingScans, setLoadingScans] = useState<boolean>(true);
  const [isHealthChecking, setIsHealthChecking] = useState<boolean>(false);

  // Load Health
  const loadHealth = useCallback(async () => {
    setIsHealthChecking(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to query health endpoint:', err);
      setHealth({
        status: 'degraded',
        backend_running: false,
        docker_available: false,
        trivy_available: false,
        timestamp: new Date().toISOString(),
        message: 'Could not connect to ContainerGuard backend service.',
      });
    } finally {
      setIsHealthChecking(false);
    }
  }, []);

  // Load Dashboard Stats
  const loadDashboardStats = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Load Scans
  const loadScans = useCallback(async () => {
    setLoadingScans(true);
    try {
      const data = await api.getScans();
      setScans(data);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoadingScans(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadHealth();
    loadDashboardStats();
    loadScans();
  }, [loadHealth, loadDashboardStats, loadScans]);

  // Navigate to Scan Results by ID
  const handleSelectScan = async (scanId: number) => {
    try {
      const scanDetail = await api.getScan(scanId);
      setActiveScan(scanDetail);
      setCurrentPage('results');
    } catch (err: any) {
      alert(`Could not load scan #${scanId}: ${err.message}`);
    }
  };

  // When a new scan completes
  const handleScanCompleted = (scan: ScanDetail) => {
    setActiveScan(scan);
    loadDashboardStats();
    loadScans();
    setCurrentPage('results');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-navy-900 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        health={health}
        activeScanId={activeScan ? activeScan.id : null}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <Header
          health={health}
          onRefreshHealth={loadHealth}
          onNavigate={setCurrentPage}
          isHealthChecking={isHealthChecking}
        />

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentPage === 'dashboard' && (
            <Dashboard
              stats={stats}
              loading={loadingDashboard}
              onNavigate={setCurrentPage}
              onSelectScan={handleSelectScan}
            />
          )}

          {currentPage === 'scan' && (
            <ScanImage
              health={health}
              onScanCompleted={handleScanCompleted}
            />
          )}

          {currentPage === 'results' && (
            <ScanResults
              scan={activeScan}
              onBack={() => setCurrentPage('dashboard')}
            />
          )}

          {currentPage === 'history' && (
            <ScanHistory
              scans={scans}
              loading={loadingScans}
              onRefresh={() => {
                loadScans();
                loadDashboardStats();
              }}
              onSelectScan={handleSelectScan}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'reports' && (
            <Reports
              scans={scans}
              loading={loadingScans}
              onNavigate={setCurrentPage}
              onSelectScan={handleSelectScan}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              health={health}
              onRefreshHealth={loadHealth}
              isHealthChecking={isHealthChecking}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
