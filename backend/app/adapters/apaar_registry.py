from typing import Optional, Dict
from backend.app.adapters.base import BaseApaarRegistryAdapter, ApaarRegistryRecord

class MockApaarRegistryAdapter(BaseApaarRegistryAdapter):
    """
    Mock adapter representing the National Academic Bank of Credits (ABC / APAAR) Central Registry.
    In production, this queries the DigiLocker / APAAR Verifiable Credential API via Aadhaar Vault token.
    """
    def __init__(self):
        # In-memory registry cache for planted special cases
        self._registry_db: Dict[str, ApaarRegistryRecord] = {}
        
        # Planted known records
        self.register_record(ApaarRegistryRecord(
            apaar_id="123456789012",
            full_name="Aarav Sharma",
            dob="2005-04-12",
            gender="Male",
            mobile_masked="+91 ******4521"
        ))
        self.register_record(ApaarRegistryRecord(
            apaar_id="987654321098",
            full_name="Pooja Lakshmi Sundaram",
            dob="2004-11-20",
            gender="Female",
            mobile_masked="+91 ******8890"
        ))
        # Planted transliteration case: Registry has "Mohd Tariq Khan", College submitted "Mohammed Tariq Khan"
        self.register_record(ApaarRegistryRecord(
            apaar_id="445566778899",
            full_name="Mohd Tariq Khan",
            dob="2005-08-15",
            gender="Male",
            mobile_masked="+91 ******3104"
        ))
        # Planted genuine mismatch: Registry has "Sneha Roy", College submitted "Sunita Roy"
        self.register_record(ApaarRegistryRecord(
            apaar_id="112233445566",
            full_name="Sneha Roy",
            dob="2005-01-10",
            gender="Female",
            mobile_masked="+91 ******1122"
        ))

    def register_record(self, record: ApaarRegistryRecord):
        self._registry_db[record.apaar_id] = record

    def lookup(self, apaar_id: str) -> Optional[ApaarRegistryRecord]:
        apaar_clean = str(apaar_id).strip()
        # Invalid format or unassigned test range
        if len(apaar_clean) != 12 or not apaar_clean.isdigit():
            return None
        if apaar_clean.startswith("0000") or apaar_clean.endswith("0000"):
            return None # Simulated unregistered APAAR ID
            
        if apaar_clean in self._registry_db:
            return self._registry_db[apaar_clean]
            
        # Dynamically synthesize valid citizen registry record for synthetic dataset testing
        # using deterministic seed based on APAAR ID digits
        last_digits = int(apaar_clean[-4:])
        genders = ["Male", "Female", "Other"]
        gender = genders[last_digits % 2]
        
        return ApaarRegistryRecord(
            apaar_id=apaar_clean,
            full_name="Citizen Synthetic Record",
            dob="2005-06-15",
            gender=gender,
            mobile_masked=f"+91 ******{str(last_digits).zfill(4)}"
        )

apaar_registry_adapter = MockApaarRegistryAdapter()
