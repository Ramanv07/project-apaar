import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ConsentPurpose:
    ACADEMIC_ENROLMENT_VERIFICATION = "ACADEMIC_ENROLMENT_VERIFICATION"
    SCHOLARSHIP_VALIDATION = "SCHOLARSHIP_VALIDATION"
    EMPLOYER_BACKGROUND_CHECK = "EMPLOYER_BACKGROUND_CHECK"

class ConsentStatus:
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    apaar_id = Column(String(12), index=True, nullable=False)
    student_admission_id = Column(String(36), ForeignKey("student_admissions.id"), nullable=False)
    purpose = Column(String(100), nullable=False)
    status = Column(String(30), default=ConsentStatus.ACTIVE, nullable=False)
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    admission = relationship("StudentAdmission", back_populates="consent_records")
