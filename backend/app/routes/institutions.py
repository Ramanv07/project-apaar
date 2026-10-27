from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.institution import Institution, Programme
from backend.app.models.student import StudentAdmission, TwoKeyStatus
from backend.app.models.user import User, UserRole
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.schemas.institution import InstitutionResponse, ProgrammeSummary, InstitutionOverviewStats

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("/overview-stats", response_model=InstitutionOverviewStats)
def get_overview_stats(
    region: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Institution)
    if current_user.role == UserRole.AICTE_REGIONAL_OFFICER and current_user.region:
        query = query.filter(Institution.region == current_user.region)
    elif region:
        query = query.filter(Institution.region == region)

    institutions = query.all()
    inst_ids = [inst.id for inst in institutions]

    total_intake = db.query(func.sum(Programme.approved_intake)).filter(Programme.institution_id.in_(inst_ids)).scalar() or 0
    total_admissions = db.query(StudentAdmission).filter(StudentAdmission.institution_id.in_(inst_ids)).count()
    total_unconfirmed = db.query(StudentAdmission).filter(
        StudentAdmission.institution_id.in_(inst_ids),
        StudentAdmission.two_key_status.in_([TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD, TwoKeyStatus.SUBMITTED])
    ).count()
    total_disputed = db.query(StudentAdmission).filter(
        StudentAdmission.institution_id.in_(inst_ids),
        StudentAdmission.two_key_status == TwoKeyStatus.DISPUTED
    ).count()
    flagged_count = sum(1 for inst in institutions if inst.status in ["FLAGGED", "UNDER_REVIEW"])
    
    utilization_pct = (total_admissions / total_intake * 100.0) if total_intake else 0.0

    # Trend over admission weeks (synthetic calendar distribution)
    weekly_admissions = [
        {"week": "W1 (Jul 1-7)", "count": int(total_admissions * 0.08)},
        {"week": "W2 (Jul 8-14)", "count": int(total_admissions * 0.15)},
        {"week": "W3 (Jul 15-21)", "count": int(total_admissions * 0.28)},
        {"week": "W4 (Jul 22-28)", "count": int(total_admissions * 0.32)},
        {"week": "W5 (Jul 29-Aug 4)", "count": int(total_admissions * 0.17)},
    ]

    return InstitutionOverviewStats(
        total_institutions=len(institutions),
        total_approved_intake=total_intake,
        total_admissions=total_admissions,
        total_unconfirmed=total_unconfirmed,
        total_disputed=total_disputed,
        flagged_institutions_count=flagged_count,
        national_intake_utilisation_pct=round(utilization_pct, 1),
        weekly_admissions=weekly_admissions
    )

