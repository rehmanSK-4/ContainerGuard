import json
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

from app.models.scan import Scan, Vulnerability
from app.schemas.scan import RecommendationItem


def generate_json_report(
    scan: Scan,
    vulnerabilities: List[Vulnerability],
    recommendations: List[RecommendationItem]
) -> Dict[str, Any]:
    """Generates standard JSON audit report structure."""
    return {
        "project": "ContainerGuard",
        "report_type": "Container Vulnerability Audit Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scan_metadata": {
            "id": scan.id,
            "image_name": scan.image_name,
            "image_tag": scan.image_tag,
            "full_image": f"{scan.image_name}:{scan.image_tag}",
            "scan_date": scan.scan_date.isoformat(),
            "scan_duration_seconds": scan.scan_duration,
            "scan_status": scan.scan_status,
            "scanner": "Trivy"
        },
        "vulnerability_summary": {
            "total": scan.total_vulnerabilities,
            "critical": scan.critical_count,
            "high": scan.high_count,
            "medium": scan.medium_count,
            "low": scan.low_count,
            "unknown": scan.unknown_count,
            "overall_risk_level": "CRITICAL" if scan.critical_count > 0 else (
                "HIGH" if scan.high_count > 0 else (
                    "MEDIUM" if scan.medium_count > 0 else (
                        "LOW" if scan.low_count > 0 else "SECURE"
                    )
                )
            )
        },
        "recommendations": [
            {
                "title": r.title,
                "category": r.category,
                "severity_target": r.severity_target,
                "description": r.description,
                "suggested_action": r.suggested_action
            }
            for r in recommendations
        ],
        "vulnerabilities": [
            {
                "cve_id": v.cve_id,
                "package_name": v.package_name,
                "installed_version": v.installed_version or "N/A",
                "fixed_version": v.fixed_version or "None",
                "severity": v.severity,
                "title": v.title or "",
                "description": v.description or "",
                "primary_url": v.primary_url or ""
            }
            for v in vulnerabilities
        ]
    }


