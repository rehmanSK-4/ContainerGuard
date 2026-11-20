import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "ContainerGuard"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/containerguard.db")
    
    # Reports Storage
    REPORTS_DIR: Path = Path(os.getenv("REPORTS_DIR", str(BASE_DIR / "reports")))
    
    # Trivy Configuration
    TRIVY_PATH: str = os.getenv("TRIVY_PATH", "trivy")
    SCAN_TIMEOUT_SECONDS: int = int(os.getenv("SCAN_TIMEOUT_SECONDS", "300"))  # 5 minutes
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    model_config = {
        "env_file": ".env",
        "extra": "allow"
    }

settings = Settings()
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
