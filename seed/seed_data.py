import os
import sys
import json
import random
import secrets
import hashlib
from datetime import datetime, date, timedelta, timezone

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, SessionLocal, Base
import backend.app.models as models
from backend.app.auth.security import get_password_hash
from backend.app.engine.validation_engine import hash_identifier, mask_mobile, mask_email
from backend.app.adapters.apaar_registry import apaar_registry_adapter, ApaarRegistryRecord
from backend.app.adapters.allotment_list import allotment_list_adapter, AllotmentRecord

# Realistic Indian Institutional Names across 8 States
REALISTIC_INSTITUTIONS = [
    # Maharashtra (Western Region)
    {"aicte_id": "1-10928371", "name": "Vidyavardhini College of Engineering and Technology", "state": "Maharashtra", "region": "Western", "address": "K.T. Marg, Vasai Road West, Palghar, Maharashtra 401202", "officer": "Dr. Sunil Patil", "email": "nodal.vcet@maha-edu.ac.in"},
    {"aicte_id": "1-10492811", "name": "Apex Institute of Engineering & Applied Sciences", "state": "Maharashtra", "region": "Western", "address": "Sector 14, Hinjewadi Phase 2, Pune, Maharashtra 411057", "officer": "Prof. Rajesh Deshmukh", "email": "nodal.apex@pune-edu.ac.in"},
    {"aicte_id": "1-10884912", "name": "Sahyadri Institute of Technology and Management", "state": "Maharashtra", "region": "Western", "address": "Karad Road, Satara, Maharashtra 415004", "officer": "Dr. Meenakshi Kulkarni", "email": "nodal@sahyadri-satara.ac.in"},
    {"aicte_id": "1-10293847", "name": "Vidarbha Institute of Polytechnic & Technology", "state": "Maharashtra", "region": "Western", "address": "Hingna Road, Nagpur, Maharashtra 440016", "officer": "Dr. Anil Bhowmick", "email": "nodal@vidarbha-tech.edu.in"},
    
    # Uttar Pradesh (Northern Region)
    {"aicte_id": "1-10112233", "name": "Shri Ramswaroop Memorial Institute of Engineering", "state": "Uttar Pradesh", "region": "Northern", "address": "Tiwariganj, Faizabad Road, Lucknow, Uttar Pradesh 226028", "officer": "Dr. Pradeep Srivastava", "email": "nodal@srmie-lko.ac.in"},
    {"aicte_id": "1-10554433", "name": "Babu Banarasi Das Northern Institute of Technology", "state": "Uttar Pradesh", "region": "Northern", "address": "BBD City, Faizabad Road, Barabanki, Uttar Pradesh 225001", "officer": "Prof. Archana Mishra", "email": "nodal@bbdnit.ac.in"},
    {"aicte_id": "1-10998877", "name": "Institute of Technology & Advanced Management", "state": "Uttar Pradesh", "region": "Northern", "address": "Delhi-Meerut Bypass Road, Meerut, Uttar Pradesh 250005", "officer": "Er. Devendra Singh", "email": "nodal@itam-meerut.edu.in"},
    {"aicte_id": "1-10667788", "name": "Kashi Institute of Engineering & Technology", "state": "Uttar Pradesh", "region": "Northern", "address": "Mirzamurad, GT Road, Varanasi, Uttar Pradesh 221307", "officer": "Dr. Harish Chandra Pandey", "email": "nodal@kashi-tech.ac.in"},

    # Karnataka (South-Western Region)
    {"aicte_id": "1-10334455", "name": "Basaveshwar Technological Institute", "state": "Karnataka", "region": "South-Western", "address": "Vidyagiri, Bagalkot, Karnataka 587102", "officer": "Dr. Mallikarjun Reddy", "email": "nodal@basav-tech.ac.in"},
    {"aicte_id": "1-10778899", "name": "Siddaganga Institute of Science and Technology", "state": "Karnataka", "region": "South-Western", "address": "B.H. Road, Tumakuru, Karnataka 572103", "officer": "Prof. S. Shivanna", "email": "nodal@siddaganga-tumkur.edu.in"},
    {"aicte_id": "1-10445566", "name": "Bapuji Institute of Engineering and Management", "state": "Karnataka", "region": "South-Western", "address": "Shamanur Road, Davanagere, Karnataka 577004", "officer": "Dr. C.K. Manjunath", "email": "nodal@bapuji-davanagere.ac.in"},

    # Tamil Nadu (Southern Region)
    {"aicte_id": "1-10556677", "name": "Kongu Engineering Institute and Research Centre", "state": "Tamil Nadu", "region": "Southern", "address": "Perundurai, Erode, Tamil Nadu 638060", "officer": "Dr. R. Venkatasubramanian", "email": "nodal@kongu-erode.ac.in"},
    {"aicte_id": "1-10889900", "name": "M. Kumarasamy Technological Campus", "state": "Tamil Nadu", "region": "Southern", "address": "Thalavapalayam, Karur, Tamil Nadu 639113", "officer": "Prof. N. Sivakumar", "email": "nodal@mktc-karur.ac.in"},
    {"aicte_id": "1-10223344", "name": "Sri Krishna Institute of Technology", "state": "Tamil Nadu", "region": "Southern", "address": "Kuniamuthur, Coimbatore, Tamil Nadu 641008", "officer": "Dr. V. Murugesan", "email": "nodal@skit-cbe.edu.in"},

    # Gujarat (North-Western Region)
    {"aicte_id": "1-10668822", "name": "Sarvajanik Institute of Engineering and Technology", "state": "Gujarat", "region": "North-Western", "address": "Athwalines, Surat, Gujarat 395001", "officer": "Dr. Hitesh Shah", "email": "nodal@sarvajanik-surat.edu.in"},
    {"aicte_id": "1-10991133", "name": "Marwadi Technological Institute", "state": "Gujarat", "region": "North-Western", "address": "Rajkot-Morbi Road, Rajkot, Gujarat 360003", "officer": "Prof. Bhavesh Joshi", "email": "nodal@marwadi-rajkot.ac.in"},
    {"aicte_id": "1-10442211", "name": "Birla Vishvakarma Mahavidyalaya", "state": "Gujarat", "region": "North-Western", "address": "Vallabh Vidyanagar, Anand, Gujarat 388120", "officer": "Dr. T.D. Bhatt", "email": "nodal@bvm-anand.ac.in"},

    # Telangana (South-Central Region)
    {"aicte_id": "1-10332211", "name": "VNR Vignana Institute of Engineering", "state": "Telangana", "region": "South-Central", "address": "Bachupally, Hyderabad, Telangana 500090", "officer": "Dr. K. Srinivas Rao", "email": "nodal@vnr-hyd.ac.in"},
    {"aicte_id": "1-10773344", "name": "Kakatiya Institute of Technology & Science", "state": "Telangana", "region": "South-Central", "address": "Yerragattu Gutta, Warangal, Telangana 506015", "officer": "Prof. B. Ram Mohan", "email": "nodal@kits-wgl.ac.in"},

    # West Bengal (Eastern Region)
    {"aicte_id": "1-10115599", "name": "Meghnad Saha Institute of Technology", "state": "West Bengal", "region": "Eastern", "address": "Nazirabad, Uchhepota, Kolkata, West Bengal 700150", "officer": "Dr. Debasis De", "email": "nodal@msit-kolkata.ac.in"},
    {"aicte_id": "1-10882266", "name": "Netaji Subhash Engineering College", "state": "West Bengal", "region": "Eastern", "address": "Techno City, Garia, Kolkata, West Bengal 700152", "officer": "Prof. Sudipta Ghosh", "email": "nodal@nsec-kolkata.ac.in"},
    {"aicte_id": "1-10663399", "name": "Asansol Engineering College", "state": "West Bengal", "region": "Eastern", "address": "Kanyapur, Asansol, Paschim Bardhaman, West Bengal 713305", "officer": "Dr. Joydeep Chatterjee", "email": "nodal@aec-asansol.ac.in"},

    # Odisha (Eastern Region)
    {"aicte_id": "1-10772199", "name": "Kalinga Institute of Engineering and Technology", "state": "Odisha", "region": "Eastern", "address": "Patia, Bhubaneswar, Odisha 751024", "officer": "Dr. Satyabrata Das", "email": "nodal@kiet-bbsr.ac.in"},
    {"aicte_id": "1-10447788", "name": "Silicon Institute of Technology", "state": "Odisha", "region": "Eastern", "address": "Silicon Hills, Patia, Bhubaneswar, Odisha 751024", "officer": "Prof. Niranjan Rout", "email": "nodal@silicon-bbsr.ac.in"},
    {"aicte_id": "1-10994422", "name": "Gandhi Institute for Technology (GIFT)", "state": "Odisha", "region": "Eastern", "address": "Gramadiha, Gangapada, Bhubaneswar, Odisha 752054", "officer": "Dr. Bibhuti Bhusan Pradhan", "email": "nodal@gift-bbsr.ac.in"}
]

