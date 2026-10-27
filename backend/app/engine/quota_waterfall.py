import os
import json
from datetime import date, datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.quota_policy import QuotaPolicyRule
from backend.app.models.institution import Programme, Institution
from backend.app.models.student import StudentAdmission

def load_policy_for_date(db: Session, target_date: date) -> Dict[str, Any]:
    # Query database for policy effective on target_date
    policy_row = db.query(QuotaPolicyRule).filter(
        QuotaPolicyRule.effective_from <= target_date
    ).order_by(QuotaPolicyRule.effective_from.desc()).first()

    if policy_row:
        return policy_row.policy_json

    # Fallback to loading directly from rule file
    rule_path = os.path.join(settings.POLICY_DIR, "aicte_aph_2025_v2.json")
    if os.path.exists(rule_path):
        with open(rule_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("intake_rules", {})
            
    return {
        "max_over_intake_percent": 0.0,
        "supernumerary_cap_percent": 15.0,
        "sub_quotas": {
            "EWS": {"cap_percent_of_intake": 10.0, "is_supernumerary": True},
            "TFW": {"cap_percent_of_intake": 5.0, "is_supernumerary": True},
            "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0, "is_supernumerary": True},
            "NRI": {"cap_percent_of_intake": 5.0, "is_supernumerary": False}
        },
        "cascade_rules": {"allow_vacant_supernumerary_to_nri": True, "max_cascaded_nri_seats": 5}
    }


def evaluate_programme_waterfall(
    programme: Programme,
    admissions: List[StudentAdmission],
    policy_rules: Dict[str, Any]
) -> Dict[str, Any]:
    approved_intake = programme.approved_intake
    super_cap_pct = policy_rules.get("supernumerary_cap_percent", 15.0)
    sub_quotas = policy_rules.get("sub_quotas", {})
    cascade_rules = policy_rules.get("cascade_rules", {})

    # Maximum permissible supernumerary seats
    supernumerary_permitted = int((approved_intake * super_cap_pct) / 100.0)

    # Sub-quota ceilings
    ews_cap = int((approved_intake * sub_quotas.get("EWS", {}).get("cap_percent_of_intake", 10.0)) / 100.0)
    tfw_cap = int((approved_intake * sub_quotas.get("TFW", {}).get("cap_percent_of_intake", 5.0)) / 100.0)
    fn_cap = int((approved_intake * sub_quotas.get("FN_OCI_CIWGC", {}).get("cap_percent_of_intake", 15.0)) / 100.0)
    base_nri_cap = int((approved_intake * sub_quotas.get("NRI", {}).get("cap_percent_of_intake", 5.0)) / 100.0)

    # Actual admissions count per quota category
    ews_admitted = sum(1 for a in admissions if a.quota_type == "EWS")
    tfw_admitted = sum(1 for a in admissions if a.quota_type == "TFW")
    fn_admitted = sum(1 for a in admissions if a.quota_type in ["FN", "OCI", "CIWGC"])
    nri_admitted = sum(1 for a in admissions if a.quota_type == "NRI")
    regular_admitted = sum(1 for a in admissions if a.quota_type in ["GENERAL", "OBC_NCL", "SC", "ST", "MANAGEMENT", "STATE_ALLOTMENT", "NRI"])
    supernumerary_admitted = sum(1 for a in admissions if a.supernumerary_flag or a.quota_type in ["EWS", "TFW", "FN", "OCI", "CIWGC"])

    # Cascade Calculation:
    # Under AICTE regulations, vacant FN/OCI/CIWGC supernumerary seats can cascade to NRI
    # ONLY IF the programme holds NBA accreditation and policy permits it.
    can_cascade_to_nri = cascade_rules.get("allow_vacant_supernumerary_to_nri", False) and programme.is_nba_accredited
    vacant_fn_seats = max(0, fn_cap - fn_admitted)
    max_cascaded_nri = cascade_rules.get("max_cascaded_nri_seats", 5)
    cascaded_to_nri = min(vacant_fn_seats, max_cascaded_nri) if can_cascade_to_nri else 0
    effective_nri_cap = base_nri_cap + cascaded_to_nri

    reasons = []
    breach_count = 0

    if regular_admitted > approved_intake:
        breach = regular_admitted - approved_intake
        breach_count += breach
        reasons.append(f"Approved intake ceiling breached by {breach} regular seat(s) ({regular_admitted}/{approved_intake}).")

    if supernumerary_admitted > supernumerary_permitted:
        breach = supernumerary_admitted - supernumerary_permitted
        breach_count += breach
        reasons.append(f"Aggregate supernumerary ceiling of {super_cap_pct}% exceeded by {breach} seat(s) ({supernumerary_admitted}/{supernumerary_permitted}).")

    if ews_admitted > ews_cap:
        breach_count += (ews_admitted - ews_cap)
        reasons.append(f"EWS quota ceiling ({ews_cap}) exceeded: {ews_admitted} admitted.")

    if tfw_admitted > tfw_cap:
        breach_count += (tfw_admitted - tfw_cap)
        reasons.append(f"Tuition Fee Waiver (TFW) ceiling ({tfw_cap}) exceeded: {tfw_admitted} admitted.")

    if nri_admitted > effective_nri_cap:
        breach_count += (nri_admitted - effective_nri_cap)
        reason_detail = f"NRI quota ceiling exceeded: {nri_admitted}/{effective_nri_cap}."
        if not programme.is_nba_accredited and vacant_fn_seats > 0:
            reason_detail += " Cascade from vacant FN/OCI seats disallowed due to absence of NBA accreditation."
        reasons.append(reason_detail)

    return {
        "programme_id": programme.id,
        "course_name": programme.course_name,
        "approved_intake": approved_intake,
        "regular_admissions": regular_admitted,
        "supernumerary_permitted": supernumerary_permitted,
        "supernumerary_admissions": supernumerary_admitted,
        "ews_seats": ews_cap,
        "ews_admitted": ews_admitted,
        "tfw_seats": tfw_cap,
        "tfw_admitted": tfw_admitted,
        "fn_oci_seats": fn_cap,
        "fn_oci_admitted": fn_admitted,
        "nri_seats": effective_nri_cap,
        "nri_admitted": nri_admitted,
        "supernumerary_unfilled_transferred_to_nri": cascaded_to_nri,
        "is_compliant": breach_count == 0,
        "breach_count": breach_count,
        "reasons": reasons
    }


def simulate_what_if_scenario(
    db: Session,
    supernumerary_cap_percent: float,
    nri_quota_percent: float,
    allow_tfw_cascade_to_nri: bool = False
) -> Dict[str, Any]:
    programmes = db.query(Programme).all()
    institutions = {inst.id: inst for inst in db.query(Institution).all()}
    
    current_compliant = 0
    current_non_compliant = 0
    sim_compliant = 0
    sim_non_compliant = 0
    newly_non_compliant = 0
    newly_compliant = 0
    impacted_programmes = []

    # Current baseline policy rules
    baseline_policy = {
        "supernumerary_cap_percent": 15.0,
        "sub_quotas": {
            "EWS": {"cap_percent_of_intake": 10.0},
            "TFW": {"cap_percent_of_intake": 5.0},
            "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0},
            "NRI": {"cap_percent_of_intake": 5.0}
        },
        "cascade_rules": {"allow_vacant_supernumerary_to_nri": False}
    }

    simulated_policy = {
        "supernumerary_cap_percent": supernumerary_cap_percent,
        "sub_quotas": {
            "EWS": {"cap_percent_of_intake": 10.0},
            "TFW": {"cap_percent_of_intake": 5.0},
            "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0},
            "NRI": {"cap_percent_of_intake": nri_quota_percent}
        },
        "cascade_rules": {
            "allow_vacant_supernumerary_to_nri": True,
            "allow_tfw_cascade_to_nri": allow_tfw_cascade_to_nri,
            "max_cascaded_nri_seats": 5
        }
    }

    for prog in programmes:
        admissions = db.query(StudentAdmission).filter(StudentAdmission.programme_id == prog.id).all()
        base_res = evaluate_programme_waterfall(prog, admissions, baseline_policy)
        sim_res = evaluate_programme_waterfall(prog, admissions, simulated_policy)

        if base_res["is_compliant"]:
            current_compliant += 1
        else:
            current_non_compliant += 1

        if sim_res["is_compliant"]:
            sim_compliant += 1
        else:
            sim_non_compliant += 1

        # Track state transitions
        if base_res["is_compliant"] and not sim_res["is_compliant"]:
            newly_non_compliant += 1
            inst = institutions.get(prog.institution_id)
            impacted_programmes.append({
                "institution_name": inst.name if inst else "Unknown",
                "state": inst.state if inst else "Unknown",
                "course_name": prog.course_name,
                "approved_intake": prog.approved_intake,
                "enrolled_count": len(admissions),
                "prior_status": "COMPLIANT",
                "simulated_status": "NON_COMPLIANT",
                "delta_headroom": -sim_res["breach_count"]
            })
        elif not base_res["is_compliant"] and sim_res["is_compliant"]:
            newly_compliant += 1
            inst = institutions.get(prog.institution_id)
            impacted_programmes.append({
                "institution_name": inst.name if inst else "Unknown",
                "state": inst.state if inst else "Unknown",
                "course_name": prog.course_name,
                "approved_intake": prog.approved_intake,
                "enrolled_count": len(admissions),
                "prior_status": "NON_COMPLIANT",
                "simulated_status": "COMPLIANT",
                "delta_headroom": base_res["breach_count"]
            })

    return {
        "current_compliant_programmes": current_compliant,
        "current_non_compliant_programmes": current_non_compliant,
        "simulated_compliant_programmes": sim_compliant,
        "simulated_non_compliant_programmes": sim_non_compliant,
        "newly_non_compliant_count": newly_non_compliant,
        "newly_compliant_count": newly_compliant,
        "impacted_programmes": impacted_programmes
    }
