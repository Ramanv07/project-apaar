from typing import List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel, Field

class AdmissionRecordInput(BaseModel):
    apaar_id: str = Field(..., description="12-digit APAAR/ABC ID")
    student_name: str
    dob: str = Field(..., description="YYYY-MM-DD")
    gender: str # Male, Female, Other
    programme_name: str
    course_name: str
    year_of_admission: int
    admission_date: str = Field(..., description="YYYY-MM-DD")
    student_id_enrolment: str
    mobile: str = Field(..., description="Raw 10-digit mobile number for hashing and masking")
    email: str = Field(..., description="Email for hashing and masking")
    category: str # GENERAL, OBC_NCL, SC, ST, EWS
    quota_type: str # GENERAL, EWS, TFW, NRI, OCI, FN, CIWGC, MANAGEMENT, STATE_ALLOTMENT
    supernumerary_flag: bool = False

class ValidationFinding(BaseModel):
    rule_name: str
    field: str
    actual_value: Optional[str] = None
    reason: str
    severity: str # ERROR, WARNING, INFO
    suggested_fix: str

class DryRunRowResult(BaseModel):
    row_index: int
    is_valid: bool
    data: dict
    findings: List[ValidationFinding] = []

class DryRunResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    warning_rows: int
    has_blocking_errors: bool
    results: List[DryRunRowResult]

class SubmitAdmissionsRequest(BaseModel):
    records: List[AdmissionRecordInput]
    institution_id: Optional[str] = None

class AdmissionDetailResponse(BaseModel):
    id: str
    record_ref: str
    institution_id: str
    institution_name: Optional[str] = None
    programme_id: str
    programme_name: Optional[str] = None
    course_name: Optional[str] = None
    apaar_id: str
    student_name: str
    dob: date
    gender: str
    year_of_admission: int
    admission_date: date
    student_id_enrolment: str
    mobile_masked: str
    email_masked: str
    category: str
    quota_type: str
    supernumerary_flag: bool
    two_key_status: str
    confirmation_token: str
    confirmation_timestamp: Optional[datetime] = None
    student_remarks: Optional[str] = None
    dispute_reason: Optional[str] = None
    validation_status: str
    validation_findings: List[Any]
    review_flags: List[Any]
    downstream_activity_flag: bool
    name_mismatch_resolved: bool
    created_at: datetime

class NameMismatchResolveRequest(BaseModel):
    admission_id: str
    approved: bool
    officer_notes: str

class TwoKeyActionRequest(BaseModel):
    token: str
    confirm: bool # True = Confirm, False = Report Incorrect / Dispute
    dispute_reason: Optional[str] = None
    student_remarks: Optional[str] = None
