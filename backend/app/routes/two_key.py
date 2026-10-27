from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.student import StudentAdmission, TwoKeyStatus
from backend.app.models.institution import Institution, Programme
from backend.app.models.consent import ConsentRecord, ConsentStatus
from backend.app.auth.dependencies import record_audit
from backend.app.schemas.admission import TwoKeyActionRequest

router = APIRouter(prefix="/two-key", tags=["Two-Key Confirmation"])

@router.get("/token/{token}")
def get_two_key_details(token: str, db: Session = Depends(get_db)):
    admission = db.query(StudentAdmission).filter(StudentAdmission.confirmation_token == token).first()
    if not admission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The confirmation security token is invalid or has expired."
        )

    inst = db.query(Institution).filter(Institution.id == admission.institution_id).first()
    prog = db.query(Programme).filter(Programme.id == admission.programme_id).first()

    return {
        "record_ref": admission.record_ref,
        "apaar_id_masked": f"{admission.apaar_id[:4]} **** {admission.apaar_id[-4:]}",
        "student_name": admission.student_name,
        "dob": admission.dob.isoformat(),
        "gender": admission.gender,
        "institution_name": inst.name if inst else "Unknown",
        "institution_state": inst.state if inst else "Unknown",
        "programme_name": prog.programme_name if prog else "Engineering & Technology",
        "course_name": prog.course_name if prog else "B.Tech",
        "year_of_admission": admission.year_of_admission,
        "admission_date": admission.admission_date.isoformat(),
        "category": admission.category,
        "quota_type": admission.quota_type,
        "two_key_status": admission.two_key_status,
        "confirmation_timestamp": admission.confirmation_timestamp.isoformat() if admission.confirmation_timestamp else None,
        "student_remarks": admission.student_remarks,
        "dispute_reason": admission.dispute_reason
    }

@router.post("/confirm")
def process_two_key_action(request: TwoKeyActionRequest, db: Session = Depends(get_db)):
    admission = db.query(StudentAdmission).filter(StudentAdmission.confirmation_token == request.token).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Invalid confirmation token")

    if admission.two_key_status == TwoKeyStatus.STUDENT_CONFIRMED:
        return {
            "status": "ALREADY_CONFIRMED",
            "message": "Enrolment has already been confirmed by the student.",
            "two_key_status": admission.two_key_status
        }

    now = datetime.now(timezone.utc)
    admission.confirmation_timestamp = now
    admission.student_remarks = request.student_remarks

    if request.confirm:
        admission.two_key_status = TwoKeyStatus.STUDENT_CONFIRMED
        action_name = "STUDENT_CONFIRM_ENROLMENT"
    else:
        admission.two_key_status = TwoKeyStatus.DISPUTED
        admission.dispute_reason = request.dispute_reason or "Student indicated discrepancy in admission details"
        action_name = "STUDENT_DISPUTE_ENROLMENT"
        
        # Revoke academic verification consent if student disputes
        consents = db.query(ConsentRecord).filter(ConsentRecord.student_admission_id == admission.id).all()
        for c in consents:
            c.status = ConsentStatus.REVOKED
            c.revoked_at = now

    db.commit()

    record_audit(
        db=db,
        user=None, # Public student action
        action=action_name,
        entity_type="STUDENT_ADMISSION",
        entity_id=admission.id,
        details={
            "apaar_id": admission.apaar_id,
            "record_ref": admission.record_ref,
            "action": "CONFIRM" if request.confirm else "DISPUTE",
            "dispute_reason": request.dispute_reason
        }
    )

    return {
        "status": "PROCESSED",
        "action": "CONFIRMED" if request.confirm else "DISPUTED",
        "two_key_status": admission.two_key_status,
        "message": "Your response has been verified and recorded on the National TrustSeat ledger."
    }
