from typing import Optional, Dict
from backend.app.adapters.base import BaseAllotmentListAdapter, AllotmentRecord

class MockAllotmentListAdapter(BaseAllotmentListAdapter):
    """
    Mock adapter representing State Centralised Admission Portals
    (e.g., MHT-CET, KCET, TNEA, WBJEE, UPSEE counselling lists).
    Verifies that state quota/reserved quota admissions possess a genuine seat allotment letter.
    """
    def __init__(self):
        self._allotment_db: Dict[str, AllotmentRecord] = {}
        
        # Planted known genuine allotments
        self.register_allotment(AllotmentRecord(
            apaar_id="123456789012",
            candidate_name="Aarav Sharma",
            state_code="MH",
            allotted_institute_code="1-10928371",
            allotted_course="B.Tech Computer Science & Engineering",
            allotted_quota="STATE_ALLOTMENT",
            merit_rank=4812
        ))

    def register_allotment(self, record: AllotmentRecord):
        self._allotment_db[f"{record.apaar_id}:{record.allotted_institute_code}"] = record

    def verify_allotment(self, apaar_id: str, institute_code: str, course_name: str, quota_type: str) -> Optional[AllotmentRecord]:
        key = f"{apaar_id}:{institute_code}"
        if key in self._allotment_db:
            return self._allotment_db[key]
        
        # Planted scenario: APAAR ID starting with '999' is explicitly missing from State Allotment
        if str(apaar_id).startswith("999"):
            return None
            
        # Non-state quota types (e.g. NRI, FN, Management) do not require state allotment list match
        if quota_type in ["NRI", "OCI", "FN", "CIWGC", "MANAGEMENT"]:
            return None
            
        # Default fallback for regular admissions in synthetic mock
        return AllotmentRecord(
            apaar_id=apaar_id,
            candidate_name="Verified State Allottee",
            state_code="GEN",
            allotted_institute_code=institute_code,
            allotted_course=course_name,
            allotted_quota=quota_type,
            merit_rank=12400
        )

allotment_list_adapter = MockAllotmentListAdapter()
