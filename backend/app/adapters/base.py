from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import date

class ApaarRegistryRecord:
    def __init__(self, apaar_id: str, full_name: str, dob: str, gender: str, mobile_masked: str, is_active: bool = True):
        self.apaar_id = apaar_id
        self.full_name = full_name
        self.dob = dob # YYYY-MM-DD
        self.gender = gender
        self.mobile_masked = mobile_masked
        self.is_active = is_active

class AllotmentRecord:
    def __init__(self, apaar_id: str, candidate_name: str, state_code: str, allotted_institute_code: str, allotted_course: str, allotted_quota: str, merit_rank: int):
        self.apaar_id = apaar_id
        self.candidate_name = candidate_name
        self.state_code = state_code
        self.allotted_institute_code = allotted_institute_code
        self.allotted_course = allotted_course
        self.allotted_quota = allotted_quota
        self.merit_rank = merit_rank

class BaseApaarRegistryAdapter(ABC):
    @abstractmethod
    def lookup(self, apaar_id: str) -> Optional[ApaarRegistryRecord]:
        pass

class BaseAllotmentListAdapter(ABC):
    @abstractmethod
    def verify_allotment(self, apaar_id: str, institute_code: str, course_name: str, quota_type: str) -> Optional[AllotmentRecord]:
        pass

class BaseStudentConfirmationChannel(ABC):
    @abstractmethod
    def send_confirmation_link(self, apaar_id: str, mobile_masked: str, student_name: str, token: str) -> bool:
        pass
