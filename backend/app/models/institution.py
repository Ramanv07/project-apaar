import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class InstitutionStatus:
    COMPLIANT = "COMPLIANT"
    UNDER_REVIEW = "UNDER_REVIEW"
    FLAGGED = "FLAGGED"

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    aicte_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    state = Column(String(100), index=True, nullable=False)
    region = Column(String(50), index=True, nullable=False)
    address = Column(Text, nullable=False)
    nodal_officer_name = Column(String(150), nullable=False)
    nodal_officer_email = Column(String(150), nullable=False)
    nodal_officer_phone_masked = Column(String(20), nullable=False)
    
    status = Column(String(50), default=InstitutionStatus.COMPLIANT, nullable=False)
    review_score = Column(Integer, default=15, nullable=False)  # 0 (Low risk) to 100 (High risk)
    review_reasons = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="institution", foreign_keys="User.institution_id")
    programmes = relationship("Programme", back_populates="institution", cascade="all, delete-orphan")
    admissions = relationship("StudentAdmission", back_populates="institution", cascade="all, delete-orphan")


class Programme(Base):
    __tablename__ = "programmes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    programme_name = Column(String(100), nullable=False) # e.g. Engineering & Technology
    course_name = Column(String(150), nullable=False)    # e.g. B.Tech Computer Science & Engineering
    level = Column(String(20), nullable=False)           # UG, PG, DIPLOMA
    approved_intake = Column(Integer, nullable=False)    # e.g. 120
    supernumerary_cap_percent = Column(Float, default=15.0) # e.g. 15% (EWS 10% + TFW 5% + FN/OCI 15%)
    nri_quota_percent = Column(Float, default=5.0)
    is_nba_accredited = Column(Boolean, default=False)   # Required for supernumerary to NRI cascade
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("Institution", back_populates="programmes")
    admissions = relationship("StudentAdmission", back_populates="programme")
