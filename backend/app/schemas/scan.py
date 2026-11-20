import re
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Image name format: standard docker repository name (optional registry host, optional namespace, repository)
# e.g.: nginx, library/nginx, python, my-org/my-app, ghcr.io/owner/repo
IMAGE_NAME_REGEX = re.compile(r"^[a-zA-Z0-9]+(?:[._\-:][a-zA-Z0-9]+)*(?:/[a-zA-Z0-9]+(?:[._\-:][a-zA-Z0-9]+)*)*$")
IMAGE_TAG_REGEX = re.compile(r"^[a-zA-Z0-9_][a-zA-Z0-9_.\-]{0,127}$")

class ScanCreate(BaseModel):
    image_name: str = Field(..., description="Docker image name, e.g. nginx, python, ubuntu")
    image_tag: str = Field(default="latest", description="Docker image tag, default: latest")

    @field_validator("image_name")
    @classmethod
    def validate_image_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Image name cannot be empty")
        # Disallow shell metacharacters strictly
        if any(char in v for char in [";", "&", "|", "`", "$", "(", ")", "<", ">", "\n", "\r", " "]):
            raise ValueError("Image name contains invalid characters")
        if not IMAGE_NAME_REGEX.match(v):
            raise ValueError("Invalid Docker image name format")
        return v

    @field_validator("image_tag")
    @classmethod
    def validate_image_tag(cls, v: str) -> str:
        v = v.strip()
        if not v:
            v = "latest"
        if any(char in v for char in [";", "&", "|", "`", "$", "(", ")", "<", ">", "\n", "\r", " "]):
            raise ValueError("Image tag contains invalid characters")
        if not IMAGE_TAG_REGEX.match(v):
            raise ValueError("Invalid Docker image tag format")
        return v


class VulnerabilityResponse(BaseModel):
    id: int
    scan_id: int
    cve_id: str
    package_name: str
    installed_version: Optional[str] = None
    fixed_version: Optional[str] = None
    severity: str
    title: Optional[str] = None
    description: Optional[str] = None
    primary_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RecommendationItem(BaseModel):
    title: str
    category: str  # "BASE_IMAGE", "PACKAGE_UPGRADE", "DEPENDENCY", "SECURITY_HARDENING"
    severity_target: str  # "CRITICAL", "HIGH", "GENERAL"
    description: str
    suggested_action: str


class ScanResponse(BaseModel):
    id: int
    image_name: str
    image_tag: str
    scan_date: datetime
    scan_duration: float
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    unknown_count: int
    scan_status: str
    error_message: Optional[str] = None
    report_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ScanDetailResponse(ScanResponse):
    vulnerabilities: List[VulnerabilityResponse] = []
    recommendations: List[RecommendationItem] = []


class HealthResponse(BaseModel):
    status: str
    backend_running: bool
    docker_available: bool
    trivy_available: bool
    timestamp: datetime
    message: str


class SystemInfoResponse(BaseModel):
    project_name: str
    version: str
    host_os: str
    python_version: str
    docker_available: bool
    docker_version: Optional[str] = None
    docker_daemon_running: bool
    trivy_available: bool
    trivy_version: Optional[str] = None
    trivy_path: Optional[str] = None
    database_type: str
    database_path: str
    total_scans_recorded: int
    total_vulnerabilities_recorded: int
    github_repository: str


class DashboardStatsResponse(BaseModel):
    total_scans: int
    unique_images: int
    critical_vulnerabilities: int
    high_vulnerabilities: int
    medium_vulnerabilities: int
    low_vulnerabilities: int
    overall_status: str  # "SECURE", "WARNING", "CRITICAL", "NO_SCANS"
    severity_distribution: Dict[str, int]
    recent_scans: List[ScanResponse]
