from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel

class ProgrammeSummary(BaseModel):
    id: str
    programme_name: str
    course_name: str
    level: str
    approved_intake: int
    supernumerary_cap_percent: float
    nri_quota_percent: float
    is_nba_accredited: bool
    enrolled_count: int = 0
    supernumerary_enrolled: int = 0
    unconfirmed_count: int = 0
    disputed_count: int = 0

class InstitutionResponse(BaseModel):
    id: str
    aicte_id: str
    name: str
    state: str
    region: str
    address: str
    nodal_officer_name: str
    nodal_officer_email: str
    nodal_officer_phone_masked: str
    status: str
    review_score: int
    review_reasons: List[str]
    total_approved_intake: int
    total_enrolled: int
    unconfirmed_rate: float
    open_flags_count: int
    programmes: List[ProgrammeSummary] = []

class InstitutionOverviewStats(BaseModel):
    total_institutions: int
    total_approved_intake: int
    total_admissions: int
    total_unconfirmed: int
    total_disputed: int
    flagged_institutions_count: int
    national_intake_utilisation_pct: float
    weekly_admissions: List[dict] = []
