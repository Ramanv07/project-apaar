from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel

class PolicyVersionResponse(BaseModel):
    id: str
    version_code: str
    handbook_name: str
    description: str
    effective_from: date
    effective_to: Optional[date] = None
    policy_json: Dict[str, Any]

class QuotaWaterfallBreakdown(BaseModel):
    programme_id: str
    course_name: str
    approved_intake: int
    regular_admissions: int
    supernumerary_permitted: int
    supernumerary_admissions: int
    ews_seats: int
    ews_admitted: int
    tfw_seats: int
    tfw_admitted: int
    fn_oci_seats: int
    fn_oci_admitted: int
    nri_seats: int
    nri_admitted: int
    supernumerary_unfilled_transferred_to_nri: int
    is_compliant: bool
    breach_count: int
    reasons: List[str]

class WhatIfSimulationRequest(BaseModel):
    policy_version_code: Optional[str] = "AICTE-APH-2025-V2"
    supernumerary_cap_percent: float # e.g. 15.0 or 20.0
    nri_quota_percent: float          # e.g. 5.0
    allow_tfw_cascade_to_nri: bool = False

class ImpactedProgrammeDetail(BaseModel):
    institution_name: str
    state: str
    course_name: str
    approved_intake: int
    enrolled_count: int
    prior_status: str
    simulated_status: str
    delta_headroom: int

class WhatIfSimulationResponse(BaseModel):
    current_compliant_programmes: int
    current_non_compliant_programmes: int
    simulated_compliant_programmes: int
    simulated_non_compliant_programmes: int
    newly_non_compliant_count: int
    newly_compliant_count: int
    impacted_programmes: List[ImpactedProgrammeDetail]
