import uuid
import secrets
from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.student import StudentAdmission, TwoKeyStatus, ValidationStatus
from backend.app.models.institution import Institution, Programme
from backend.app.models.user import User, UserRole
from backend.app.models.consent import ConsentRecord, ConsentPurpose, ConsentStatus
from backend.app.auth.dependencies import get_current_user, require_roles, record_audit
from backend.app.engine.validation_engine import (
    validate_single_admission_record,
    hash_identifier,
    mask_mobile,
    mask_email
)
from backend.app.adapters.confirmation_channel import confirmation_channel_adapter
from backend.app.schemas.admission import (
    AdmissionRecordInput,
    DryRunResponse,
    DryRunRowResult,
    ValidationFinding,
    SubmitAdmissionsRequest,
    AdmissionDetailResponse,
    NameMismatchResolveRequest
)

router = APIRouter(prefix="/admissions", tags=["Admissions"])

@router.post("/dry-run", response_model=DryRunResponse)
def dry_run_validation(
    request: SubmitAdmissionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id or request.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required for admission validation")

    results = []
    seen_apaar = set()
    valid_count = 0
    invalid_count = 0
    warning_count = 0

    for idx, row in enumerate(request.records):
        data_dict = row.model_dump()
        
        # Match programme_id by programme_name and course_name
        prog = db.query(Programme).filter(
            Programme.institution_id == inst_id,
            Programme.course_name.ilike(f"%{row.course_name}%")
        ).first()
        prog_id = prog.id if prog else None

        val_res = validate_single_admission_record(
            db=db,
            record_data=data_dict,
            institution_id=inst_id,
            programme_id=prog_id,
            current_batch_apaar_ids=seen_apaar
        )

        seen_apaar.add(row.apaar_id)

        findings_pydantic = [ValidationFinding(**f) for f in val_res["findings"]]
        is_row_valid = val_res["is_valid"]

        if any(f.severity == "ERROR" for f in findings_pydantic):
            invalid_count += 1
        elif any(f.severity == "WARNING" for f in findings_pydantic):
            warning_count += 1
            valid_count += 1
        else:
            valid_count += 1

        results.append(DryRunRowResult(
            row_index=idx + 1,
            is_valid=is_row_valid,
            data=data_dict,
            findings=findings_pydantic
        ))

    return DryRunResponse(
        total_rows=len(request.records),
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        warning_rows=warning_count,
        has_blocking_errors=invalid_count > 0,
        results=results
    )


@router.post("/submit")
def submit_admission_batch(
    request: SubmitAdmissionsRequest,
    current_user: User = Depends(require_roles([UserRole.AICTE_ADMIN, UserRole.INSTITUTION_NODAL_OFFICER])),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id or request.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID is mandatory for admission submission")

    inst = db.query(Institution).filter(Institution.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution record not found")

    created_records = []
    state_abbr = inst.state[:2].upper()

    for idx, row in enumerate(request.records):
        prog = db.query(Programme).filter(
            Programme.institution_id == inst_id,
            Programme.course_name.ilike(f"%{row.course_name}%")
        ).first()
        if not prog:
            # Fallback to first programme in institution if not matched
            prog = db.query(Programme).filter(Programme.institution_id == inst_id).first()
        
        prog_id = prog.id if prog else str(uuid.uuid4())

        # Generate unique official record reference
        rec_ref = f"TS-{row.year_of_admission}-{state_abbr}-{secrets.token_hex(3).upper()}"
        confirm_token = secrets.token_urlsafe(24)

        # Parse admission date
        try:
            parsed_adm_date = datetime.strptime(row.admission_date, "%Y-%m-%d").date()
        except Exception:
            parsed_adm_date = date.today()

        try:
            parsed_dob = datetime.strptime(row.dob, "%Y-%m-%d").date()
        except Exception:
            parsed_dob = date(2005, 1, 1)

        val_res = validate_single_admission_record(
            db=db,
            record_data=row.model_dump(),
            institution_id=inst_id,
            programme_id=prog_id
        )

        admission = StudentAdmission(
            record_ref=rec_ref,
            institution_id=inst_id,
            programme_id=prog_id,
            apaar_id=row.apaar_id,
            student_name=row.student_name,
            dob=parsed_dob,
            gender=row.gender,
            year_of_admission=row.year_of_admission,
            admission_date=parsed_adm_date,
            student_id_enrolment=row.student_id_enrolment,
            mobile_hash=hash_identifier(row.mobile),
            mobile_masked=mask_mobile(row.mobile),
            email_hash=hash_identifier(row.email),
            email_masked=mask_email(row.email),
            category=row.category.upper(),
            quota_type=row.quota_type.upper(),
            supernumerary_flag=row.supernumerary_flag,
            two_key_status=TwoKeyStatus.SUBMITTED,
            confirmation_token=confirm_token,
            validation_status=val_res["validation_status"],
            validation_findings=val_res["findings"],
            review_flags=[],
            downstream_activity_flag=True
        )
        db.add(admission)
        db.flush()

        # Create statutory consent ledger record for academic verification
        consent = ConsentRecord(
            apaar_id=row.apaar_id,
            student_admission_id=admission.id,
            purpose=ConsentPurpose.ACADEMIC_ENROLMENT_VERIFICATION,
            status=ConsentStatus.ACTIVE
        )
        db.add(consent)

        # Dispatch simulated Two-Key confirmation SMS/DigiLocker notification
        confirmation_channel_adapter.send_confirmation_link(
            apaar_id=row.apaar_id,
            mobile_masked=admission.mobile_masked,
            student_name=row.student_name,
            token=confirm_token
        )

        created_records.append(rec_ref)

    db.commit()

    record_audit(
        db=db,
        user=current_user,
        action="UPLOAD_ADMISSION_BATCH",
        entity_type="INSTITUTION",
        entity_id=inst_id,
        details={
            "submitted_count": len(created_records),
            "record_refs_sample": created_records[:5]
        }
    )

    return {
        "status": "SUCCESS",
        "message": f"Successfully enrolled {len(created_records)} records. Two-Key confirmation tokens dispatched to students.",
        "submitted_count": len(created_records),
        "record_references": created_records
    }


@router.get("", response_model=List[AdmissionDetailResponse])
def list_admissions(
    institution_id: Optional[str] = None,
    programme_id: Optional[str] = None,
    two_key_status: Optional[str] = None,
    quota_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudentAdmission)

    # Restrict institution nodal officers to their own institution
    if current_user.role == UserRole.INSTITUTION_NODAL_OFFICER:
        query = query.filter(StudentAdmission.institution_id == current_user.institution_id)
    elif institution_id:
        query = query.filter(StudentAdmission.institution_id == institution_id)

    if programme_id:
        query = query.filter(StudentAdmission.programme_id == programme_id)
    if two_key_status:
        query = query.filter(StudentAdmission.two_key_status == two_key_status)
    if quota_type:
        query = query.filter(StudentAdmission.quota_type == quota_type)
    if search:
        query = query.filter(
            (StudentAdmission.student_name.ilike(f"%{search}%")) |
            (StudentAdmission.apaar_id.ilike(f"%{search}%")) |
            (StudentAdmission.record_ref.ilike(f"%{search}%")) |
            (StudentAdmission.student_id_enrolment.ilike(f"%{search}%"))
        )

    records = query.order_by(StudentAdmission.created_at.desc()).offset(offset).limit(limit).all()
    results = []

    for r in records:
        inst = db.query(Institution).filter(Institution.id == r.institution_id).first()
        prog = db.query(Programme).filter(Programme.id == r.programme_id).first()

        results.append(AdmissionDetailResponse(
            id=r.id,
            record_ref=r.record_ref,
            institution_id=r.institution_id,
            institution_name=inst.name if inst else "Unknown",
            programme_id=r.programme_id,
            programme_name=prog.programme_name if prog else "Engineering",
            course_name=prog.course_name if prog else "B.Tech",
            apaar_id=r.apaar_id,
            student_name=r.student_name,
            dob=r.dob,
            gender=r.gender,
            year_of_admission=r.year_of_admission,
            admission_date=r.admission_date,
            student_id_enrolment=r.student_id_enrolment,
            mobile_masked=r.mobile_masked,
            email_masked=r.email_masked,
            category=r.category,
            quota_type=r.quota_type,
            supernumerary_flag=r.supernumerary_flag,
            two_key_status=r.two_key_status,
            confirmation_token=r.confirmation_token,
            confirmation_timestamp=r.confirmation_timestamp,
            student_remarks=r.student_remarks,
            dispute_reason=r.dispute_reason,
            validation_status=r.validation_status,
            validation_findings=r.validation_findings or [],
            review_flags=r.review_flags or [],
            downstream_activity_flag=r.downstream_activity_flag,
            name_mismatch_resolved=r.name_mismatch_resolved or False,
            created_at=r.created_at
        ))

    return results


@router.get("/discrepancy-queue", response_model=List[AdmissionDetailResponse])
def get_discrepancy_queue(
    current_user: User = Depends(require_roles([UserRole.AICTE_ADMIN, UserRole.AICTE_REGIONAL_OFFICER, UserRole.INSTITUTION_NODAL_OFFICER])),
    db: Session = Depends(get_db)
):
    query = db.query(StudentAdmission).filter(StudentAdmission.validation_status.in_([ValidationStatus.WARNING, ValidationStatus.INVALID]))
    if current_user.role == UserRole.INSTITUTION_NODAL_OFFICER:
        query = query.filter(StudentAdmission.institution_id == current_user.institution_id)

    records = query.order_by(StudentAdmission.created_at.desc()).all()
    results = []

    for r in records:
        inst = db.query(Institution).filter(Institution.id == r.institution_id).first()
        prog = db.query(Programme).filter(Programme.id == r.programme_id).first()
        results.append(AdmissionDetailResponse(
            id=r.id,
            record_ref=r.record_ref,
            institution_id=r.institution_id,
            institution_name=inst.name if inst else "Unknown",
            programme_id=r.programme_id,
            programme_name=prog.programme_name if prog else "Engineering",
            course_name=prog.course_name if prog else "B.Tech",
            apaar_id=r.apaar_id,
            student_name=r.student_name,
            dob=r.dob,
            gender=r.gender,
            year_of_admission=r.year_of_admission,
            admission_date=r.admission_date,
            student_id_enrolment=r.student_id_enrolment,
            mobile_masked=r.mobile_masked,
            email_masked=r.email_masked,
            category=r.category,
            quota_type=r.quota_type,
            supernumerary_flag=r.supernumerary_flag,
            two_key_status=r.two_key_status,
            confirmation_token=r.confirmation_token,
            confirmation_timestamp=r.confirmation_timestamp,
            student_remarks=r.student_remarks,
            dispute_reason=r.dispute_reason,
            validation_status=r.validation_status,
            validation_findings=r.validation_findings or [],
            review_flags=r.review_flags or [],
            downstream_activity_flag=r.downstream_activity_flag,
            name_mismatch_resolved=r.name_mismatch_resolved or False,
            created_at=r.created_at
        ))

    return results


@router.post("/resolve-mismatch")
def resolve_name_mismatch(
    request: NameMismatchResolveRequest,
    current_user: User = Depends(require_roles([UserRole.AICTE_ADMIN, UserRole.INSTITUTION_NODAL_OFFICER])),
    db: Session = Depends(get_db)
):
    admission = db.query(StudentAdmission).filter(StudentAdmission.id == request.admission_id).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission record not found")

    admission.name_mismatch_resolved = request.approved
    admission.resolution_officer_notes = request.officer_notes
    if request.approved:
        admission.validation_status = ValidationStatus.VALID

    db.commit()

    record_audit(
        db=db,
        user=current_user,
        action="RESOLVE_NAME_MISMATCH",
        entity_type="STUDENT_ADMISSION",
        entity_id=admission.id,
        details={
            "apaar_id": admission.apaar_id,
            "approved": request.approved,
            "officer_notes": request.officer_notes
        }
    )

    return {
        "status": "RESOLVED",
        "admission_id": admission.id,
        "validation_status": admission.validation_status,
        "message": "Discrepancy resolution logged into official audit ledger."
    }
