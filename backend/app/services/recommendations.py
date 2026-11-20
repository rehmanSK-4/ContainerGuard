from typing import List, Dict, Any
from app.schemas.scan import RecommendationItem

def generate_recommendations(
    image_name: str,
    image_tag: str,
    vulnerabilities: List[Dict[str, Any]],
    critical_count: int,
    high_count: int,
    total_count: int
) -> List[RecommendationItem]:
    recommendations: List[RecommendationItem] = []

    # 1. Clean image
    if total_count == 0:
        recommendations.append(RecommendationItem(
            title="Image is Clean",
            category="SECURITY_HARDENING",
            severity_target="GENERAL",
            description=f"No known CVE vulnerabilities were detected in {image_name}:{image_tag} by Trivy.",
            suggested_action="Maintain regular automated scans in CI/CD and pin base image digests to guard against upstream drifts."
        ))
        recommendations.append(RecommendationItem(
            title="Enforce Principle of Least Privilege",
            category="SECURITY_HARDENING",
            severity_target="GENERAL",
            description="Ensure the container executes under a dedicated non-root user (e.g. UID 10001).",
            suggested_action="Add 'USER appuser' to your Dockerfile and drop Linux capabilities (cap-drop=ALL)."
        ))
        return recommendations

    # 2. Critical CVEs
    if critical_count > 0:
        critical_cves = [v["cve_id"] for v in vulnerabilities if v.get("severity") == "CRITICAL"][:5]
        critical_str = ", ".join(critical_cves)
        recommendations.append(RecommendationItem(
            title=f"Remediate {critical_count} Critical Severity CVE(s) Immediately",
            category="PACKAGE_UPGRADE",
            severity_target="CRITICAL",
            description=f"Critical vulnerabilities (such as {critical_str}) present imminent security exposure, including potential remote code execution or privilege escalation.",
            suggested_action="Prioritize patching these packages to their designated fixed versions or replace affected libraries."
        ))

    # 3. Fixable vulnerabilities
    fixable = [v for v in vulnerabilities if v.get("fixed_version")]
    if fixable:
        fixable_packages = sorted(list(set(v["package_name"] for v in fixable)))[:6]
        pkg_list = ", ".join(fixable_packages)
        pct = int((len(fixable) / total_count) * 100) if total_count > 0 else 0
        recommendations.append(RecommendationItem(
            title=f"Apply Available Security Patches ({pct}% fixable)",
            category="PACKAGE_UPGRADE",
            severity_target="HIGH" if high_count > 0 else "GENERAL",
            description=f"{len(fixable)} out of {total_count} vulnerabilities have vendor-provided security patches ready for deployment. Affected packages include: {pkg_list}.",
            suggested_action="Rebuild your container using updated package manager dependencies (e.g. 'apt-get update && apt-get upgrade -y' or update lockfiles)."
        ))

    # 4. Base Image Optimization
    if total_count >= 10 or ("ubuntu" in image_name.lower() or "debian" in image_name.lower() or "centos" in image_name.lower()):
        recommendations.append(RecommendationItem(
            title="Switch to Minimal or Distroless Base Images",
            category="BASE_IMAGE",
            severity_target="GENERAL",
            description="Full OS images bundle package managers, shells, and system utilities that expand attack surfaces.",
            suggested_action="Consider migrating to Alpine Linux, Google Distroless ('gcr.io/distroless/static'), or official '-slim' and '-alpine' variants."
        ))

    # 5. Build Hardening & Dependency Pinning
    if image_tag == "latest":
        recommendations.append(RecommendationItem(
            title="Pin Specific Image Version or Digest",
            category="SECURITY_HARDENING",
            severity_target="HIGH",
            description="Using the ':latest' tag can introduce unverified upstream changes and non-deterministic production deployments.",
            suggested_action=f"Pin {image_name} to a specific immutable semantic version or SHA256 digest in your Dockerfiles and deployment manifests."
        ))

    # 6. Multi-stage build hygiene
    recommendations.append(RecommendationItem(
        title="Implement Multi-Stage Docker Builds",
        category="SECURITY_HARDENING",
        severity_target="GENERAL",
        description="Exclude build compilers, test frameworks, and development headers from runtime container images.",
        suggested_action="Use a multi-stage Dockerfile where the final stage copies only compiled artifacts and runtime dependencies."
    ))

    return recommendations
