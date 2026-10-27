from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class VerifyLookupRequest(BaseModel):
    record_ref: Optional[str] = None
    apaar_id: Optional[str] = None
    signed_token: Optional[str] = None
    verifier_name: str = "Authorized Verifier"
    verifier_organization: str = "Recruitment & Regulatory Verification Service"
    verification_purpose: str = "ACADEMIC_CREDENTIAL_CHECK"

class VerifierAccessLogItem(BaseModel):
    timestamp: datetime
    verifier_organization: str
    verification_purpose: str

class VerificationResultResponse(BaseModel):
    is_valid: bool
    record_ref: str
    enrolled_status: str # "Active Enrolment Verified", "Record Disputed", "Not Found"
    programme_name: str
    course_name: str
    institution_name: str
    institution_state: str
    year_of_admission: int
    admission_date: str
    apaar_id_masked: str # e.g. "9842 **** 1092"
    student_initials: str # e.g. "A. S."
    signed_token: str
    verification_timestamp: datetime
    qr_data_uri: str
    recent_verifications: List[VerifierAccessLogItem] = []
