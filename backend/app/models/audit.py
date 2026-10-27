from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from backend.app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    username = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    institution_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True) # e.g. UPLOAD_ADMISSION, RESOLVE_MISMATCH, CONFIRM_TWO_KEY
    entity_type = Column(String(50), nullable=False)        # e.g. STUDENT_ADMISSION, POLICY, INSTITUTION
    entity_id = Column(String(64), nullable=False)
    ip_address = Column(String(50), default="127.0.0.1")
    details_json = Column(JSON, default=dict, nullable=False)
