from app.services.trivy import parse_trivy_json

def test_parse_trivy_json_with_vulnerabilities():
    sample_trivy_output = {
        "SchemaVersion": 2,
        "ArtifactName": "nginx:1.24",
        "Results": [
            {
                "Target": "nginx:1.24 (debian 12.0)",
                "Class": "os-pkgs",
                "Type": "debian",
                "Vulnerabilities": [
                    {
                        "VulnerabilityID": "CVE-2023-44487",
                        "PkgName": "nghttp2",
                        "InstalledVersion": "1.52.0-1",
                        "FixedVersion": "1.52.0-1+deb12u1",
                        "Severity": "CRITICAL",
                        "Title": "HTTP/2 Rapid Reset",
                        "Description": "Denial of service attack vector.",
                        "PrimaryURL": "https://avd.aquasec.com/nvd/cve-2023-44487"
                    },
                    {
                        "VulnerabilityID": "CVE-2023-38545",
                        "PkgName": "curl",
                        "InstalledVersion": "7.88.1-10",
                        "FixedVersion": "7.88.1-10+deb12u4",
                        "Severity": "HIGH",
                        "Title": "SOCKS5 heap buffer overflow",
                        "Description": "Heap overflow in curl.",
                        "PrimaryURL": "https://avd.aquasec.com/nvd/cve-2023-38545"
                    },
                    {
                        "VulnerabilityID": "CVE-2023-0001",
                        "PkgName": "libssl3",
                        "InstalledVersion": "3.0.9-1",
                        "FixedVersion": None,
                        "Severity": "LOW",
                        "Title": "Low risk crypto bug",
                        "Description": "Minor information disclosure.",
                        "PrimaryURL": "https://avd.aquasec.com/nvd/cve-2023-0001"
                    }
                ]
            }
        ]
    }

    vulns, counts = parse_trivy_json(sample_trivy_output)

    assert len(vulns) == 3
    assert counts["TOTAL"] == 3
    assert counts["CRITICAL"] == 1
    assert counts["HIGH"] == 1
    assert counts["LOW"] == 1
    assert counts["MEDIUM"] == 0
    assert counts["UNKNOWN"] == 0

    # Ensure sorting: CRITICAL appears first
    assert vulns[0]["severity"] == "CRITICAL"
    assert vulns[0]["cve_id"] == "CVE-2023-44487"
    assert vulns[1]["severity"] == "HIGH"
    assert vulns[2]["severity"] == "LOW"

def test_parse_trivy_json_clean_image():
    empty_trivy_output = {
        "SchemaVersion": 2,
        "ArtifactName": "alpine:3.19",
        "Results": [
            {
                "Target": "alpine:3.19 (alpine 3.19.1)",
                "Class": "os-pkgs",
                "Type": "alpine"
                # No Vulnerabilities key
            }
        ]
    }

    vulns, counts = parse_trivy_json(empty_trivy_output)
    assert len(vulns) == 0
    assert counts["TOTAL"] == 0
    assert counts["CRITICAL"] == 0
    assert counts["HIGH"] == 0

def test_parse_trivy_deduplication():
    duplicate_output = {
        "Results": [
            {
                "Target": "layer1",
                "Vulnerabilities": [
                    {
                        "VulnerabilityID": "CVE-2024-1111",
                        "PkgName": "glibc",
                        "Severity": "CRITICAL"
                    }
                ]
            },
            {
                "Target": "layer2",
                "Vulnerabilities": [
                    {
                        "VulnerabilityID": "CVE-2024-1111",
                        "PkgName": "glibc",
                        "Severity": "CRITICAL"
                    }
                ]
            }
        ]
    }
    vulns, counts = parse_trivy_json(duplicate_output)
    assert len(vulns) == 1
    assert counts["TOTAL"] == 1
