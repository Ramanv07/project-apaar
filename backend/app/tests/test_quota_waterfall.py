import pytest
from datetime import date
from backend.app.models.institution import Programme
from backend.app.models.student import StudentAdmission
from backend.app.engine.quota_waterfall import evaluate_programme_waterfall

def create_mock_prog(approved=120, accredited=True):
    p = Programme(
        id="test-prog-1",
        institution_id="test-inst-1",
        programme_name="Engineering & Technology",
        course_name="B.Tech Computer Science",
        level="UG",
        approved_intake=approved,
        supernumerary_cap_percent=15.0,
        nri_quota_percent=5.0,
        is_nba_accredited=accredited
    )
    return p

def create_admissions_batch(regular=100, ews=10, tfw=5, nri=6, fn=0):
    admissions = []
    # Regular admissions
    for i in range(regular):
        admissions.append(StudentAdmission(
            apaar_id=f"1000000000{i:02d}",
            quota_type="GENERAL",
            supernumerary_flag=False,
            two_key_status="STUDENT_CONFIRMED",
            admission_date=date(2025, 7, 10)
        ))
    # EWS
    for i in range(ews):
        admissions.append(StudentAdmission(
            apaar_id=f"2000000000{i:02d}",
            quota_type="EWS",
            supernumerary_flag=True,
            two_key_status="STUDENT_CONFIRMED",
            admission_date=date(2025, 7, 10)
        ))
    # TFW
    for i in range(tfw):
        admissions.append(StudentAdmission(
            apaar_id=f"3000000000{i:02d}",
            quota_type="TFW",
            supernumerary_flag=True,
            two_key_status="STUDENT_CONFIRMED",
            admission_date=date(2025, 7, 10)
        ))
    # NRI
    for i in range(nri):
        admissions.append(StudentAdmission(
            apaar_id=f"4000000000{i:02d}",
            quota_type="NRI",
            supernumerary_flag=False,
            two_key_status="STUDENT_CONFIRMED",
            admission_date=date(2025, 7, 10)
        ))
    return admissions

def test_compliant_waterfall():
    policy = {
        "supernumerary_cap_percent": 15.0,
        "sub_quotas": {
            "EWS": {"cap_percent_of_intake": 10.0},
            "TFW": {"cap_percent_of_intake": 5.0},
            "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0},
            "NRI": {"cap_percent_of_intake": 5.0}
        },
        "cascade_rules": {"allow_vacant_supernumerary_to_nri": True, "max_cascaded_nri_seats": 5}
    }
    prog = create_mock_prog(approved=120, accredited=True)
    # 100 regular, 10 EWS (<=12), 5 TFW (<=6), 6 NRI (base is 6 + cascaded up to 5 = 11)
    admissions = create_admissions_batch(regular=100, ews=10, tfw=5, nri=6)
    res = evaluate_programme_waterfall(prog, admissions, policy)
    assert res["is_compliant"] is True
    assert res["breach_count"] == 0

def test_over_intake_breach():
    policy = {
        "supernumerary_cap_percent": 15.0,
        "sub_quotas": {
            "EWS": {"cap_percent_of_intake": 10.0},
            "TFW": {"cap_percent_of_intake": 5.0},
            "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0},
            "NRI": {"cap_percent_of_intake": 5.0}
        },
        "cascade_rules": {"allow_vacant_supernumerary_to_nri": False}
    }
    prog = create_mock_prog(approved=120, accredited=False)
    # 125 regular admissions against approved intake of 120 -> breach of 5
    admissions = create_admissions_batch(regular=125, ews=5, tfw=3, nri=2)
    res = evaluate_programme_waterfall(prog, admissions, policy)
    assert res["is_compliant"] is False
    assert res["breach_count"] >= 5
    assert any("Approved intake ceiling breached" in r for r in res["reasons"])

def test_cascade_requires_accreditation():
    policy = {
        "supernumerary_cap_percent": 15.0,
        "sub_quotas": {
            "EWS": {"cap_percent_of_intake": 10.0},
            "TFW": {"cap_percent_of_intake": 5.0},
            "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0},
            "NRI": {"cap_percent_of_intake": 5.0} # 5% of 120 = 6 seats
        },
        "cascade_rules": {"allow_vacant_supernumerary_to_nri": True, "max_cascaded_nri_seats": 5}
    }
    # Unaccredited programme cannot cascade vacant seats to NRI
    prog_unaccredited = create_mock_prog(approved=120, accredited=False)
    admissions = create_admissions_batch(regular=90, ews=5, tfw=2, nri=9) # 9 NRI against 6 base cap
    res = evaluate_programme_waterfall(prog_unaccredited, admissions, policy)
    assert res["is_compliant"] is False
    assert any("absence of NBA accreditation" in r for r in res["reasons"])
