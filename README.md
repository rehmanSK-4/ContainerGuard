# ContainerGuard – Automated Container Vulnerability & Security Inspector

ContainerGuard is a modern DevSecOps platform engineered to scan Docker container images for CVE vulnerabilities using Aqua Security's Trivy engine. It bridges an automated FastAPI backend with a dark-themed React security dashboard, generating persistent audit logs and downloadable reports in JSON, HTML, and PDF formats.

---

## 1. Project Introduction

In cloud-native software engineering, containers form the foundational runtime unit for microservices. ContainerGuard provides continuous container image security posture assessment, enabling development and security teams to detect, triage, and remediate known vulnerabilities before containers reach production clusters.

---

## 2. Problem Statement

Modern container images frequently bundle hundreds of third-party system libraries, language dependencies, and operating system packages. When base images are left uninspected or outdated:
- Known Common Vulnerabilities and Exposures (CVEs) accumulate silently.
- Attackers exploit known vulnerabilities (such as remote code execution or privilege escalation).
- Manual command-line inspection using raw CLI output is cumbersome for developer workflows and lacks persistent audit history or downloadable executive reports.

---

## 3. Proposed Solution

ContainerGuard solves container vulnerability sprawl by combining:
1. **Automated Subprocess Scanner**: Executes real Trivy scans securely with strict input validation, preventing command injection without simulating results.
2. **Persistent Audit History**: Stores scan metadata and normalized CVE findings in a structured SQLite database via SQLAlchemy.
3. **Enterprise DevSecOps UI**: A clean, dark-navy dashboard inspired by modern cybersecurity SaaS tools (Grafana, Linear, Vercel) featuring charts, search, and severity filters.
4. **Multi-Format Reporting**: One-click generation of JSON, standalone HTML, and printable PDF reports.
5. **CI/CD Integration**: Pre-configured GitHub Actions workflow enforcing automated vulnerability break-glass thresholds.

---

## 4. Project Objectives

- Provide a reliable, non-mocked vulnerability scanning pipeline for local and remote container images.
- Offer actionable remediation recommendations based on real scan findings (e.g., fixed package versions, minimal base images, non-root users).
- Provide immediate system diagnostics indicating Trivy CLI and Docker daemon availability.
- Ship a production-ready containerized deployment using Docker Compose.

---

## 5. Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom dark-navy cybersecurity palette)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Donut & Bar charts)
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **ASGI Server**: Uvicorn
- **Validation**: Pydantic v2
- **Database & ORM**: SQLite 3 with SQLAlchemy 2.0
- **Document Generation**: ReportLab (PDF export)
- **Testing**: Pytest & HTTPX TestClient

### Security & CI/CD
- **Vulnerability Scanner**: Aqua Security Trivy CLI
- **Container Runtime**: Docker & Docker Compose
- **Pipeline**: GitHub Actions (`security-scan.yml`)

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Web Browser                           │
│  React 18 + Vite + TypeScript + Tailwind CSS (Port 5173/80) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 ContainerGuard FastAPI Backend               │
│  - Input Sanitization & Image Reference Validation           │
│  - System Health & Tooling Checker (Docker / Trivy)          │
│  - Report Exporters (JSON / HTML / ReportLab PDF)            │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        Subprocess Call                 SQLAlchemy ORM
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│       Aqua Trivy CLI         │ │     SQLite Database         │
│  - Inspects layers & pkgs    │ │  - Table: scans             │
│  - Queries Aqua Advisory DB  │ │  - Table: vulnerabilities   │
│  - Returns structured JSON   │ └─────────────────────────────┘
└──────────────┬───────────────┘
               │ Socket Mount (/var/run/docker.sock)
               ▼
┌──────────────────────────────┐
│     Host Docker Daemon       │
│  (For scanning local images) │
└──────────────────────────────┘
```

---

## 7. Project Folder Structure

```
containerguard/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Charts/         # Recharts Donut & Bar components
│   │   │   ├── Common/         # Badges, Cards, Modals, Empty states
│   │   │   └── Layout/         # Header & Sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx   # Metrics overview & charts
│   │   │   ├── ScanImage.tsx   # Scanning form & real-time progress
│   │   │   ├── ScanResults.tsx # CVE table, search, filters & advice
│   │   │   ├── ScanHistory.tsx # Audit log & record deletion
│   │   │   ├── Reports.tsx     # JSON, HTML & PDF export center
│   │   │   └── Settings.tsx    # Diagnostics & tool installation guide
│   │   ├── services/           # Axios API client
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Root state router
│   │   └── main.tsx            # Vite entry point
│   ├── public/
│   ├── nginx.conf              # Production Nginx reverse-proxy
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── api/                # Health, Scans, Reports, System endpoints
│   │   ├── core/               # Configuration settings
│   │   ├── models/             # SQLAlchemy Scan & Vulnerability models
│   │   ├── schemas/            # Pydantic validation models
│   │   ├── services/           # Trivy scanner, recommendations, reports
│   │   ├── database.py         # Engine & session initialization
│   │   └── main.py             # FastAPI entry point & CORS
│   ├── reports/                # Storage for generated report artifacts
│   ├── tests/                  # Pytest test suite (15 unit/api tests)
│   ├── requirements.txt
│   └── Dockerfile
│
├── .github/
│   └── workflows/
│       └── security-scan.yml   # CI/CD security gate & Trivy scan
│
├── docker-compose.yml          # Containerized orchestration
├── .dockerignore
├── .gitignore
├── .env.example
├── LICENSE
└── README.md
```

---

## 8. Prerequisites

Ensure you have the following installed on your host machine:
- **Python**: version 3.11 or higher
- **Node.js**: version 18 or higher (v20+ recommended)
- **Git**
- **Homebrew** (on macOS)

---

## 9. Installation Instructions for macOS

Clone the repository and enter the project folder:
```bash
cd "devops minProject"
```

---

## 10. How to Install Docker

To scan images from your local cache and run multi-container setups:

1. Install Docker Desktop for Mac via Homebrew:
   ```bash
   brew install --cask docker
   ```
2. Launch Docker from `/Applications/Docker.app` and complete the initial setup.
3. Verify that the Docker CLI and daemon are operational:
   ```bash
   docker --version
   docker info
   ```

---

## 11. How to Install Trivy

ContainerGuard connects to the official Aqua Trivy CLI:

1. Install Trivy using Homebrew:
   ```bash
   brew install trivy
   ```
2. Verify Trivy is in your system PATH:
   ```bash
   trivy --version
   ```

*(Note: If you run ContainerGuard via Docker Compose, Trivy is already pre-installed inside the backend container!)*

---

## 12. How to Run the Backend Locally

1. Create a Python virtual environment and activate it:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run automated tests to verify your setup:
   ```bash
   PYTHONPATH=. pytest tests -v
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

