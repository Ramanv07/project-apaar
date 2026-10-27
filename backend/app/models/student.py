import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, DateTime, Date, Integer, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class TwoKeyStatus:
    SUBMITTED = "SUBMITTED"
    STUDENT_CONFIRMED = "STUDENT_CONFIRMED"
    DISPUTED = "DISPUTED"
    UNCONFIRMED_GRACE_PERIOD = "UNCONFIRMED_GRACE_PERIOD"

class ValidationStatus:
    VALID = "VALID"
    WARNING = "WARNING"
    INVALID = "INVALID"

class StudentAdmission(Base):
    __tablename__ = "student_admissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_ref = Column(String(64), unique=True, index=True, nullable=False) # e.g. TS-2025-UP-00412
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    programme_id = Column(String(36), ForeignKey("programmes.id"), nullable=False, index=True)
    
    apaar_id = Column(String(12), index=True, nullable=False)
    student_name = Column(String(150), nullable=False)
    dob = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False) # Male, Female, Other
    year_of_admission = Column(Integer, nullable=False)
    admission_date = Column(Date, nullable=False)
    student_id_enrolment = Column(String(100), nullable=False) # Roll number / Enrolment ID
    
    mobile_hash = Column(String(64), index=True, nullable=False) # SHA-256
    mobile_masked = Column(String(20), nullable=False)           # +91 ******4321
    email_hash = Column(String(64), index=True, nullable=False)  # SHA-256
    email_masked = Column(String(100), nullable=False)          # r****@domain.com
    
    category = Column(String(50), nullable=False)    # GENERAL, OBC_NCL, SC, ST, EWS
    quota_type = Column(String(50), nullable=False)  # GENERAL, EWS, TFW, NRI, OCI, FN, CIWGC, MANAGEMENT, STATE_ALLOTMENT
    supernumerary_flag = Column(Boolean, default=False, nullable=False)
    
    # Two-Key Confirmation mechanism
    two_key_status = Column(String(50), default=TwoKeyStatus.SUBMITTED, nullable=False, index=True)
    confirmation_token = Column(String(64), unique=True, index=True, nullable=False)
    confirmation_timestamp = Column(DateTime, nullable=True)
    student_remarks = Column(Text, nullable=True)
    dispute_reason = Column(String(100), nullable=True)
    
    # Regulatory Rule Validation Output
    validation_status = Column(String(20), default=ValidationStatus.VALID, nullable=False)
    validation_findings = Column(JSON, default=list, nullable=False)
    
    # Review Flags (Shared contact clusters, allotment discrepancies, etc.)
    review_flags = Column(JSON, default=list, nullable=False)
    
    # Downstream academic credit / enrolment activity indicator
    downstream_activity_flag = Column(Boolean, default=True, nullable=False)
    
    # Manual resolution workflow for fuzzy name mismatches
    name_mismatch_resolved = Column(Boolean, default=False)
    resolution_officer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    institution = relationship("Institution", back_populates="admissions")
    programme = relationship("Programme", back_populates="admissions")
    consent_records = relationship("ConsentRecord", back_populates="admission", cascade="all, delete-orphan")
