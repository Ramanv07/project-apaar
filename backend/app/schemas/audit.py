from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class AuditLogItem(BaseModel):
    id: int
    timestamp: datetime
    username: str
    role: str
    action: str
    entity_type: str
    entity_id: str
    ip_address: str
    details: Dict[str, Any]

class AuditQueryFilter(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    institution_id: Optional[str] = None
    limit: int = 100
    offset: int = 0

class ConsentRecordItem(BaseModel):
    id: str
    apaar_id_masked: str
    record_ref: str
    purpose: str
    status: str
    granted_at: datetime
    revoked_at: Optional[datetime] = None
