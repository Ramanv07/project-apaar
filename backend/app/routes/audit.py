from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.models.consent import ConsentRecord, ConsentStatus
from backend.app.models.student import StudentAdmission
from backend.app.models.user import User, UserRole
from backend.app.auth.dependencies import get_current_user, require_roles, record_audit
from backend.app.schemas.audit import AuditLogItem, ConsentRecordItem

router = APIRouter(prefix="/audit", tags=["Audit & Consent Ledger"])

@router.get("/logs", response_model=List[AuditLogItem])
def list_audit_logs(
    action: Optional[str] = None,
    role: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_roles([UserRole.AICTE_ADMIN, UserRole.AICTE_REGIONAL_OFFICER])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if role:
        query = query.filter(AuditLog.role == role)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return [
        AuditLogItem(
            id=l.id,
            timestamp=l.timestamp,
            username=l.username,
            role=l.role,
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            ip_address=l.ip_address,
            details=l.details_json or {}
        ) for l in logs
    ]

@router.get("/consent", response_model=List[ConsentRecordItem])
def list_consent_records(
    apaar_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ConsentRecord)
    if apaar_id:
        query = query.filter(ConsentRecord.apaar_id == apaar_id)
    if status:
        query = query.filter(ConsentRecord.status == status)

    records = query.order_by(ConsentRecord.granted_at.desc()).offset(offset).limit(limit).all()
    results = []

    for c in records:
        adm = db.query(StudentAdmission).filter(StudentAdmission.id == c.student_admission_id).first()
        results.append(ConsentRecordItem(
            id=c.id,
            apaar_id_masked=f"{c.apaar_id[:4]} **** {c.apaar_id[-4:]}",
            record_ref=adm.record_ref if adm else "N/A",
            purpose=c.purpose,
            status=c.status,
            granted_at=c.granted_at,
            revoked_at=c.revoked_at
        ))

    return results

@router.post("/consent/revoke/{consent_id}")
def revoke_consent(
    consent_id: str,
    db: Session = Depends(get_db)
):
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")

    consent.status = ConsentStatus.REVOKED
    consent.revoked_at = datetime.now(timezone.utc)
    db.commit()

    record_audit(
        db=db,
        user=None,
        action="REVOKE_DATA_CONSENT",
        entity_type="CONSENT_RECORD",
        entity_id=consent.id,
        details={
            "apaar_id": consent.apaar_id,
            "purpose": consent.purpose
        }
    )

    return {
        "status": "REVOKED",
        "consent_id": consent.id,
        "message": "Consent has been revoked. Third-party verifiers can no longer access this record."
    }
