from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.institution import Institution, Programme
from backend.app.models.student import StudentAdmission
from backend.app.models.user import User, UserRole
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.engine.review_engine import compute_institution_review_score, generate_fraud_graph_data
from backend.app.adapters.allotment_list import allotment_list_adapter
from backend.app.schemas.review import ReviewScoreResponse, FraudGraphResponse

router = APIRouter(prefix="/review", tags=["Review Flags & Scoring"])

@router.get("/score/{institution_id}", response_model=ReviewScoreResponse)
def get_review_score(
    institution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    score_data = compute_institution_review_score(db, institution_id)
    return ReviewScoreResponse(**score_data)

@router.get("/fraud-graph/{institution_id}", response_model=FraudGraphResponse)
def get_fraud_graph(
    institution_id: str,
    current_user: User = Depends(require_roles([UserRole.AICTE_ADMIN, UserRole.AICTE_REGIONAL_OFFICER])),
    db: Session = Depends(get_db)
):
    graph_data = generate_fraud_graph_data(db, institution_id)
    return FraudGraphResponse(**graph_data)

@router.get("/allotment-reconciliation/{institution_id}")
def get_allotment_reconciliation(
    institution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    admissions = db.query(StudentAdmission).filter(StudentAdmission.institution_id == institution_id).all()
    programmes = {p.id: p for p in db.query(Programme).filter(Programme.institution_id == institution_id).all()}

    reconciliation_list = []
    for a in admissions:
        if a.quota_type in ["STATE_ALLOTMENT", "TFW", "EWS"]:
            prog = programmes.get(a.programme_id)
            course = prog.course_name if prog else "Engineering"
            allotment = allotment_list_adapter.verify_allotment(a.apaar_id, inst.aicte_id, course, a.quota_type)
            
            is_reconciled = allotment is not None
            reconciliation_list.append({
                "record_ref": a.record_ref,
                "apaar_id": a.apaar_id,
                "student_name": a.student_name,
                "course_name": course,
                "quota_type": a.quota_type,
                "is_reconciled": is_reconciled,
                "state_merit_rank": allotment.merit_rank if allotment else "NOT_FOUND_IN_MERIT_LIST",
                "finding": "Verified against State Centralised Allotment List" if is_reconciled else "Quota admission missing from state merit allotment record"
            })

    return {
        "institution_name": inst.name,
        "aicte_id": inst.aicte_id,
        "total_quota_admissions": len(reconciliation_list),
        "unreconciled_count": sum(1 for item in reconciliation_list if not item["is_reconciled"]),
        "records": reconciliation_list
    }
