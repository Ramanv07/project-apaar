import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, DateTime, Date, JSON, Text
from backend.app.database import Base

class QuotaPolicyRule(Base):
    __tablename__ = "quota_policy_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. AICTE-APH-2024-V1
    handbook_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True) # Null means currently active
    policy_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
