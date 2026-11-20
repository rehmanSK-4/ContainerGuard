import platform
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, distinct

from app.database import get_db
from app.models.scan import Scan, Vulnerability
from app.schemas.scan import SystemInfoResponse, DashboardStatsResponse, ScanResponse
from app.core.config import settings
from app.services.trivy import (
    is_trivy_installed,
    is_docker_installed,
    is_docker_daemon_running,
    get_trivy_version,
    get_trivy_path,
    get_docker_version,
)

router = APIRouter(tags=["System"])

@router.get("/system/info", response_model=SystemInfoResponse)
def get_system_info(db: Session = Depends(get_db)):
    """Returns host environment, scanner tooling, and database statistics."""
    docker_installed = is_docker_installed()
    docker_running = is_docker_daemon_running()
    docker_ver = get_docker_version() if docker_installed else None
    
    trivy_installed = is_trivy_installed()
    trivy_ver = get_trivy_version() if trivy_installed else None
    trivy_path = get_trivy_path()

    total_scans = db.query(func.count(Scan.id)).scalar() or 0
    total_vulns = db.query(func.count(Vulnerability.id)).scalar() or 0

    return SystemInfoResponse(
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        host_os=f"{platform.system()} {platform.release()} ({platform.machine()})",
        python_version=platform.python_version(),
        docker_available=docker_running,
        docker_version=docker_ver,
        docker_daemon_running=docker_running,
        trivy_available=trivy_installed,
        trivy_version=trivy_ver,
        trivy_path=trivy_path,
        database_type="SQLite",
        database_path=settings.DATABASE_URL.replace("sqlite:///", ""),
        total_scans_recorded=total_scans,
        total_vulnerabilities_recorded=total_vulns,
        github_repository="https://github.com/containerguard/containerguard"
    )

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Computes real aggregate metrics and severity distribution across all scans."""
    total_scans = db.query(func.count(Scan.id)).scalar() or 0
    unique_images = db.query(func.count(distinct(Scan.image_name))).scalar() or 0
    
    crit_count = db.query(func.sum(Scan.critical_count)).scalar() or 0
    high_count = db.query(func.sum(Scan.high_count)).scalar() or 0
    med_count = db.query(func.sum(Scan.medium_count)).scalar() or 0
    low_count = db.query(func.sum(Scan.low_count)).scalar() or 0
    unk_count = db.query(func.sum(Scan.unknown_count)).scalar() or 0

    if total_scans == 0:
        overall_status = "NO_SCANS"
    elif crit_count > 0:
        overall_status = "CRITICAL"
    elif high_count > 0:
        overall_status = "WARNING"
    else:
        overall_status = "SECURE"

    recent_scans = db.query(Scan).order_by(desc(Scan.scan_date)).limit(10).all()

    return DashboardStatsResponse(
        total_scans=total_scans,
        unique_images=unique_images,
        critical_vulnerabilities=crit_count,
        high_vulnerabilities=high_count,
        medium_vulnerabilities=med_count,
        low_vulnerabilities=low_count,
        overall_status=overall_status,
        severity_distribution={
            "CRITICAL": crit_count,
            "HIGH": high_count,
            "MEDIUM": med_count,
            "LOW": low_count,
            "UNKNOWN": unk_count
        },
        recent_scans=[ScanResponse.model_validate(s) for s in recent_scans]
    )
