import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.scan import Scan, Vulnerability

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_scan(db_session):
    scan = Scan(
        image_name="nginx",
        image_tag="1.25.0",
        scan_duration=4.25,
        total_vulnerabilities=3,
        critical_count=1,
        high_count=1,
        medium_count=1,
        low_count=0,
        unknown_count=0,
        scan_status="COMPLETED"
    )
    db_session.add(scan)
    db_session.commit()
    db_session.refresh(scan)

    v1 = Vulnerability(
        scan_id=scan.id,
        cve_id="CVE-2023-44487",
        package_name="nghttp2",
        installed_version="1.52.0-1",
        fixed_version="1.52.0-1+deb12u1",
        severity="CRITICAL",
        title="HTTP/2 Rapid Reset Attack",
        description="Denial of service through stream cancellation abuse.",
        primary_url="https://nvd.nist.gov/vuln/detail/CVE-2023-44487"
    )
    v2 = Vulnerability(
        scan_id=scan.id,
        cve_id="CVE-2023-38545",
        package_name="curl",
        installed_version="7.88.1-10",
        fixed_version="7.88.1-10+deb12u4",
        severity="HIGH",
        title="SOCKS5 heap buffer overflow",
        description="Heap buffer overflow in curl when using SOCKS5 proxy.",
        primary_url="https://nvd.nist.gov/vuln/detail/CVE-2023-38545"
    )
    v3 = Vulnerability(
        scan_id=scan.id,
        cve_id="CVE-2023-29491",
        package_name="ncurses",
        installed_version="6.4-4",
        fixed_version="6.4-4+deb12u1",
        severity="MEDIUM",
        title="Memory corruption in ncurses",
        description="Improper validation of terminal capability strings.",
        primary_url="https://nvd.nist.gov/vuln/detail/CVE-2023-29491"
    )
    db_session.add_all([v1, v2, v3])
    db_session.commit()
    return scan