def generate_html_report(
    scan: Scan,
    vulnerabilities: List[Vulnerability],
    recommendations: List[RecommendationItem]
) -> str:
    """Generates a modern, self-contained HTML security report."""
    risk_level = "CRITICAL" if scan.critical_count > 0 else (
        "HIGH" if scan.high_count > 0 else (
            "MEDIUM" if scan.medium_count > 0 else (
                "LOW" if scan.low_count > 0 else "SECURE"
            )
        )
    )

    risk_color_map = {
        "CRITICAL": "#ef4444",
        "HIGH": "#f97316",
        "MEDIUM": "#eab308",
        "LOW": "#22c55e",
        "SECURE": "#3b82f6"
    }
    risk_color = risk_color_map.get(risk_level, "#3b82f6")

    vuln_rows = ""
    for v in vulnerabilities:
        badge_color = risk_color_map.get(v.severity, "#94a3b8")
        url_link = f'<a href="{v.primary_url}" target="_blank" style="color: #60a5fa; text-decoration: underline;">{v.cve_id}</a>' if v.primary_url else v.cve_id
        fixed_text = f'<span style="color: #4ade80; font-weight: 600;">{v.fixed_version}</span>' if v.fixed_version else '<span style="color: #94a3b8;">None</span>'

        vuln_rows += f"""
        <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 12px 14px; font-weight: 600;">{url_link}</td>
            <td style="padding: 12px 14px; color: #cbd5e1; font-family: monospace;">{v.package_name}</td>
            <td style="padding: 12px 14px; color: #94a3b8; font-family: monospace;">{v.installed_version or 'N/A'}</td>
            <td style="padding: 12px 14px; font-family: monospace;">{fixed_text}</td>
            <td style="padding: 12px 14px;">
                <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: {badge_color};">
                    {v.severity}
                </span>
            </td>
            <td style="padding: 12px 14px; color: #94a3b8; font-size: 12px; line-height: 1.4; max-width: 320px;">
                {v.description[:180] + '...' if v.description and len(v.description) > 180 else (v.description or 'No details.')}
            </td>
        </tr>
        """

    rec_cards = ""
    for r in recommendations:
        rec_cards += f"""
        <div style="background-color: #0f172a; border: 1px solid #1e293b; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px; margin-bottom: 12px;">
            <div style="font-weight: 700; font-size: 14px; color: #f8fafc; margin-bottom: 4px;">{r.title}</div>
            <div style="color: #94a3b8; font-size: 13px; margin-bottom: 6px;">{r.description}</div>
            <div style="color: #60a5fa; font-size: 12px; font-weight: 500;"><strong>Recommended Action:</strong> {r.suggested_action}</div>
        </div>
        """

    empty_vulns_html = """
    <tr>
        <td colspan="6" style="padding: 30px; text-align: center; color: #22c55e; font-weight: 600;">
            ✓ Clean Image! No known CVE vulnerabilities detected.
        </td>
    </tr>
    """ if not vulnerabilities else ""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ContainerGuard Audit Report – {scan.image_name}:{scan.image_tag}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f17;
            color: #f1f5f9;
            margin: 0;
            padding: 32px 24px;
        }}
        .container {{
            max-width: 1040px;
            margin: 0 auto;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .brand {{
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .badge-risk {{
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #fff;
            background-color: {risk_color};
            text-transform: uppercase;
        }}
        .grid-stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-bottom: 28px;
        }}
        .stat-card {{
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: 800;
            margin-top: 4px;
        }}
        .meta-box {{
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 8px;
            padding: 16px 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            margin-bottom: 28px;
            font-size: 13px;
        }}
        .meta-item strong {{
            color: #94a3b8;
            display: block;
            margin-bottom: 2px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .table-wrap {{
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 28px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
        }}
        th {{
            background-color: #1e293b;
            color: #94a3b8;
            font-weight: 600;
            padding: 12px 14px;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }}
        .section-title {{
            font-size: 17px;
            font-weight: 700;
            margin: 24px 0 12px 0;
            color: #f8fafc;
        }}
        @media print {{
            body {{ background-color: #fff !important; color: #000 !important; }}
            .stat-card, .meta-box, .table-wrap {{ background: #fff !important; border: 1px solid #ccc !important; }}
            th {{ background: #eee !important; color: #000 !important; }}
            tr {{ border-bottom: 1px solid #ddd !important; }}
            td {{ color: #000 !important; }}
            .section-title {{ color: #000 !important; }}
            .badge-risk {{ print-color-adjust: exact; -webkit-print-color-adjust: exact; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="brand">
                    🛡️ ContainerGuard
                </div>
                <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Automated Container Vulnerability & Security Inspector</div>
            </div>
            <div style="text-align: right;">
                <span class="badge-risk">Risk: {risk_level}</span>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Report generated on {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}</div>
            </div>
        </div>

        <div class="meta-box">
            <div class="meta-item">
                <strong>Target Image</strong>
                <span>{scan.image_name}:{scan.image_tag}</span>
            </div>
            <div class="meta-item">
                <strong>Scan Date</strong>
                <span>{scan.scan_date.strftime("%Y-%m-%d %H:%M:%S UTC")}</span>
            </div>
            <div class="meta-item">
                <strong>Scan Duration</strong>
                <span>{scan.scan_duration}s</span>
            </div>
            <div class="meta-item">
                <strong>Scanner Engine</strong>
                <span>Aqua Trivy CLI</span>
            </div>
            <div class="meta-item">
                <strong>Scan Status</strong>
                <span style="color: {'#22c55e' if scan.scan_status == 'COMPLETED' else '#ef4444'}; font-weight: 600;">{scan.scan_status}</span>
            </div>
        </div>

        <div class="grid-stats">
            <div class="stat-card">
                <div style="color: #94a3b8; font-size: 12px;">Total CVEs</div>
                <div class="stat-value" style="color: #f8fafc;">{scan.total_vulnerabilities}</div>
            </div>
            <div class="stat-card">
                <div style="color: #ef4444; font-size: 12px;">Critical</div>
                <div class="stat-value" style="color: #ef4444;">{scan.critical_count}</div>
            </div>
            <div class="stat-card">
                <div style="color: #f97316; font-size: 12px;">High</div>
                <div class="stat-value" style="color: #f97316;">{scan.high_count}</div>
            </div>
            <div class="stat-card">
                <div style="color: #eab308; font-size: 12px;">Medium</div>
                <div class="stat-value" style="color: #eab308;">{scan.medium_count}</div>
            </div>
            <div class="stat-card">
                <div style="color: #22c55e; font-size: 12px;">Low</div>
                <div class="stat-value" style="color: #22c55e;">{scan.low_count}</div>
            </div>
        </div>

        <div class="section-title">Security Recommendations</div>
        {rec_cards}

        <div class="section-title">Detected Vulnerabilities ({len(vulnerabilities)})</div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>CVE ID</th>
                        <th>Package</th>
                        <th>Installed</th>
                        <th>Fixed Version</th>
                        <th>Severity</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {empty_vulns_html}
                    {vuln_rows}
                </tbody>
            </table>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; color: #64748b; font-size: 12px;">
            ContainerGuard – Enterprise Container Security Audit Report • Generated using Aqua Trivy
        </div>
    </div>
</body>
</html>
"""
    return html_content


class NumberedCanvas(canvas.Canvas):
    """Adds running footer with page numbers and timestamp to PDF."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Top rule line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, 755, letter[0] - 40, 755)
        self.drawString(40, 760, "ContainerGuard – Security Audit Report")
        
        # Bottom footer
        self.line(40, 45, letter[0] - 40, 45)
        self.drawString(40, 32, "Confidential • ContainerGuard Vulnerability Scanner")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 32, page_text)
        self.restoreState()


def generate_pdf_report(
    scan: Scan,
    vulnerabilities: List[Vulnerability],
    recommendations: List[RecommendationItem],
    output_filepath: Path
) -> Path:
    """Generates an executive PDF report using ReportLab."""
    doc = SimpleDocTemplate(
        str(output_filepath),
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a")
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569")
    )
    heading2_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#334155")
    )
    body_bold = ParagraphStyle(
        "CustomBodyBold",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    story = []

    # Title & Metadata banner
    story.append(Paragraph("ContainerGuard Security Audit Report", title_style))
    story.append(Paragraph(f"Automated Vulnerability Inspection for <b>{scan.image_name}:{scan.image_tag}</b>", subtitle_style))
    story.append(Spacer(1, 10))

    # Meta Table
    meta_data = [
        [
            Paragraph("<b>Image:</b>", body_style),
            Paragraph(f"{scan.image_name}:{scan.image_tag}", body_style),
            Paragraph("<b>Scan Status:</b>", body_style),
            Paragraph(scan.scan_status, body_bold)
        ],
        [
            Paragraph("<b>Scan Date:</b>", body_style),
            Paragraph(scan.scan_date.strftime("%Y-%m-%d %H:%M:%S UTC"), body_style),
            Paragraph("<b>Scan Duration:</b>", body_style),
            Paragraph(f"{scan.scan_duration} seconds", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[1.1 * inch, 2.6 * inch, 1.2 * inch, 1.8 * inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Severity Breakdown Table
    story.append(Paragraph("Vulnerability Severity Breakdown", heading2_style))
    stat_data = [
        ["Total", "Critical", "High", "Medium", "Low", "Unknown"],
        [
            str(scan.total_vulnerabilities),
            str(scan.critical_count),
            str(scan.high_count),
            str(scan.medium_count),
            str(scan.low_count),
            str(scan.unknown_count)
        ]
    ]
    stat_table = Table(stat_data, colWidths=[1.15 * inch] * 6)
    stat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (0, 1), colors.HexColor("#f1f5f9")),
        ('BACKGROUND', (1, 1), (1, 1), colors.HexColor("#fee2e2")),  # Critical red tint
        ('TEXTCOLOR', (1, 1), (1, 1), colors.HexColor("#991b1b")),
        ('BACKGROUND', (2, 1), (2, 1), colors.HexColor("#ffedd5")),  # High orange tint
        ('TEXTCOLOR', (2, 1), (2, 1), colors.HexColor("#9a3412")),
        ('BACKGROUND', (3, 1), (3, 1), colors.HexColor("#fef9c3")),  # Medium yellow tint
        ('TEXTCOLOR', (3, 1), (3, 1), colors.HexColor("#854d0e")),
        ('BACKGROUND', (4, 1), (4, 1), colors.HexColor("#dcfce7")),  # Low green tint
        ('TEXTCOLOR', (4, 1), (4, 1), colors.HexColor("#166534")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(stat_table)
    story.append(Spacer(1, 12))

    # Recommendations
    story.append(Paragraph("Executive Recommendations", heading2_style))
    for r in recommendations[:4]:
        rec_data = [
            [
                Paragraph(f"<b>{r.title}</b><br/><font color='#475569'>{r.description}</font><br/><b>Action:</b> <font color='#1d4ed8'>{r.suggested_action}</font>", body_style)
            ]
        ]
        rec_t = Table(rec_data, colWidths=[6.9 * inch])
        rec_t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(rec_t)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))

    # Vulnerability Table
    story.append(Paragraph(f"Vulnerability Findings ({len(vulnerabilities)} detected)", heading2_style))
    
    if not vulnerabilities:
        story.append(Paragraph("<b>No vulnerabilities detected.</b> This image passed all security checks without any known CVE findings.", body_style))
    else:
        table_rows = [
            [
                Paragraph("<b>CVE ID</b>", body_style),
                Paragraph("<b>Package</b>", body_style),
                Paragraph("<b>Installed</b>", body_style),
                Paragraph("<b>Fixed In</b>", body_style),
                Paragraph("<b>Severity</b>", body_style),
            ]
        ]
        # Include top 60 vulnerabilities to keep PDF size clean and manageable
        for v in vulnerabilities[:60]:
            sev_color = "#991b1b" if v.severity == "CRITICAL" else (
                "#9a3412" if v.severity == "HIGH" else (
                    "#854d0e" if v.severity == "MEDIUM" else "#166534"
                )
            )
            table_rows.append([
                Paragraph(v.cve_id, body_style),
                Paragraph(v.package_name[:24], body_style),
                Paragraph(v.installed_version[:18] if v.installed_version else "N/A", body_style),
                Paragraph(v.fixed_version[:18] if v.fixed_version else "None", body_style),
                Paragraph(f"<font color='{sev_color}'><b>{v.severity}</b></font>", body_style),
            ])

        vuln_table = Table(
            table_rows,
            colWidths=[1.6 * inch, 1.6 * inch, 1.4 * inch, 1.3 * inch, 1.0 * inch],
            repeatRows=1
        )
        vuln_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(vuln_table)

        if len(vulnerabilities) > 60:
            story.append(Spacer(1, 6))
            story.append(Paragraph(f"<i>Note: Displaying 60 of {len(vulnerabilities)} vulnerabilities in this PDF summary. Full details are available in the JSON and HTML exports.</i>", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    return output_filepath