@router.get("", response_model=List[InstitutionResponse])
def list_institutions(
    state: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Institution)
    
    # Regional Officer automatically restricted to assigned region
    if current_user.role == UserRole.AICTE_REGIONAL_OFFICER and current_user.region:
        query = query.filter(Institution.region == current_user.region)
    elif region:
        query = query.filter(Institution.region == region)

    if state:
        query = query.filter(Institution.state == state)
    if status:
        query = query.filter(Institution.status == status)

    institutions = query.all()
    results = []

    for inst in institutions:
        progs = db.query(Programme).filter(Programme.institution_id == inst.id).all()
        admissions = db.query(StudentAdmission).filter(StudentAdmission.institution_id == inst.id).all()
        
        total_intake = sum(p.approved_intake for p in progs)
        enrolled_count = len(admissions)
        unconfirmed = sum(1 for a in admissions if a.two_key_status in [TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD, TwoKeyStatus.SUBMITTED])
        unconfirmed_rate = (unconfirmed / enrolled_count * 100.0) if enrolled_count else 0.0
        open_flags = len(inst.review_reasons) if inst.review_reasons else 0

        prog_summaries = []
        for p in progs:
            p_admissions = [a for a in admissions if a.programme_id == p.id]
            prog_summaries.append(ProgrammeSummary(
                id=p.id,
                programme_name=p.programme_name,
                course_name=p.course_name,
                level=p.level,
                approved_intake=p.approved_intake,
                supernumerary_cap_percent=p.supernumerary_cap_percent,
                nri_quota_percent=p.nri_quota_percent,
                is_nba_accredited=p.is_nba_accredited,
                enrolled_count=len(p_admissions),
                supernumerary_enrolled=sum(1 for a in p_admissions if a.supernumerary_flag),
                unconfirmed_count=sum(1 for a in p_admissions if a.two_key_status in [TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD, TwoKeyStatus.SUBMITTED]),
                disputed_count=sum(1 for a in p_admissions if a.two_key_status == TwoKeyStatus.DISPUTED)
            ))

        results.append(InstitutionResponse(
            id=inst.id,
            aicte_id=inst.aicte_id,
            name=inst.name,
            state=inst.state,
            region=inst.region,
            address=inst.address,
            nodal_officer_name=inst.nodal_officer_name,
            nodal_officer_email=inst.nodal_officer_email,
            nodal_officer_phone_masked=inst.nodal_officer_phone_masked,
            status=inst.status,
            review_score=inst.review_score,
            review_reasons=inst.review_reasons or [],
            total_approved_intake=total_intake,
            total_enrolled=enrolled_count,
            unconfirmed_rate=round(unconfirmed_rate, 1),
            open_flags_count=open_flags,
            programmes=prog_summaries
        ))

    return results

@router.get("/current", response_model=InstitutionResponse)
def get_current_institution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst = None
    if current_user.institution_id:
        inst = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
    
    if not inst:
        inst = db.query(Institution).first()
        
    if not inst:
        raise HTTPException(status_code=404, detail="No institution records exist in database")

    return get_institution_detail(inst.id, current_user, db)

@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution_detail(
    institution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution record not found")

    progs = db.query(Programme).filter(Programme.institution_id == inst.id).all()
    admissions = db.query(StudentAdmission).filter(StudentAdmission.institution_id == inst.id).all()

    total_intake = sum(p.approved_intake for p in progs)
    enrolled_count = len(admissions)
    unconfirmed = sum(1 for a in admissions if a.two_key_status in [TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD, TwoKeyStatus.SUBMITTED])
    unconfirmed_rate = (unconfirmed / enrolled_count * 100.0) if enrolled_count else 0.0

    prog_summaries = []
    for p in progs:
        p_admissions = [a for a in admissions if a.programme_id == p.id]
        prog_summaries.append(ProgrammeSummary(
            id=p.id,
            programme_name=p.programme_name,
            course_name=p.course_name,
            level=p.level,
            approved_intake=p.approved_intake,
            supernumerary_cap_percent=p.supernumerary_cap_percent,
            nri_quota_percent=p.nri_quota_percent,
            is_nba_accredited=p.is_nba_accredited,
            enrolled_count=len(p_admissions),
            supernumerary_enrolled=sum(1 for a in p_admissions if a.supernumerary_flag),
            unconfirmed_count=sum(1 for a in p_admissions if a.two_key_status in [TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD, TwoKeyStatus.SUBMITTED]),
            disputed_count=sum(1 for a in p_admissions if a.two_key_status == TwoKeyStatus.DISPUTED)
        ))

    return InstitutionResponse(
        id=inst.id,
        aicte_id=inst.aicte_id,
        name=inst.name,
        state=inst.state,
        region=inst.region,
        address=inst.address,
        nodal_officer_name=inst.nodal_officer_name,
        nodal_officer_email=inst.nodal_officer_email,
        nodal_officer_phone_masked=inst.nodal_officer_phone_masked,
        status=inst.status,
        review_score=inst.review_score,
        review_reasons=inst.review_reasons or [],
        total_approved_intake=total_intake,
        total_enrolled=enrolled_count,
        unconfirmed_rate=round(unconfirmed_rate, 1),
        open_flags_count=len(inst.review_reasons or []),
        programmes=prog_summaries
    )
