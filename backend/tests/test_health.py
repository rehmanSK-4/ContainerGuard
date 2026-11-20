def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["backend_running"] is True
    assert "docker_available" in data
    assert "trivy_available" in data
    assert "timestamp" in data
    assert "message" in data

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "ContainerGuard"
    assert "docs_url" in data
