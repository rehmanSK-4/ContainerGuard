export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface Vulnerability {
  id: number;
  scan_id: number;
  cve_id: string;
  package_name: string;
  installed_version?: string | null;
  fixed_version?: string | null;
  severity: Severity;
  title?: string | null;
  description?: string | null;
  primary_url?: string | null;
}

export interface RecommendationItem {
  title: string;
  category: 'BASE_IMAGE' | 'PACKAGE_UPGRADE' | 'DEPENDENCY' | 'SECURITY_HARDENING';
  severity_target: 'CRITICAL' | 'HIGH' | 'GENERAL';
  description: string;
  suggested_action: string;
}

export interface Scan {
  id: number;
  image_name: string;
  image_tag: string;
  scan_date: string;
  scan_duration: number;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  unknown_count: number;
  scan_status: 'COMPLETED' | 'FAILED' | 'RUNNING';
  error_message?: string | null;
  report_path?: string | null;
}

export interface ScanDetail extends Scan {
  vulnerabilities: Vulnerability[];
  recommendations: RecommendationItem[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  backend_running: boolean;
  docker_available: boolean;
  trivy_available: boolean;
  timestamp: string;
  message: string;
}

export interface SystemInfo {
  project_name: string;
  version: string;
  host_os: string;
  python_version: string;
  docker_available: boolean;
  docker_version?: string | null;
  docker_daemon_running: boolean;
  trivy_available: boolean;
  trivy_version?: string | null;
  trivy_path?: string | null;
  database_type: string;
  database_path: string;
  total_scans_recorded: number;
  total_vulnerabilities_recorded: number;
  github_repository: string;
}

export interface DashboardStats {
  total_scans: number;
  unique_images: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  medium_vulnerabilities: number;
  low_vulnerabilities: number;
  overall_status: 'SECURE' | 'WARNING' | 'CRITICAL' | 'NO_SCANS';
  severity_distribution: Record<Severity, number>;
  recent_scans: Scan[];
}

export type NavPage = 'dashboard' | 'scan' | 'results' | 'history' | 'reports' | 'settings';
