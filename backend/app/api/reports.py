from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scan import Scan
from app.core.config import settings
from app.services.reports import (
    generate_json_report,
    generate_html_report,
    generate_pdf_report
)
from app.services.recommendations import generate_recommendations

router = APIRouter(prefix="/scans", tags=["Reports"])

def get_scan_or_404(scan_id: int, db: Session) -> Scan:
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID {scan_id} not found."
        )
    return scan

def get_recommendations_for_scan(scan: Scan):
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
    return generate_recommendations(
        image_name=scan.image_name,
        image_tag=scan.image_tag,
        vulnerabilities=raw_vulns,
        critical_count=scan.critical_count,
        high_count=scan.high_count,
        total_count=scan.total_vulnerabilities
    )

@router.get("/{scan_id}/report/json")
def download_json_report(scan_id: int, db: Session = Depends(get_db)):
    """Downloads audit report in JSON format."""
    scan = get_scan_or_404(scan_id, db)
    recs = get_recommendations_for_scan(scan)
    report_dict = generate_json_report(scan, scan.vulnerabilities, recs)
    
    filename = f"containerguard-report-{scan.image_name.replace('/', '_')}-{scan.image_tag}-{scan.id}.json"
    return JSONResponse(
        content=report_dict,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{scan_id}/report/html")
def download_html_report(scan_id: int, db: Session = Depends(get_db)):
    """Downloads audit report in standalone HTML format."""
    scan = get_scan_or_404(scan_id, db)
    recs = get_recommendations_for_scan(scan)
    html_content = generate_html_report(scan, scan.vulnerabilities, recs)
    
    filename = f"containerguard-report-{scan.image_name.replace('/', '_')}-{scan.image_tag}-{scan.id}.html"
    return HTMLResponse(
        content=html_content,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{scan_id}/report/pdf")
def download_pdf_report(scan_id: int, db: Session = Depends(get_db)):
    """Generates and downloads executive security audit report in PDF format."""
    scan = get_scan_or_404(scan_id, db)
    recs = get_recommendations_for_scan(scan)
    
    pdf_filename = f"containerguard-report-{scan.image_name.replace('/', '_')}-{scan.image_tag}-{scan.id}.pdf"
    pdf_path = settings.REPORTS_DIR / pdf_filename
    
    # Generate fresh or read existing
    generate_pdf_report(scan, scan.vulnerabilities, recs, pdf_path)
    
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_filename
    )
