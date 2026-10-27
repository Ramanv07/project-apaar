from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.quota_policy import QuotaPolicyRule
from backend.app.models.institution import Programme
from backend.app.models.student import StudentAdmission
from backend.app.models.user import User, UserRole
from backend.app.auth.dependencies import get_current_user, require_roles, record_audit
from backend.app.engine.quota_waterfall import (
    load_policy_for_date,
    evaluate_programme_waterfall,
    simulate_what_if_scenario
)
from backend.app.schemas.quota import (
    PolicyVersionResponse,
    QuotaWaterfallBreakdown,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse
)

router = APIRouter(prefix="/quota", tags=["Quota Waterfall Engine"])

@router.get("/policies", response_model=List[PolicyVersionResponse])
def list_policies(db: Session = Depends(get_db)):
    rules = db.query(QuotaPolicyRule).order_by(QuotaPolicyRule.effective_from.desc()).all()
    return [
        PolicyVersionResponse(
            id=r.id,
            version_code=r.version_code,
            handbook_name=r.handbook_name,
            description=r.description,
            effective_from=r.effective_from,
            effective_to=r.effective_to,
            policy_json=r.policy_json
        ) for r in rules
    ]

@router.get("/waterfall/{programme_id}", response_model=QuotaWaterfallBreakdown)
def get_programme_waterfall(
    programme_id: str,
    db: Session = Depends(get_db)
):
    prog = db.query(Programme).filter(Programme.id == programme_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Programme not found")

    admissions = db.query(StudentAdmission).filter(StudentAdmission.programme_id == programme_id).all()
    
    # Load current active policy
    target_date = admissions[0].admission_date if admissions else None
    policy = load_policy_for_date(db, target_date or prog.created_at.date())

    breakdown = evaluate_programme_waterfall(prog, admissions, policy)
    return QuotaWaterfallBreakdown(**breakdown)

@router.post("/simulate-what-if", response_model=WhatIfSimulationResponse)
def simulate_what_if(
    request: WhatIfSimulationRequest,
    current_user: User = Depends(require_roles([UserRole.AICTE_ADMIN, UserRole.AICTE_REGIONAL_OFFICER])),
    db: Session = Depends(get_db)
):
    result = simulate_what_if_scenario(
        db=db,
        supernumerary_cap_percent=request.supernumerary_cap_percent,
        nri_quota_percent=request.nri_quota_percent,
        allow_tfw_cascade_to_nri=request.allow_tfw_cascade_to_nri
    )

    record_audit(
        db=db,
        user=current_user,
        action="SIMULATE_WHAT_IF_QUOTA",
        entity_type="POLICY",
        entity_id=request.policy_version_code or "WHAT_IF",
        details={
            "supernumerary_cap_percent": request.supernumerary_cap_percent,
            "nri_quota_percent": request.nri_quota_percent,
            "newly_non_compliant_count": result["newly_non_compliant_count"],
            "newly_compliant_count": result["newly_compliant_count"]
        }
    )

    return WhatIfSimulationResponse(**result)
