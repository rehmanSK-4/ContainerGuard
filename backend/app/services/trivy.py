import os
import shutil
import subprocess
import json
import time
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class TrivyNotInstalledError(Exception):
    """Raised when Trivy executable cannot be located."""
    pass

class DockerUnavailableError(Exception):
    """Raised when Docker is required but not available."""
    pass

class TrivyScanError(Exception):
    """Raised when Trivy fails during image scanning."""
    pass


def find_executable(name: str, candidate_paths: List[str] = None) -> Optional[str]:
    """Locate an executable in PATH or standard install locations."""
    path = shutil.which(name)
    if path:
        return path
    
    if candidate_paths is None:
        candidate_paths = [
            f"/usr/local/bin/{name}",
            f"/opt/homebrew/bin/{name}",
            f"/usr/bin/{name}",
            f"{os.path.expanduser('~')}/.local/bin/{name}",
            f"{os.path.expanduser('~')}/bin/{name}"
        ]
    
    for candidate in candidate_paths:
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
            
    return None


def get_trivy_path() -> Optional[str]:
    """Returns the resolved path to trivy executable, or None."""
    if settings.TRIVY_PATH and settings.TRIVY_PATH != "trivy":
        if os.path.isfile(settings.TRIVY_PATH) and os.access(settings.TRIVY_PATH, os.X_OK):
            return settings.TRIVY_PATH
    return find_executable("trivy")


def get_docker_path() -> Optional[str]:
    """Returns the resolved path to docker executable, or None."""
    return find_executable("docker")


def is_trivy_installed() -> bool:
    return get_trivy_path() is not None


def get_trivy_version() -> Optional[str]:
    path = get_trivy_path()
    if not path:
        return None
    try:
        res = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            # First line usually contains "Version: 0.x.x"
            first_line = res.stdout.strip().split("\n")[0]
            return first_line
    except Exception as e:
        logger.warning(f"Error checking Trivy version: {e}")
    return None


def is_docker_installed() -> bool:
    return get_docker_path() is not None


def is_docker_daemon_running() -> bool:
    path = get_docker_path()
    if not path:
        return False
    try:
        res = subprocess.run([path, "info"], capture_output=True, text=True, timeout=5)
        return res.returncode == 0
    except Exception:
        return False


def get_docker_version() -> Optional[str]:
    path = get_docker_path()
    if not path:
        return None
    try:
        res = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            return res.stdout.strip()
    except Exception as e:
        logger.warning(f"Error checking Docker version: {e}")
    return None


def parse_trivy_json(data: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    Parses Trivy's JSON output structure and returns:
    (vulnerabilities_list, severity_counts)
    """
    results = data.get("Results", [])
    vulnerabilities = []
    severity_counts = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "UNKNOWN": 0,
        "TOTAL": 0
    }

    seen_cves = set()

    for result in results:
        raw_vulns = result.get("Vulnerabilities") or []
        for v in raw_vulns:
            cve_id = v.get("VulnerabilityID", "N/A")
            pkg_name = v.get("PkgName", "Unknown")
            
            # Deduplicate by (cve_id, pkg_name) to avoid duplicate records if scanned in multiple layers
            key = (cve_id, pkg_name)
            if key in seen_cves:
                continue
            seen_cves.add(key)

            raw_severity = (v.get("Severity") or "UNKNOWN").upper()
            if raw_severity not in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]:
                raw_severity = "UNKNOWN"

            severity_counts[raw_severity] += 1
            severity_counts["TOTAL"] += 1

            vulnerabilities.append({
                "cve_id": cve_id,
                "package_name": pkg_name,
                "installed_version": v.get("InstalledVersion"),
                "fixed_version": v.get("FixedVersion"),
                "severity": raw_severity,
                "title": v.get("Title") or v.get("VulnerabilityID"),
                "description": v.get("Description") or "No description provided by vulnerability advisory.",
                "primary_url": v.get("PrimaryURL") or (f"https://nvd.nist.gov/vuln/detail/{cve_id}" if cve_id.startswith("CVE-") else None)
            })

    # Sort vulnerabilities by severity importance (CRITICAL -> HIGH -> MEDIUM -> LOW -> UNKNOWN)
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "UNKNOWN": 4}
    vulnerabilities.sort(key=lambda x: (severity_order.get(x["severity"], 5), x["package_name"]))

    return vulnerabilities, severity_counts


def run_trivy_scan(image_name: str, image_tag: str) -> Dict[str, Any]:
    """
    Executes actual Trivy vulnerability scan against a target container image.
    Uses safe subprocess invocation with no shell=True.
    """
    trivy_bin = get_trivy_path()
    if not trivy_bin:
        raise TrivyNotInstalledError(
            "Trivy executable is not installed or not found in system PATH. "
            "Please install Trivy to scan images:\n"
            "  • macOS: brew install trivy\n"
            "  • Linux: apt-get install trivy\n"
            "  • Or run ContainerGuard via Docker Compose where Trivy is pre-installed."
        )

    full_image = f"{image_name}:{image_tag}"
    safe_image_slug = full_image.replace("/", "_").replace(":", "_")
    timestamp_slug = int(time.time())
    output_filename = f"trivy_report_{safe_image_slug}_{timestamp_slug}.json"
    output_path = settings.REPORTS_DIR / output_filename

    # Build safe command args (No shell=True)
    cmd = [
        trivy_bin,
        "image",
        "--format", "json",
        "--quiet",
        "--output", str(output_path),
        full_image
    ]

    logger.info(f"Executing Trivy scan: {' '.join(cmd)}")
    start_time = time.time()

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=settings.SCAN_TIMEOUT_SECONDS
        )
    except subprocess.TimeoutExpired:
        if output_path.exists():
            output_path.unlink()
        raise TrivyScanError(
            f"Trivy scan timed out after {settings.SCAN_TIMEOUT_SECONDS} seconds for image '{full_image}'."
        )
    except Exception as e:
        if output_path.exists():
            output_path.unlink()
        raise TrivyScanError(f"Failed to execute Trivy subprocess: {str(e)}")

    duration = round(time.time() - start_time, 2)

    # Trivy returns 0 on success. If output file does not exist or exit code != 0, examine error.
    if result.returncode != 0 or not output_path.exists():
        stderr_msg = result.stderr.strip() or result.stdout.strip()
        logger.error(f"Trivy scan failed (exit code {result.returncode}): {stderr_msg}")
        
        # Provide helpful diagnosis
        if "cannot connect to the Docker daemon" in stderr_msg.lower():
            err = "Docker daemon is not running. Please start Docker Desktop or ensure the Docker daemon is active."
        elif "pull access denied" in stderr_msg.lower() or "not found" in stderr_msg.lower():
            err = f"Image '{full_image}' not found or pull access denied. Verify the image name and repository permissions."
        elif "database" in stderr_msg.lower() and "download" in stderr_msg.lower():
            err = "Trivy vulnerability database could not be downloaded. Check your internet connection or proxy settings."
        else:
            err = f"Trivy scan error: {stderr_msg or 'Unknown scanner error'}"
        
        raise TrivyScanError(err)

    try:
        with open(output_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
    except Exception as e:
        raise TrivyScanError(f"Failed to parse Trivy output JSON: {str(e)}")

    vulnerabilities, severity_counts = parse_trivy_json(raw_data)

    return {
        "image_name": image_name,
        "image_tag": image_tag,
        "scan_duration": duration,
        "raw_report_file": str(output_path),
        "vulnerabilities": vulnerabilities,
        "severity_counts": severity_counts,
        "raw_data": raw_data
    }
