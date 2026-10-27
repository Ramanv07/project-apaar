import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from backend.app.database import Base

class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_ref = Column(String(64), index=True, nullable=False)
    apaar_id = Column(String(12), index=True, nullable=False)
    verifier_name = Column(String(150), nullable=False)
    verifier_organization = Column(String(200), nullable=False)
    verification_purpose = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    ip_address = Column(String(50), default="127.0.0.1")
    signed_token = Column(Text, nullable=False)
