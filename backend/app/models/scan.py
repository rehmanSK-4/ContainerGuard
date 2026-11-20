from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    image_name = Column(String(255), nullable=False, index=True)
    image_tag = Column(String(128), nullable=False, default="latest")
    scan_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    scan_duration = Column(Float, default=0.0, nullable=False)  # in seconds
    
    total_vulnerabilities = Column(Integer, default=0, nullable=False)
    critical_count = Column(Integer, default=0, nullable=False)
    high_count = Column(Integer, default=0, nullable=False)
    medium_count = Column(Integer, default=0, nullable=False)
    low_count = Column(Integer, default=0, nullable=False)
    unknown_count = Column(Integer, default=0, nullable=False)
    
    scan_status = Column(String(32), default="COMPLETED", nullable=False)  # COMPLETED, FAILED, RUNNING
    error_message = Column(Text, nullable=True)
    report_path = Column(String(512), nullable=True)

    # Relationships
    vulnerabilities = relationship(
        "Vulnerability",
        back_populates="scan",
        cascade="all, delete-orphan",
        order_by="Vulnerability.id"
    )

    def __repr__(self):
        return f"<Scan {self.id}: {self.image_name}:{self.image_tag} ({self.scan_status})>"


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    
    cve_id = Column(String(100), nullable=False, index=True)
    package_name = Column(String(255), nullable=False)
    installed_version = Column(String(128), nullable=True)
    fixed_version = Column(String(128), nullable=True)
    severity = Column(String(32), nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN
    title = Column(String(512), nullable=True)
    description = Column(Text, nullable=True)
    primary_url = Column(String(1024), nullable=True)

    # Relationship
    scan = relationship("Scan", back_populates="vulnerabilities")

    def __repr__(self):
        return f"<Vulnerability {self.cve_id} in {self.package_name} ({self.severity})>"
