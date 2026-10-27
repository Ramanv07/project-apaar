from typing import List, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.auth.security import decode_access_token
from backend.app.models.user import User, UserRole
from backend.app.models.audit import AuditLog

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing identifier"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account deactivated"
        )
    
    return user


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User role '{current_user.role}' lacks permission for this administrative action"
            )
        return current_user
    return role_checker


def record_audit(
    db: Session,
    user: Optional[User],
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict,
    ip_address: str = "127.0.0.1"
):
    audit_entry = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else "SYSTEM_AUTOMATION",
        role=user.role if user else "SYSTEM",
        institution_id=user.institution_id if user and user.institution_id else (details.get("institution_id") if isinstance(details, dict) else None),
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        ip_address=ip_address,
        details_json=details
    )
    db.add(audit_entry)
    db.commit()