PROGRAMMES_DEF = [
    {"programme_name": "Engineering & Technology", "course_name": "B.Tech Computer Science & Engineering", "level": "UG", "approved_intake": 120, "is_nba": True},
    {"programme_name": "Engineering & Technology", "course_name": "B.Tech Electronics & Communication Engineering", "level": "UG", "approved_intake": 60, "is_nba": False},
    {"programme_name": "Engineering & Technology", "course_name": "B.Tech Mechanical Engineering", "level": "UG", "approved_intake": 60, "is_nba": False},
    {"programme_name": "Management", "course_name": "Master of Business Administration (MBA)", "level": "PG", "approved_intake": 60, "is_nba": True},
    {"programme_name": "Computer Applications", "course_name": "Master of Computer Applications (MCA)", "level": "PG", "approved_intake": 60, "is_nba": False}
]

FIRST_NAMES = [
    "Aarav", "Aaditya", "Advait", "Akash", "Ananya", "Anushka", "Aryan", "Atharv", "Ayush",
    "Bhavya", "Chaitanya", "Chinmay", "Dev", "Dhruv", "Diya", "Gauri", "Harsh", "Ishaan",
    "Kavya", "Khushi", "Krish", "Manish", "Meera", "Mohit", "Nandini", "Navya", "Nikhil",
    "Om", "Pranav", "Pranjal", "Rhea", "Rohan", "Saanvi", "Samarth", "Sarthak", "Shaurya",
    "Shivansh", "Shreya", "Tanvi", "Utkarsh", "Vaishnavi", "Varun", "Vedant", "Vansh", "Yash",
    "Zoya", "Arjun", "Karthik", "Sneha", "Rahul", "Priya", "Ankit", "Pooja", "Vikram", "Neha",
    "Deepak", "Nisha", "Amit", "Swati", "Suresh", "Kavita", "Ravi", "Sunita", "Manoj", "Seema",
    "Alok", "Ritu", "Sanjay", "Anjali", "Dinesh", "Preeti", "Rajesh", "Jyoti", "Mukesh", "Rekha",
    "Sunil", "Aarti", "Pankaj", "Vandana", "Mahesh", "Sangeeta", "Hemant", "Meena", "Sachin", "Usha",
    "Jitendra", "Shashi", "Anand", "Pushpa", "Ashok", "Sarita", "Ramesh", "Santosh", "Santoshi", "Lata",
    "Vignesh", "Sundaram", "Subramanian", "Murugan", "Lakshmanan", "Selvi", "Kaviarasan", "Balamurugan",
    "Sourav", "Debabrata", "Subhashree", "Subham", "Madhurima", "Anirban", "Shubhangi", "Biswajit"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Saxena", "Chauhan", "Yadav", "Tiwari",
    "Pandey", "Mishra", "Shukla", "Dubey", "Tripathi", "Pathak", "Patel", "Shah", "Mehta",
    "Desai", "Joshi", "Dave", "Kulkarni", "Deshmukh", "Jadhav", "Patil", "Pawar", "Shinde",
    "Gaikwad", "More", "Bhosale", "Reddy", "Rao", "Naidu", "Chowdary", "Prasad", "Murthy",
    "Iyer", "Iyengar", "Nair", "Menon", "Pillai", "Kurup", "Balakrishnan", "Banerjee", "Chatterjee",
    "Mukherjee", "Bhattacharya", "Dutta", "Ghosh", "Roy", "Das", "Sengupta", "Majumdar", "Mohanty",
    "Patnaik", "Nayak", "Behera", "Sahu", "Panda", "Dash", "Samantaray", "Pradhan", "Rout", "Biswal",
    "Khan", "Ansari", "Siddiqui", "Qureshi", "Farooqui", "Ahmed", "Mirza", "Begum", "Shaikh"
]

