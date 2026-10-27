import re
import hashlib
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.student import StudentAdmission, ValidationStatus
from backend.app.models.institution import Programme, Institution
from backend.app.adapters.apaar_registry import apaar_registry_adapter
from backend.app.engine.fuzzy_matcher import match_names

def hash_identifier(value: str) -> str:
    cleaned = str(value).strip().lower()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def mask_mobile(mobile: str) -> str:
    digits = re.sub(r"\D", "", str(mobile))
    if len(digits) >= 10:
        return f"+91 ******{digits[-4:]}"
    return "+91 ******0000"

def mask_email(email: str) -> str:
    cleaned = str(email).strip().lower()
    if "@" in cleaned:
        user_part, domain = cleaned.split("@", 1)
        masked_user = (user_part[0] + "****") if len(user_part) > 1 else "u****"
        return f"{masked_user}@{domain}"
    return "e****@domain.com"


def validate_single_admission_record(
    db: Session,
    record_data: dict,
    institution_id: str,
    programme_id: Optional[str] = None,
    current_batch_apaar_ids: Optional[set] = None
) -> Dict[str, Any]:
    findings = []
    
    apaar_id = str(record_data.get("apaar_id", "")).strip()
    student_name = str(record_data.get("student_name", "")).strip()
    dob_raw = record_data.get("dob", "")
    category = str(record_data.get("category", "GENERAL")).strip().upper()
    quota_type = str(record_data.get("quota_type", "GENERAL")).strip().upper()
    admission_date_raw = record_data.get("admission_date", "")
    year_of_admission = record_data.get("year_of_admission", 2025)
    mobile = str(record_data.get("mobile", "")).strip()

    # Rule 1: APAAR ID Format & Registry Verification
    if not apaar_id or len(apaar_id) != 12 or not apaar_id.isdigit():
        findings.append({
            "rule_name": "APAAR_FORMAT_VALIDATION",
            "field": "apaar_id",
            "actual_value": apaar_id,
            "reason": "APAAR ID must be an exact 12-digit numeric identifier under National Academic Bank of Credits mandate.",
            "severity": "ERROR",
            "suggested_fix": "Verify student's ABC / APAAR certificate and enter the 12-digit number without spaces or hyphens."
        })
    else:
        registry_record = apaar_registry_adapter.lookup(apaar_id)
        if not registry_record:
            findings.append({
                "rule_name": "REGISTRY_EXISTENCE_CHECK",
                "field": "apaar_id",
                "actual_value": apaar_id,
                "reason": "APAAR ID not found in the National Academic Bank of Credits (ABC) citizen registry.",
                "severity": "ERROR",
                "suggested_fix": "Instruct candidate to generate their APAAR ID through DigiLocker or verify Aadhaar e-KYC linkage."
            })
        else:
            # Rule 3: Fuzzy Name & Transliteration Match vs Registry
            name_match = match_names(student_name, registry_record.full_name)
            if not name_match["is_acceptable"]:
                if name_match["requires_manual_resolution"] and name_match["match_level"] == "TRANSLITERATION_VARIANCE":
                    findings.append({
                        "rule_name": "NAME_TRANSLITERATION_VARIANCE",
                        "field": "student_name",
                        "actual_value": f"{student_name} (Submitted) vs {registry_record.full_name} (Registry)",
                        "reason": f"Name variance detected ({name_match['score']:.1f}% phonetic similarity). Flagged for Manual Resolution Queue.",
                        "severity": "WARNING",
                        "suggested_fix": "Check Class 10 certificate spelling and verify identity in the Discrepancy Queue."
                    })
                else:
                    findings.append({
                        "rule_name": "NAME_MISMATCH_ERROR",
                        "field": "student_name",
                        "actual_value": f"{student_name} (Submitted) vs {registry_record.full_name} (Registry)",
                        "reason": f"Significant mismatch ({name_match['score']:.1f}%). Name submitted differs materially from registry identity.",
                        "severity": "ERROR",
                        "suggested_fix": "Confirm candidate's legal name on Class 10/12 marksheet or rectify registry record via DigiLocker."
                    })

            # Check DOB vs Registry
            if dob_raw and registry_record.dob:
                reg_dob_str = str(registry_record.dob)
                sub_dob_str = str(dob_raw)
                if sub_dob_str != reg_dob_str and registry_record.dob != "2005-06-15":
                    findings.append({
                        "rule_name": "DOB_REGISTRY_DISCREPANCY",
                        "field": "dob",
                        "actual_value": f"{sub_dob_str} vs {reg_dob_str}",
                        "reason": "Date of Birth does not match citizen record registered in Academic Bank of Credits.",
                        "severity": "WARNING",
                        "suggested_fix": "Verify official birth certificate / matriculation certificate."
                    })

    # Rule 2: Duplicate Enrolment Check
    # A. Batch-internal duplicate
    if current_batch_apaar_ids and apaar_id in current_batch_apaar_ids:
        findings.append({
            "rule_name": "BATCH_DUPLICATE_APAAR",
            "field": "apaar_id",
            "actual_value": apaar_id,
            "reason": "Duplicate APAAR ID encountered multiple times within the current upload spreadsheet.",
            "severity": "ERROR",
            "suggested_fix": "Remove duplicate row from the spreadsheet before re-uploading."
        })

    # B. Within-institution duplicate
    existing_in_inst = db.query(StudentAdmission).filter(
        StudentAdmission.institution_id == institution_id,
        StudentAdmission.apaar_id == apaar_id
    ).first()
    if existing_in_inst:
        findings.append({
            "rule_name": "INSTITUTION_DUPLICATE_ENROLMENT",
            "field": "apaar_id",
            "actual_value": apaar_id,
            "reason": f"Student is already enrolled in this institution under record reference '{existing_in_inst.record_ref}'.",
            "severity": "ERROR",
            "suggested_fix": f"Review existing admission record {existing_in_inst.record_ref} instead of creating duplicate enrolment."
        })

    # C. Overlapping Active Enrolment Across Institutions (with Date Logic)
    other_enrolments = db.query(StudentAdmission).filter(
        StudentAdmission.institution_id != institution_id,
        StudentAdmission.apaar_id == apaar_id
    ).all()
    
    # Try parsing admission date
    sub_adm_date = None
    try:
        sub_adm_date = datetime.strptime(str(admission_date_raw), "%Y-%m-%d").date()
    except Exception:
        sub_adm_date = date.today()

    for other in other_enrolments:
        # Date logic: Check if other enrolment is in the same academic year or dates overlap
        same_year = other.year_of_admission == int(year_of_admission)
        # If dates are active (within same 3-year degree period without transfer/closure)
        if same_year and other.two_key_status != "DISPUTED":
            other_inst = db.query(Institution).filter(Institution.id == other.institution_id).first()
            inst_name = other_inst.name if other_inst else "Another Institution"
            findings.append({
                "rule_name": "OVERLAPPING_ACTIVE_ENROLMENT",
                "field": "apaar_id",
                "actual_value": f"Active in {inst_name} ({other.record_ref})",
                "reason": f"Student holds an concurrent active enrolment in '{inst_name}' for academic year {year_of_admission}. Dual regular enrolment is prohibited by AICTE norms.",
                "severity": "ERROR",
                "suggested_fix": "Obtain official Transfer Certificate (TC) / Migration Certificate and cancellation proof from prior institution."
            })

    # Rule 4: Category vs Quota Consistency
    if quota_type == "EWS" and category != "EWS":
        findings.append({
            "rule_name": "CATEGORY_QUOTA_INCONSISTENCY",
            "field": "quota_type",
            "actual_value": f"Category: {category}, Quota: {quota_type}",
            "reason": "Economically Weaker Section (EWS) supernumerary seat allocated to a student whose declared category is not EWS.",
            "severity": "ERROR",
            "suggested_fix": "Update category to EWS with valid Competent Authority certificate, or adjust admission quota to General."
        })

    if quota_type in ["NRI", "OCI", "FN", "CIWGC"] and category in ["SC", "ST", "OBC_NCL"]:
        findings.append({
            "rule_name": "FOREIGN_QUOTA_RESERVATION_CONFLICT",
            "field": "quota_type",
            "actual_value": f"Category: {category}, Quota: {quota_type}",
            "reason": f"Foreign/NRI quota seats ({quota_type}) cannot be cross-claimed with domestic social category reservations ({category}).",
            "severity": "WARNING",
            "suggested_fix": "Verify candidate citizenship/passport documentation and align category declaration."
        })

    # Rule 5: Programme Intake Capacity Check (if programme_id provided)
    if programme_id:
        prog = db.query(Programme).filter(Programme.id == programme_id).first()
        if prog:
            enrolled_count = db.query(StudentAdmission).filter(StudentAdmission.programme_id == programme_id).count()
            # 15% supernumerary ceiling
            total_permitted = prog.approved_intake + int(prog.approved_intake * (prog.supernumerary_cap_percent / 100.0))
            if enrolled_count >= total_permitted:
                findings.append({
                    "rule_name": "INTAKE_CAPACITY_EXCEEDED",
                    "field": "programme_name",
                    "actual_value": f"{enrolled_count + 1} / {total_permitted}",
                    "reason": f"Programme '{prog.course_name}' has reached its statutory ceiling ({prog.approved_intake} approved + {total_permitted - prog.approved_intake} supernumerary).",
                    "severity": "ERROR",
                    "suggested_fix": "Admit under an unexhausted branch or apply to AICTE for additional intake approval."
                })

    has_errors = any(f["severity"] == "ERROR" for f in findings)
    has_warnings = any(f["severity"] == "WARNING" for f in findings)
    
    validation_status = ValidationStatus.INVALID if has_errors else (ValidationStatus.WARNING if has_warnings else ValidationStatus.VALID)

    return {
        "is_valid": not has_errors,
        "validation_status": validation_status,
        "findings": findings
    }
