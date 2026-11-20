import os
import logging
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.scan import Scan, Vulnerability
from app.schemas.scan import (
    ScanCreate,
    ScanResponse,
    ScanDetailResponse,
    VulnerabilityResponse
)
from app.core.config import settings
from app.services.trivy import (
    run_trivy_scan,
    is_trivy_installed,
    TrivyNotInstalledError,
    TrivyScanError
)
from app.services.recommendations import generate_recommendations
from app.services.reports import generate_pdf_report

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scans"])

@router.post("/scan", response_model=ScanDetailResponse, status_code=status.HTTP_201_CREATED)
@router.post("/scans", response_model=ScanDetailResponse, status_code=status.HTTP_201_CREATED)
def trigger_scan(scan_req: ScanCreate, db: Session = Depends(get_db)):
    """
    Executes a real Trivy vulnerability scan against a target container image,
    stores results in SQLite, generates audit reports, and returns findings.
    """
    image_name = scan_req.image_name
    image_tag = scan_req.image_tag

    if not is_trivy_installed():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Trivy vulnerability scanner CLI is not installed or not found in system PATH. "
                "To resolve: install Trivy via 'brew install trivy' (macOS) or 'apt-get install trivy' (Linux), "
                "or run ContainerGuard using Docker Compose where Trivy is included."
            )
        )

    try:
        scan_data = run_trivy_scan(image_name=image_name, image_tag=image_tag)
    except TrivyNotInstalledError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except TrivyScanError as e:
        # Save a failed scan record for transparency in history
        failed_scan = Scan(
            image_name=image_name,
            image_tag=image_tag,
            scan_duration=0.0,
            total_vulnerabilities=0,
            critical_count=0,
            high_count=0,
            medium_count=0,
            low_count=0,
            unknown_count=0,
            scan_status="FAILED",
            error_message=str(e)
        )
        db.add(failed_scan)
        db.commit()
        db.refresh(failed_scan)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scan failed for '{image_name}:{image_tag}': {str(e)}"
        )

    # Success: Save Scan Record
    counts = scan_data["severity_counts"]
    new_scan = Scan(
        image_name=image_name,
        image_tag=image_tag,
        scan_duration=scan_data["scan_duration"],
        total_vulnerabilities=counts["TOTAL"],
        critical_count=counts["CRITICAL"],
        high_count=counts["HIGH"],
        medium_count=counts["MEDIUM"],
        low_count=counts["LOW"],
        unknown_count=counts["UNKNOWN"],
        scan_status="COMPLETED",
        error_message=None
    )
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    # Save Vulnerabilities
    vuln_objects = []
    for v in scan_data["vulnerabilities"]:
        vuln_obj = Vulnerability(
            scan_id=new_scan.id,
            cve_id=v["cve_id"],
            package_name=v["package_name"],
            installed_version=v["installed_version"],
            fixed_version=v["fixed_version"],
            severity=v["severity"],
            title=v.get("title"),
            description=v.get("description"),
            primary_url=v.get("primary_url")
        )
        vuln_objects.append(vuln_obj)

    if vuln_objects:
        db.add_all(vuln_objects)
        db.commit()

    # Pre-generate PDF report file
    try:
        pdf_path = settings.REPORTS_DIR / f"scan_{new_scan.id}_{image_name.replace('/', '_')}_{image_tag}.pdf"
        recs = generate_recommendations(
            image_name=image_name,
            image_tag=image_tag,
            vulnerabilities=scan_data["vulnerabilities"],
            critical_count=counts["CRITICAL"],
            high_count=counts["HIGH"],
            total_count=counts["TOTAL"]
        )
        generate_pdf_report(new_scan, vuln_objects, recs, pdf_path)
        new_scan.report_path = str(pdf_path)
        db.commit()
        db.refresh(new_scan)
    except Exception as e:
        logger.warning(f"Failed to pre-generate PDF report: {e}")

    # Build response with recommendations
    recommendations = generate_recommendations(
        image_name=image_name,
        image_tag=image_tag,
        vulnerabilities=scan_data["vulnerabilities"],
        critical_count=counts["CRITICAL"],
        high_count=counts["HIGH"],
        total_count=counts["TOTAL"]
    )

    return ScanDetailResponse(
        id=new_scan.id,
        image_name=new_scan.image_name,
        image_tag=new_scan.image_tag,
        scan_date=new_scan.scan_date,
        scan_duration=new_scan.scan_duration,
        total_vulnerabilities=new_scan.total_vulnerabilities,
        critical_count=new_scan.critical_count,
        high_count=new_scan.high_count,
        medium_count=new_scan.medium_count,
        low_count=new_scan.low_count,
        unknown_count=new_scan.unknown_count,
        scan_status=new_scan.scan_status,
        error_message=new_scan.error_message,
        report_path=new_scan.report_path,
        vulnerabilities=[VulnerabilityResponse.model_validate(v) for v in vuln_objects],
        recommendations=recommendations
    )


@router.get("/scans", response_model=List[ScanResponse])
def get_scans(db: Session = Depends(get_db)):
    """Returns all scan history records ordered by date descending."""
    return db.query(Scan).order_by(desc(Scan.scan_date)).all()


@router.get("/scans/{scan_id}", response_model=ScanDetailResponse)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    """Returns detailed scan information including vulnerabilities and recommendations."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID {scan_id} not found."
        )

    # Generate dynamic recommendations for this scan
    raw_vulns = [
        {
            "cve_id": v.cve_id,
            "package_name": v.package_name,
            "installed_version": v.installed_version,
            "fixed_version": v.fixed_version,
            "severity": v.severity
        }
        for v in scan.vulnerabilities
    ]
    recs = generate_recommendations(
        image_name=scan.image_name,
        image_tag=scan.image_tag,
        vulnerabilities=raw_vulns,
        critical_count=scan.critical_count,
        high_count=scan.high_count,
        total_count=scan.total_vulnerabilities
    )

    return ScanDetailResponse(
        id=scan.id,
        image_name=scan.image_name,
        image_tag=scan.image_tag,
        scan_date=scan.scan_date,
        scan_duration=scan.scan_duration,
        total_vulnerabilities=scan.total_vulnerabilities,
        critical_count=scan.critical_count,
        high_count=scan.high_count,
        medium_count=scan.medium_count,
        low_count=scan.low_count,
        unknown_count=scan.unknown_count,
        scan_status=scan.scan_status,
        error_message=scan.error_message,
        report_path=scan.report_path,
        vulnerabilities=[VulnerabilityResponse.model_validate(v) for v in scan.vulnerabilities],
        recommendations=recs
    )


@router.delete("/scans/{scan_id}", status_code=status.HTTP_200_OK)
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    """Deletes a scan record, associated vulnerabilities, and generated reports."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID {scan_id} not found."
        )

    # Clean up associated report files if they exist
    if scan.report_path and os.path.exists(scan.report_path):
        try:
            os.remove(scan.report_path)
        except Exception as e:
            logger.warning(f"Error deleting report file {scan.report_path}: {e}")

    # Remove matching scan files in reports dir
    for file in settings.REPORTS_DIR.glob(f"scan_{scan_id}_*"):
        try:
            file.unlink()
        except Exception:
            pass

    db.delete(scan)
    db.commit()

    return {"message": "Scan deleted successfully", "id": scan_id}