CATEGORIES = ["GENERAL", "OBC_NCL", "SC", "ST", "EWS"]
CATEGORY_WEIGHTS = [0.45, 0.27, 0.15, 0.05, 0.08]

QUOTAS = ["GENERAL", "EWS", "TFW", "STATE_ALLOTMENT", "MANAGEMENT", "NRI", "FN", "OCI", "CIWGC"]
QUOTA_WEIGHTS = [0.55, 0.08, 0.05, 0.20, 0.07, 0.02, 0.01, 0.01, 0.01]

def run_seed():
    db = SessionLocal()
    try:
        print("[TrustSeat] Initializing database tables...")
        Base.metadata.create_all(bind=engine)

        # Clear existing data for clean idempotent seed
        db.query(models.AuditLog).delete()
        db.query(models.ConsentRecord).delete()
        db.query(models.VerificationLog).delete()
        db.query(models.StudentAdmission).delete()
        db.query(models.Programme).delete()
        db.query(models.User).delete()
        db.query(models.Institution).delete()
        db.query(models.QuotaPolicyRule).delete()
        db.commit()

        print("[TrustSeat] Seeding Versioned Quota Policy Rules...")
        # 1. Policy Versions
        policy_2024 = models.QuotaPolicyRule(
            version_code="AICTE-APH-2024-V1",
            handbook_name="AICTE Approval Process Handbook 2024-25",
            effective_from=date(2024, 1, 1),
            effective_to=date(2024, 12, 31),
            description="Baseline 15% supernumerary cap with strict departmental ring-fencing without NRI cascade.",
            policy_json={
                "supernumerary_cap_percent": 15.0,
                "sub_quotas": {
                    "EWS": {"cap_percent_of_intake": 10.0, "is_supernumerary": True},
                    "TFW": {"cap_percent_of_intake": 5.0, "is_supernumerary": True},
                    "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0, "is_supernumerary": True},
                    "NRI": {"cap_percent_of_intake": 5.0, "is_supernumerary": False}
                },
                "cascade_rules": {"allow_vacant_supernumerary_to_nri": False}
            }
        )
        policy_2025 = models.QuotaPolicyRule(
            version_code="AICTE-APH-2025-V2",
            handbook_name="AICTE Approval Process Handbook 2025-26",
            effective_from=date(2025, 1, 1),
            effective_to=None,
            description="Revised Approval Process Handbook permitting 20% aggregate supernumerary ceiling and conditioned cascade of vacant FN/OCI seats to NRI in accredited programmes.",
            policy_json={
                "supernumerary_cap_percent": 20.0,
                "sub_quotas": {
                    "EWS": {"cap_percent_of_intake": 10.0, "is_supernumerary": True},
                    "TFW": {"cap_percent_of_intake": 5.0, "is_supernumerary": True},
                    "FN_OCI_CIWGC": {"cap_percent_of_intake": 15.0, "is_supernumerary": True},
                    "NRI": {"cap_percent_of_intake": 5.0, "is_supernumerary": False}
                },
                "cascade_rules": {"allow_vacant_supernumerary_to_nri": True, "max_cascaded_nri_seats": 5}
            }
        )
        db.add_all([policy_2024, policy_2025])
        db.commit()

        print("[TrustSeat] Seeding Institutions and Programmes...")
        inst_objects = []
        prog_objects = []

        for inst_data in REALISTIC_INSTITUTIONS:
            phone_last4 = str(random.randint(1000, 9999))
            inst = models.Institution(
                aicte_id=inst_data["aicte_id"],
                name=inst_data["name"],
                state=inst_data["state"],
                region=inst_data["region"],
                address=inst_data["address"],
                nodal_officer_name=inst_data["officer"],
                nodal_officer_email=inst_data["email"],
                nodal_officer_phone_masked=f"+91 ******{phone_last4}",
                status=models.InstitutionStatus.COMPLIANT,
                review_score=15,
                review_reasons=[]
            )
            db.add(inst)
            db.flush()
            inst_objects.append(inst)

            for p_def in PROGRAMMES_DEF:
                prog = models.Programme(
                    institution_id=inst.id,
                    programme_name=p_def["programme_name"],
                    course_name=p_def["course_name"],
                    level=p_def["level"],
                    approved_intake=p_def["approved_intake"],
                    supernumerary_cap_percent=15.0,
                    nri_quota_percent=5.0,
                    is_nba_accredited=p_def["is_nba"]
                )
                db.add(prog)
                db.flush()
                prog_objects.append(prog)

        db.commit()

        print("[TrustSeat] Creating Administrative and Nodal Users...")
        # Common secure hash for demo users
        demo_pwd_hash = get_password_hash("Admin@TrustSeat2026")

        # 1. AICTE Central Admin
        admin_user = models.User(
            username="aicte_admin",
            hashed_password=demo_pwd_hash,
            role=models.UserRole.AICTE_ADMIN,
            full_name="Dr. Rameshwar Rao (Member Secretary, AICTE)",
            email="admin@aicte-india.org",
            region="National"
        )
        db.add(admin_user)

        # 2. AICTE Regional Officers
        ro_west = models.User(
            username="ro_western",
            hashed_password=demo_pwd_hash,
            role=models.UserRole.AICTE_REGIONAL_OFFICER,
            full_name="Smt. Aarti Kulkarni (Regional Officer, Western Region)",
            email="ro.mumbai@aicte-india.org",
            region="Western"
        )
        ro_north = models.User(
            username="ro_northern",
            hashed_password=demo_pwd_hash,
            role=models.UserRole.AICTE_REGIONAL_OFFICER,
            full_name="Shri Pankaj Srivastava (Regional Officer, Northern Region)",
            email="ro.kanpur@aicte-india.org",
            region="Northern"
        )
        db.add_all([ro_west, ro_north])

        # 3. Institution Nodal Officer for Meerut (Cluster Planted Institute)
        meerut_inst = next(i for i in inst_objects if i.aicte_id == "1-10998877")
        nodal_meerut = models.User(
            username="nodal_meerut",
            hashed_password=demo_pwd_hash,
            role=models.UserRole.INSTITUTION_NODAL_OFFICER,
            full_name="Er. Devendra Singh",
            email=meerut_inst.nodal_officer_email,
            institution_id=meerut_inst.id
        )
        # 4. Institution Nodal Officer for Pune (Apex Institute - Over-Intake Planted)
        pune_inst = next(i for i in inst_objects if i.aicte_id == "1-10492811")
        nodal_pune = models.User(
            username="nodal_pune",
            hashed_password=demo_pwd_hash,
            role=models.UserRole.INSTITUTION_NODAL_OFFICER,
            full_name="Prof. Rajesh Deshmukh",
            email=pune_inst.nodal_officer_email,
            institution_id=pune_inst.id
        )
        # 5. Institution Nodal Officer for Vasai (Compliant Baseline)
        vasai_inst = next(i for i in inst_objects if i.aicte_id == "1-10928371")
        nodal_vasai = models.User(
            username="nodal_vasai",
            hashed_password=demo_pwd_hash,
            role=models.UserRole.INSTITUTION_NODAL_OFFICER,
            full_name="Dr. Sunil Patil",
            email=vasai_inst.nodal_officer_email,
            institution_id=vasai_inst.id
        )
        # 6. Public Verifier User
        verifier_user = models.User(
            username="verifier_tcs",
            hashed_password=demo_pwd_hash,
            role=models.UserRole.VERIFIER,
            full_name="Aditya Verma (Lead Background Verifier, TCS BGC Team)",
            email="verifications@tcs-talent.com"
        )
        db.add_all([nodal_meerut, nodal_pune, nodal_vasai, verifier_user])
        db.commit()

        print("[TrustSeat] Generating ~6,000 Synthetic Student Records with Planted Scenarios...")
        # Random seed for repeatable results
        random.seed(42)

        student_admissions = []
        consent_records = []
        planted_summary = {}

        total_target_students = 5850
        students_per_inst = total_target_students // len(inst_objects)

        apaar_counter = 100000000001
        
        # Shared suspicious mobile for Plant 1
        shared_fraud_mobile = "9810123456"
        shared_fraud_mobile_hash = hash_identifier(shared_fraud_mobile)
        shared_fraud_mobile_masked = mask_mobile(shared_fraud_mobile)

        # Plant 4: Student for Dual Active Overlapping Enrolment
        overlapping_apaar = "887766554433"
        overlapping_student_name = "Rohan Manish Desai"
        overlapping_dob = date(2005, 3, 14)

        for inst in inst_objects:
            inst_progs = [p for p in prog_objects if p.institution_id == inst.id]
            is_meerut_cluster_inst = (inst.aicte_id == "1-10998877")
            is_pune_over_intake_inst = (inst.aicte_id == "1-10492811")
            is_odisha_unconfirmed_inst = (inst.aicte_id == "1-10772199")

            # Determine count for this institution
            count = students_per_inst
            if is_pune_over_intake_inst:
                # Deliberately boost Pune admissions to trigger statutory intake breach
                count = 430
            elif is_odisha_unconfirmed_inst:
                count = 310

            for i in range(count):
                prog = random.choice(inst_progs)
                apaar_id = str(apaar_counter)
                apaar_counter += 1

                fname = random.choice(FIRST_NAMES)
                lname = random.choice(LAST_NAMES)
                full_name = f"{fname} {lname}"

                dob_year = random.randint(2003, 2006)
                dob_month = random.randint(1, 12)
                dob_day = random.randint(1, 28)
                dob = date(dob_year, dob_month, dob_day)

                gender = random.choice(["Male", "Female", "Male", "Female", "Other"])
                category = random.choices(CATEGORIES, weights=CATEGORY_WEIGHTS)[0]
                quota = random.choices(QUOTAS, weights=QUOTA_WEIGHTS)[0]
                is_supernumerary = quota in ["EWS", "TFW", "FN", "OCI", "CIWGC"]

                mobile_raw = f"{random.choice(['98', '97', '99', '94', '93', '88'])}{random.randint(10000000, 99999999)}"
                email_raw = f"{fname.lower()}.{lname.lower()}{random.randint(10, 99)}@gmail.com"

                two_key_state = random.choices(
                    [models.TwoKeyStatus.STUDENT_CONFIRMED, models.TwoKeyStatus.SUBMITTED, models.TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD],
                    weights=[0.82, 0.12, 0.06]
                )[0]
                
                downstream_active = random.random() > 0.03
                validation_status = models.ValidationStatus.VALID
                findings = []

                # Register synthetic citizen record into mock APAAR registry
                apaar_registry_adapter.register_record(ApaarRegistryRecord(
                    apaar_id=apaar_id,
                    full_name=full_name,
                    dob=dob.isoformat(),
                    gender=gender,
                    mobile_masked=mask_mobile(mobile_raw)
                ))

                # -----------------------------------------------------------------
                # Plant Case 1: 40 students sharing ONE mobile hash in Meerut
                # -----------------------------------------------------------------
                if is_meerut_cluster_inst and i < 40:
                    mobile_raw = shared_fraud_mobile
                    two_key_state = models.TwoKeyStatus.SUBMITTED # Stalled confirmations

                # -----------------------------------------------------------------
                # Plant Case 3: Quota admissions missing from state allotment list
                # -----------------------------------------------------------------
                if inst.aicte_id == "1-10112233" and i < 12 and quota == "STATE_ALLOTMENT":
                    # Prefix with '999' so MockAllotmentListAdapter returns None
                    apaar_id = "999" + apaar_id[3:]
                    findings.append({
                        "rule_name": "STATE_ALLOTMENT_UNRECONCILED",
                        "field": "quota_type",
                        "actual_value": "STATE_ALLOTMENT",
                        "reason": "Quota seat allocation not identified on State Centralised Merit Allotment Portal.",
                        "severity": "WARNING",
                        "suggested_fix": "Verify seat allotment order issued by the State Counselling Authority."
                    })
                    validation_status = models.ValidationStatus.WARNING

                # -----------------------------------------------------------------
                # Plant Case 5: Name transliteration differences and genuine mismatch
                # -----------------------------------------------------------------
                if inst.aicte_id == "1-10928371" and i == 1:
                    # Transliteration difference
                    apaar_id = "445566778899"
                    full_name = "Mohammed Tariq Khan" # Registry has "Mohd Tariq Khan"
                    validation_status = models.ValidationStatus.WARNING
                    findings.append({
                        "rule_name": "NAME_TRANSLITERATION_VARIANCE",
                        "field": "student_name",
                        "actual_value": "Mohammed Tariq Khan (Submitted) vs Mohd Tariq Khan (Registry)",
                        "reason": "Minor transliteration variance (92.3% phonetic similarity). Routed to Discrepancy Queue for Nodal verification.",
                        "severity": "WARNING",
                        "suggested_fix": "Check Class 10 certificate spelling and verify identity in the Discrepancy Queue."
                    })

                if inst.aicte_id == "1-10928371" and i == 2:
                    # Genuine mismatch
                    apaar_id = "112233445566"
                    full_name = "Sunita Roy" # Registry has "Sneha Roy"
                    validation_status = models.ValidationStatus.INVALID
                    findings.append({
                        "rule_name": "NAME_MISMATCH_ERROR",
                        "field": "student_name",
                        "actual_value": "Sunita Roy (Submitted) vs Sneha Roy (Registry)",
                        "reason": "Significant mismatch (40.0%). Name submitted differs materially from registry identity.",
                        "severity": "ERROR",
                        "suggested_fix": "Confirm candidate's legal name on Class 10/12 marksheet or rectify registry record via DigiLocker."
                    })

                # -----------------------------------------------------------------
                # Plant Case 6: 120 records stuck as Unconfirmed in Odisha institute
                # -----------------------------------------------------------------
                if is_odisha_unconfirmed_inst and i < 120:
                    two_key_state = models.TwoKeyStatus.UNCONFIRMED_GRACE_PERIOD

                # Generate guaranteed unique record ref and token
                rec_ref = f"TS-2025-{inst.state[:2].upper()}-{str(apaar_counter).zfill(8)}"
                token = secrets.token_urlsafe(24)

                adm = models.StudentAdmission(
                    record_ref=rec_ref,
                    institution_id=inst.id,
                    programme_id=prog.id,
                    apaar_id=apaar_id,
                    student_name=full_name,
                    dob=dob,
                    gender=gender,
                    year_of_admission=2025,
                    admission_date=date(2025, random.randint(7, 8), random.randint(1, 28)),
                    student_id_enrolment=f"{inst.aicte_id[-4:]}-2025-{str(i+1).zfill(4)}",
                    mobile_hash=hash_identifier(mobile_raw),
                    mobile_masked=mask_mobile(mobile_raw),
                    email_hash=hash_identifier(email_raw),
                    email_masked=mask_email(email_raw),
                    category=category,
                    quota_type=quota,
                    supernumerary_flag=is_supernumerary,
                    two_key_status=two_key_state,
                    confirmation_token=token,
                    confirmation_timestamp=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 20)) if two_key_state == models.TwoKeyStatus.STUDENT_CONFIRMED else None,
                    student_remarks="Verified personal details and seat allotment." if two_key_state == models.TwoKeyStatus.STUDENT_CONFIRMED else None,
                    validation_status=validation_status,
                    validation_findings=findings,
                    review_flags=[],
                    downstream_activity_flag=downstream_active
                )
                student_admissions.append(adm)

        # -----------------------------------------------------------------
        # Plant Case 4: Overlapping Active Enrolment in two institutions
        # -----------------------------------------------------------------
        vasai_prog = next(p for p in prog_objects if p.institution_id == vasai_inst.id and "Computer" in p.course_name)
        karnataka_inst = next(i for i in inst_objects if i.state == "Karnataka")
        karnataka_prog = next(p for p in prog_objects if p.institution_id == karnataka_inst.id and "Computer" in p.course_name)

        overlap_adm_1 = models.StudentAdmission(
            record_ref=f"TS-2025-MH-OVERLAP1",
            institution_id=vasai_inst.id,
            programme_id=vasai_prog.id,
            apaar_id=overlapping_apaar,
            student_name=overlapping_student_name,
            dob=overlapping_dob,
            gender="Male",
            year_of_admission=2025,
            admission_date=date(2025, 7, 10),
            student_id_enrolment="VCET-2025-0991",
            mobile_hash=hash_identifier("9820011223"),
            mobile_masked=mask_mobile("9820011223"),
            email_hash=hash_identifier("rohan.desai@gmail.com"),
            email_masked=mask_email("rohan.desai@gmail.com"),
            category="GENERAL",
            quota_type="GENERAL",
            supernumerary_flag=False,
            two_key_status=models.TwoKeyStatus.STUDENT_CONFIRMED,
            confirmation_token=secrets.token_urlsafe(24),
            confirmation_timestamp=datetime.now(timezone.utc) - timedelta(days=12),
            validation_status=models.ValidationStatus.VALID,
            validation_findings=[],
            review_flags=[],
            downstream_activity_flag=True
        )

        overlap_adm_2 = models.StudentAdmission(
            record_ref=f"TS-2025-KA-OVERLAP2",
            institution_id=karnataka_inst.id,
            programme_id=karnataka_prog.id,
            apaar_id=overlapping_apaar,
            student_name=overlapping_student_name,
            dob=overlapping_dob,
            gender="Male",
            year_of_admission=2025,
            admission_date=date(2025, 7, 24),
            student_id_enrolment="BASAV-2025-0812",
            mobile_hash=hash_identifier("9820011223"),
            mobile_masked=mask_mobile("9820011223"),
            email_hash=hash_identifier("rohan.desai@gmail.com"),
            email_masked=mask_email("rohan.desai@gmail.com"),
            category="GENERAL",
            quota_type="GENERAL",
            supernumerary_flag=False,
            two_key_status=models.TwoKeyStatus.STUDENT_CONFIRMED,
            confirmation_token=secrets.token_urlsafe(24),
            confirmation_timestamp=datetime.now(timezone.utc) - timedelta(days=5),
            validation_status=models.ValidationStatus.INVALID,
            validation_findings=[{
                "rule_name": "OVERLAPPING_ACTIVE_ENROLMENT",
                "field": "apaar_id",
                "actual_value": f"Active in {vasai_inst.name} (TS-2025-MH-OVERLAP1)",
                "reason": f"Student holds concurrent active enrolment in '{vasai_inst.name}' for academic year 2025. Prohibited under AICTE norms.",
                "severity": "ERROR",
                "suggested_fix": "Obtain official Transfer Certificate (TC) / Migration Certificate and formal admission cancellation proof."
            }],
            review_flags=[{"type": "DUAL_ACTIVE_ENROLMENT", "other_institute": vasai_inst.name}],
            downstream_activity_flag=True
        )

        student_admissions.extend([overlap_adm_1, overlap_adm_2])

        # Register overlapping student into mock APAAR registry
        apaar_registry_adapter.register_record(ApaarRegistryRecord(
            apaar_id=overlapping_apaar,
            full_name=overlapping_student_name,
            dob=overlapping_dob.isoformat(),
            gender="Male",
            mobile_masked="+91 ******1223"
        ))

        print(f"[TrustSeat] Bulk saving {len(student_admissions)} student admissions...")
        db.bulk_save_objects(student_admissions)
        db.commit()

        # Update institution status and review score based on planted scenarios
        print("[TrustSeat] Computing review scores for institutions...")
        from backend.app.engine.review_engine import compute_institution_review_score
        for inst in inst_objects:
            res = compute_institution_review_score(db, inst.id)
            inst.review_score = res["review_score"]
            inst.status = res["status"]
            inst.review_reasons = [r["description"] for r in res["reasons"]]
        db.commit()

        # Seed initial audit log entries
        print("[TrustSeat] Writing tamper-evident statutory audit trail...")
        audit_entries = [
            models.AuditLog(
                username="SYSTEM_INIT",
                role="SYSTEM",
                action="INITIALIZE_TRUSTSEAT_DATABASE",
                entity_type="SYSTEM",
                entity_id="ROOT",
                details_json={"institutions_count": len(inst_objects), "total_admissions": len(student_admissions)}
            ),
            models.AuditLog(
                username="aicte_admin",
                role="AICTE_ADMIN",
                action="PUBLISH_QUOTA_POLICY_VERSION",
                entity_type="POLICY",
                entity_id="AICTE-APH-2025-V2",
                details_json={"handbook": "Approval Process Handbook 2025-26", "supernumerary_cap": "20%"}
            ),
            models.AuditLog(
                username="nodal_meerut",
                role="INSTITUTION_NODAL_OFFICER",
                institution_id=meerut_inst.id,
                action="UPLOAD_ADMISSION_BATCH",
                entity_type="INSTITUTION",
                entity_id=meerut_inst.id,
                details_json={"batch_size": 240, "source": "CSV_BULK_UPLOAD"}
            )
        ]
        db.bulk_save_objects(audit_entries)
        db.commit()

        print("[TrustSeat] Seed data generation finished successfully!")
        print(f"  -> Total Institutions: {len(inst_objects)}")
        print(f"  -> Total Programmes: {len(prog_objects)}")
        print(f"  -> Total Student Admissions: {len(student_admissions)}")
        print("\n[Planted Demo Scenarios Ready]:")
        print("  1. 40 students sharing mobile hash in Meerut (ITAM Meerut: 1-10998877)")
        print("  2. Apex Institute Pune (1-10492811) exceeding approved intake + supernumerary ceiling")
        print("  3. Quota admissions missing from State Allotment List in SRM Institute Lucknow (1-10112233)")
        print("  4. Overlapping active enrolment: Rohan Manish Desai (APAAR: 887766554433) in Vasai & Bagalkot")
        print("  5. Transliteration mismatch (Mohammed Tariq Khan vs Mohd Tariq Khan) and genuine mismatch (Sunita Roy vs Sneha Roy) in Vasai (1-10928371)")
        print("  6. 120 unconfirmed records in Kalinga Institute Bhubaneswar (1-10772199)")

    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
