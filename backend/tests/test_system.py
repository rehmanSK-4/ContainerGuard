def test_get_system_info(client, sample_scan):
    response = client.get("/api/system/info")
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "ContainerGuard"
    assert "host_os" in data
    assert "python_version" in data
    assert "docker_available" in data
    assert "trivy_available" in data
    assert data["database_type"] == "SQLite"
    assert data["total_scans_recorded"] >= 1
    assert data["total_vulnerabilities_recorded"] >= 3

def test_get_dashboard_stats(client, sample_scan):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_scans"] >= 1
    assert data["unique_images"] >= 1
    assert data["critical_vulnerabilities"] >= 1
    assert data["high_vulnerabilities"] >= 1
    assert data["overall_status"] in ["SECURE", "WARNING", "CRITICAL", "NO_SCANS"]
    assert "CRITICAL" in data["severity_distribution"]
    assert len(data["recent_scans"]) >= 1
