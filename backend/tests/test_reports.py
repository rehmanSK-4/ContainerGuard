import json

def test_download_json_report(client, sample_scan):
    response = client.get(f"/api/scans/{sample_scan.id}/report/json")
    assert response.status_code == 200
    assert "application/json" in response.headers.get("content-type", "")
    assert "attachment" in response.headers.get("content-disposition", "")
    
    data = response.json()
    assert data["project"] == "ContainerGuard"
    assert data["scan_metadata"]["image_name"] == "nginx"
    assert data["vulnerability_summary"]["total"] == 3
    assert len(data["vulnerabilities"]) == 3
    assert len(data["recommendations"]) > 0

def test_download_html_report(client, sample_scan):
    response = client.get(f"/api/scans/{sample_scan.id}/report/html")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "attachment" in response.headers.get("content-disposition", "")
    
    html = response.text
    assert "ContainerGuard" in html
    assert "CVE-2023-44487" in html
    assert "nghttp2" in html
    assert "Security Recommendations" in html

def test_download_pdf_report(client, sample_scan):
    response = client.get(f"/api/scans/{sample_scan.id}/report/pdf")
    assert response.status_code == 200
    assert "application/pdf" in response.headers.get("content-type", "")
    assert response.content.startswith(b"%PDF")
    assert len(response.content) > 1000
