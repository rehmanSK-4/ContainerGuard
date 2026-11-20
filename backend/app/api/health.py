from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.scan import HealthResponse
from app.services.trivy import is_trivy_installed, is_docker_installed, is_docker_daemon_running

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    docker_ok = is_docker_installed() and is_docker_daemon_running()
    trivy_ok = is_trivy_installed()
    
    if docker_ok and trivy_ok:
        status = "healthy"
        msg = "All security scanner components are online and operational."
    elif trivy_ok and not docker_ok:
        status = "degraded"
        msg = "Trivy scanner is ready. Docker daemon is not active (Docker required for local images)."
    elif docker_ok and not trivy_ok:
        status = "degraded"
        msg = "Docker is active, but Trivy CLI is not detected in system PATH."
    else:
        status = "degraded"
        msg = "Neither Docker daemon nor Trivy CLI was detected in PATH."

    return HealthResponse(
        status=status,
        backend_running=True,
        docker_available=docker_ok,
        trivy_available=trivy_ok,
        timestamp=datetime.now(timezone.utc),
        message=msg
    )
