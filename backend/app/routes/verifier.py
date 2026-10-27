import secrets
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.student import StudentAdmission, TwoKeyStatus
from backend.app.models.institution import Institution, Programme
from backend.app.models.verification import VerificationLog
from backend.app.models.consent import ConsentRecord, ConsentStatus
from backend.app.auth.dependencies import record_audit
from backend.app.schemas.verification import (
    VerifyLookupRequest,
    VerificationResultResponse,
    VerifierAccessLogItem
)

router = APIRouter(prefix="/verify", tags=["Credential Verification"])

def generate_signed_token(record_ref: str, apaar_id: str, timestamp_str: str) -> str:
    raw = f"{record_ref}:{apaar_id}:{timestamp_str}:AICTE_TRUSTSEAT_ROOT"
    return "TS-SIG-" + hashlib.sha256(raw.encode()).hexdigest()[:32].upper()

def get_student_initials(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}. {parts[-1][0]}."
    elif len(parts) == 1:
        return f"{parts[0][0]}."
    return "S."

@router.post("/credential", response_model=VerificationResultResponse)
def verify_credential(request: VerifyLookupRequest, db: Session = Depends(get_db)):
    query = db.query(StudentAdmission)
    if request.record_ref:
        query = query.filter(StudentAdmission.record_ref == request.record_ref.strip())
    elif request.apaar_id:
        query = query.filter(StudentAdmission.apaar_id == request.apaar_id.strip())
    else:
        raise HTTPException(status_code=400, detail="Either record reference or APAAR ID must be provided")

    admission = query.first()
    if not admission:
        raise HTTPException(status_code=404, detail="No student admission record matches the provided identifier")

    inst = db.query(Institution).filter(Institution.id == admission.institution_id).first()
    prog = db.query(Programme).filter(Programme.id == admission.programme_id).first()

    now = datetime.now(timezone.utc)
    now_str = now.isoformat()
    signed_sig = generate_signed_token(admission.record_ref, admission.apaar_id, now_str)

    # Log verification access
    log_entry = VerificationLog(
        record_ref=admission.record_ref,
        apaar_id=admission.apaar_id,
        verifier_name=request.verifier_name,
        verifier_organization=request.verifier_organization,
        verification_purpose=request.verification_purpose,
        timestamp=now,
        signed_token=signed_sig
    )
    db.add(log_entry)
    db.commit()

    record_audit(
        db=db,
        user=None,
        action="VERIFY_CREDENTIAL_LOOKUP",
        entity_type="STUDENT_ADMISSION",
        entity_id=admission.id,
        details={
            "record_ref": admission.record_ref,
            "verifier_organization": request.verifier_organization,
            "purpose": request.verification_purpose
        }
    )

    # Fetch recent verification logs for student transparency
    recent_logs = db.query(VerificationLog).filter(
        VerificationLog.record_ref == admission.record_ref
    ).order_by(VerificationLog.timestamp.desc()).limit(5).all()

    recent_pydantic = [
        VerifierAccessLogItem(
            timestamp=l.timestamp,
            verifier_organization=l.verifier_organization,
            verification_purpose=l.verification_purpose
        ) for l in recent_logs
    ]

    enrolled_status_text = "Active Enrolment Verified"
    if admission.two_key_status == TwoKeyStatus.DISPUTED:
        enrolled_status_text = "Enrolment Disputed by Student"
    elif admission.two_key_status == TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD:
        enrolled_status_text = "Active Enrolment (Two-Key Confirmation Pending)"

    # SVG QR code data URI mock
    qr_data_uri = f"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='120' height='120' fill='white'/><rect x='10' y='10' width='30' height='30' fill='%231B2A49'/><rect x='80' y='10' width='30' height='30' fill='%231B2A49'/><rect x='10' y='80' width='30' height='30' fill='%231B2A49'/><text x='60' y='65' font-size='10' font-family='sans-serif' text-anchor='middle' fill='%231B2A49'>TRUSTSEAT</text></svg>"

    return VerificationResultResponse(
        is_valid=admission.two_key_status != TwoKeyStatus.DISPUTED,
        record_ref=admission.record_ref,
        enrolled_status=enrolled_status_text,
        programme_name=prog.programme_name if prog else "Engineering & Technology",
        course_name=prog.course_name if prog else "B.Tech",
        institution_name=inst.name if inst else "AICTE Approved Institution",
        institution_state=inst.state if inst else "India",
        year_of_admission=admission.year_of_admission,
        admission_date=admission.admission_date.isoformat(),
        apaar_id_masked=f"{admission.apaar_id[:4]} **** {admission.apaar_id[-4:]}",
        student_initials=get_student_initials(admission.student_name),
        signed_token=signed_sig,
        verification_timestamp=now,
        qr_data_uri=qr_data_uri,
        recent_verifications=recent_pydantic
    )


@router.get("/certificate/{record_ref}")
def get_certificate_data(record_ref: str, db: Session = Depends(get_db)):
    admission = db.query(StudentAdmission).filter(StudentAdmission.record_ref == record_ref).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Certificate reference not found")

    inst = db.query(Institution).filter(Institution.id == admission.institution_id).first()
    prog = db.query(Programme).filter(Programme.id == admission.programme_id).first()

    now_str = datetime.now(timezone.utc).isoformat()
    signed_sig = generate_signed_token(admission.record_ref, admission.apaar_id, now_str)

    return {
        "record_ref": admission.record_ref,
        "apaar_id": admission.apaar_id,
        "apaar_id_masked": f"{admission.apaar_id[:4]} **** {admission.apaar_id[-4:]}",
        "student_name": admission.student_name,
        "student_id_enrolment": admission.student_id_enrolment,
        "dob": admission.dob.isoformat(),
        "institution_name": inst.name if inst else "Unknown",
        "aicte_id": inst.aicte_id if inst else "1-00000000",
        "institution_address": inst.address if inst else "India",
        "programme_name": prog.programme_name if prog else "Engineering",
        "course_name": prog.course_name if prog else "B.Tech",
        "year_of_admission": admission.year_of_admission,
        "admission_date": admission.admission_date.isoformat(),
        "two_key_status": admission.two_key_status,
        "signed_token": signed_sig,
        "issued_timestamp": now_str,
        "verify_url": f"/verify?ref={admission.record_ref}"
    }
