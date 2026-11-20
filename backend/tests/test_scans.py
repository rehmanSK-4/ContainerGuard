def test_get_scans(client, sample_scan):
    response = client.get("/api/scans")
    assert response.status_code == 200
    scans = response.json()
    assert len(scans) >= 1
    assert scans[0]["image_name"] == "nginx"
    assert scans[0]["image_tag"] == "1.25.0"
    assert scans[0]["total_vulnerabilities"] == 3

def test_get_scan_detail(client, sample_scan):
    response = client.get(f"/api/scans/{sample_scan.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_scan.id
    assert len(data["vulnerabilities"]) == 3
    assert len(data["recommendations"]) > 0
    assert any(v["cve_id"] == "CVE-2023-44487" for v in data["vulnerabilities"])

def test_get_nonexistent_scan(client):
    response = client.get("/api/scans/999999")
    assert response.status_code == 404

def test_delete_scan(client, sample_scan):
    response = client.delete(f"/api/scans/{sample_scan.id}")
    assert response.status_code == 200
    assert response.json()["id"] == sample_scan.id

    # Verify scan is deleted
    get_res = client.get(f"/api/scans/{sample_scan.id}")
    assert get_res.status_code == 404

def test_scan_input_validation(client):
    # Test invalid shell injection attempts
    bad_payloads = [
        {"image_name": "nginx; rm -rf /", "image_tag": "latest"},
        {"image_name": "ubuntu && whoami", "image_tag": "latest"},
        {"image_name": "redis | cat /etc/passwd", "image_tag": "latest"},
        {"image_name": "busybox`whoami`", "image_tag": "latest"},
        {"image_name": "", "image_tag": "latest"},
    ]
    for p in bad_payloads:
        res = client.post("/api/scan", json=p)
        assert res.status_code == 422 or res.status_code == 400
