import pytest
from datetime import date
from backend.app.database import SessionLocal
from backend.app.models.institution import Institution, Programme
from backend.app.engine.validation_engine import validate_single_admission_record

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_missing_or_malformed_apaar(db_session):
    inst = db_session.query(Institution).first()
    bad_record = {
        "apaar_id": "12345", # malformed (5 digits)
        "student_name": "Test Student",
        "dob": "2005-01-01",
        "gender": "Male",
        "programme_name": "Engineering",
        "course_name": "B.Tech",
        "year_of_admission": 2025,
        "admission_date": "2025-07-15",
        "mobile": "9812345678",
        "email": "test@gmail.com",
        "category": "GENERAL",
        "quota_type": "GENERAL"
    }
    res = validate_single_admission_record(db_session, bad_record, inst.id)
    assert res["is_valid"] is False
    assert any(f["rule_name"] == "APAAR_FORMAT_VALIDATION" for f in res["findings"])

def test_category_quota_inconsistency(db_session):
    inst = db_session.query(Institution).first()
    # Admitting a non-EWS category candidate into an EWS supernumerary quota seat
    record = {
        "apaar_id": "123456789012",
        "student_name": "Aarav Sharma",
        "dob": "2005-04-12",
        "gender": "Male",
        "programme_name": "Engineering",
        "course_name": "B.Tech",
        "year_of_admission": 2025,
        "admission_date": "2025-07-15",
        "mobile": "9812345678",
        "email": "test@gmail.com",
        "category": "GENERAL", # Not EWS!
        "quota_type": "EWS"
    }
    res = validate_single_admission_record(db_session, record, inst.id)
    assert res["is_valid"] is False
    assert any(f["rule_name"] == "CATEGORY_QUOTA_INCONSISTENCY" for f in res["findings"])

def test_overlapping_active_enrolment_detection(db_session):
    # Rohan Manish Desai is planted in Bagalkot (Karnataka)
    # Attempting to enroll him concurrently in Vasai (Maharashtra) for same academic year
    vasai_inst = db_session.query(Institution).filter(Institution.aicte_id == "1-10928371").first()
    duplicate_record = {
        "apaar_id": "887766554433", # Planted overlapping student
        "student_name": "Rohan Manish Desai",
        "dob": "2005-03-14",
        "gender": "Male",
        "programme_name": "Engineering & Technology",
        "course_name": "B.Tech Computer Science & Engineering",
        "year_of_admission": 2025,
        "admission_date": "2025-07-15",
        "mobile": "9820011223",
        "email": "rohan.desai@gmail.com",
        "category": "GENERAL",
        "quota_type": "GENERAL"
    }
    res = validate_single_admission_record(db_session, duplicate_record, vasai_inst.id)
    # Already actively enrolled in another institution for same academic year
    assert any(f["rule_name"] in ["OVERLAPPING_ACTIVE_ENROLMENT", "INSTITUTION_DUPLICATE_ENROLMENT"] for f in res["findings"])