The backend API will be available at:
- **API Root**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

## 13. How to Run the Frontend Locally

1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

Open your browser at `http://localhost:5173`. The frontend automatically proxies API calls to `http://localhost:8000`.

---

## 14. How to Run Using Docker Compose

Docker Compose runs both the backend (with Trivy pre-installed) and frontend (served via Nginx) in unified containers:

```bash
docker compose up --build
```

### Access Points:
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api`
- **Swagger Documentation**: `http://localhost:8000/docs`

> **Security Notice**: `docker-compose.yml` mounts `/var/run/docker.sock` to enable inspecting local images. This is intended strictly for trusted local development environments. Do not expose this port or socket on public infrastructure.

---

## 15. How to Scan a Docker Image

1. In the web dashboard, navigate to **Scan Image** from the sidebar or click **New Scan**.
2. Enter the target container image name (e.g. `nginx`, `python`, `ubuntu`) or click one of the quick presets.
3. Specify the image tag (default: `latest`).
4. Click **Start Scan**.
5. ContainerGuard executes Trivy safely, records findings into SQLite, and displays results in the **Vulnerabilities** view.

---

## 16. How to Download Reports

1. From the **Vulnerabilities** page, or directly inside the **Reports** section:
   - **JSON**: Click the **JSON** button to download the machine-readable audit payload.
   - **HTML**: Click the **HTML** button to download a self-contained, printable dark-themed report.
   - **PDF**: Click **PDF Export** to download an executive audit certificate generated with ReportLab.

---

## 17. GitHub Actions Workflow Explanation

The workflow file `.github/workflows/security-scan.yml` provides automated DevSecOps validation:

1. **Backend Tests Job**: Runs `pytest` across all endpoints and Trivy parser routines.
2. **Frontend Build Job**: Compiles TypeScript and packages Vite assets.
3. **Container Security Scan Job**:
   - Builds the backend Docker image using Buildx.
   - Executes `aquasecurity/trivy-action` in JSON mode and saves findings.
   - Executes Trivy with `--exit-code 1` against the configured severity threshold (default: `CRITICAL`).
   - Uploads the security report as a 30-day workflow artifact.
   - Fails the pull request if unpatched critical vulnerabilities are detected.

---

## 18. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns backend, Docker, and Trivy readiness status |
| `POST` | `/api/scan` | Validates image and triggers a live Trivy scan |
| `GET` | `/api/scans` | Lists complete scan history ordered by date |
| `GET` | `/api/scans/{id}` | Fetches detailed findings and security recommendations |
| `DELETE` | `/api/scans/{id}` | Deletes a scan record and its associated reports |
| `GET` | `/api/scans/{id}/report/json` | Downloads audit report in JSON format |
| `GET` | `/api/scans/{id}/report/html` | Downloads standalone HTML security report |
| `GET` | `/api/scans/{id}/report/pdf` | Downloads executive PDF audit report |
| `GET` | `/api/system/info` | Returns runtime versions and database metrics |
| `GET` | `/api/dashboard/stats` | Computes aggregate severity distribution and recent scans |

---

## 19. Screenshots Section

*(Screenshots can be captured directly from your local deployment)*

1. **Dashboard Overview**: Summary statistics cards, Donut chart, Bar chart, and recent scan activities.
2. **Scan Interface**: Input form with validation, preset chips, and animated scan progress tracker.
3. **Scan Results**: CVE findings table with severity badges, search filter, and expandable advisories.
4. **Reports Hub**: One-click download actions for JSON, HTML, and ReportLab PDF formats.
5. **System Settings**: Real-time status indicators for Docker daemon, Trivy CLI, and database records.

---

## 20. Future Enhancements

- Support for private container registries (AWS ECR, Azure ACR, Google Artifact Registry) with IAM authentication.
- Scheduled recurring scans for deployed Kubernetes workloads.
- Automated Slack and Microsoft Teams webhook alerts when critical CVEs emerge.
- Software Bill of Materials (SBOM) generation in CycloneDX and SPDX formats.
- Integration with Jira and GitHub Issues to auto-file remediation tickets.

---

## License

This project is released under the [MIT License](LICENSE).
## Development Workflow

ContainerGuard uses Git feature branches for development.

- main: Stable application branch.
- feature/auth-update: Feature development branch.