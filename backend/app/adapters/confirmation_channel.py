from typing import List, Dict
from datetime import datetime, timezone
from backend.app.adapters.base import BaseStudentConfirmationChannel

class MockStudentConfirmationChannel(BaseStudentConfirmationChannel):
    """
    Mock adapter representing government SMS Gateway / DigiLocker notification service.
    Dispatches secure tokenized URLs to the student's registered mobile number for Key-2 confirmation.
    """
    def __init__(self):
        self.dispatched_notifications: List[Dict[str, str]] = []

    def send_confirmation_link(self, apaar_id: str, mobile_masked: str, student_name: str, token: str) -> bool:
        message = {
            "apaar_id": apaar_id,
            "student_name": student_name,
            "mobile_masked": mobile_masked,
            "confirmation_token": token,
            "confirmation_url": f"/confirm-admission/{token}",
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
            "status": "DELIVERED_SIMULATED"
        }
        self.dispatched_notifications.append(message)
        return True

confirmation_channel_adapter = MockStudentConfirmationChannel()
