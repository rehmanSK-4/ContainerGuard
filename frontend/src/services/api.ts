import axios from 'axios';
import {
  HealthStatus,
  SystemInfo,
  DashboardStats,
  Scan,
  ScanDetail
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 360000, // 6 minutes to allow long Trivy scans
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health & System
  async getHealth(): Promise<HealthStatus> {
    const res = await apiClient.get<HealthStatus>('/health');
    return res.data;
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const res = await apiClient.get<SystemInfo>('/system/info');
    return res.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },

  // Scans
  async getScans(): Promise<Scan[]> {
    const res = await apiClient.get<Scan[]>('/scans');
    return res.data;
  },

  async getScan(id: number): Promise<ScanDetail> {
    const res = await apiClient.get<ScanDetail>(`/scans/${id}`);
    return res.data;
  },

  async triggerScan(image_name: string, image_tag: string = 'latest'): Promise<ScanDetail> {
    const res = await apiClient.post<ScanDetail>('/scan', {
      image_name,
      image_tag,
    });
    return res.data;
  },

  async deleteScan(id: number): Promise<{ message: string; id: number }> {
    const res = await apiClient.delete<{ message: string; id: number }>(`/scans/${id}`);
    return res.data;
  },

  // Report URLs
  getReportUrl(id: number, format: 'json' | 'html' | 'pdf'): string {
    return `${API_BASE}/scans/${id}/report/${format}`;
  },

  async downloadReport(id: number, format: 'json' | 'html' | 'pdf', suggestedFilename?: string): Promise<void> {
    const response = await apiClient.get(`/scans/${id}/report/${format}`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : (format === 'html' ? 'text/html' : 'application/json')
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = suggestedFilename || `containerguard-report-${id}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
};
