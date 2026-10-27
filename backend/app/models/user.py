import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class UserRole:
    AICTE_ADMIN = "AICTE_ADMIN"
    AICTE_REGIONAL_OFFICER = "AICTE_REGIONAL_OFFICER"
    INSTITUTION_NODAL_OFFICER = "INSTITUTION_NODAL_OFFICER"
    STUDENT = "STUDENT"
    VERIFIER = "VERIFIER"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    region = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("Institution", back_populates="users", foreign_keys=[institution_id])
