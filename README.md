# TrustSeat — APAAR ID-Based Student Data Management & Verification Platform

**Smart India Hackathon 2026 — Problem Statement 26263**  
*Regulatory Platform for All India Council for Technical Education (AICTE)-Approved Institutions*

---

## 1. Executive Summary

**TrustSeat** is an enterprise-grade regulatory portal built for the All India Council for Technical Education (AICTE). It anchors the **"One Nation, One Student ID" (APAAR / ABC ID)** ecosystem, resolving nationwide regulatory challenges:
1. **Intake Ceiling & Supernumerary Governance**: Prevents institutions from enrolling students beyond council-sanctioned regular intake and supernumerary caps.
2. **Policy-as-Code Quota Waterfall Engine**: Enforces versioned regulations (AICTE Approval Process Handbook APH 2024-25 and 2025-26) with dynamic "What-If" sensitivity modeling.
3. **Two-Key Enrolment Authentication**: Key 1 (Institution Nodal submission) + Key 2 (Student tokenized confirmation standing in for SMS / DigiLocker), preventing fraudulent proxy enrolments.
4. **Anomalous Cluster & Review Scoring**: Detects shared contact clusters (e.g. 40 students sharing a single mobile hash), state merit allotment discrepancies, and concurrent active enrolments without ever exposing raw personal data.
5. **Privacy by Design**: Cryptographically hashes and masks identifiers (`+91 ******1234`, `s****@domain.com`), purpose-tagged consent ledger, and minimal disclosure for third-party verifiers.
6. **Strict NIC / GIGW Indian Government Design**: Conforms to Guidelines for Indian Government Websites (GIGW 3.0), bilingual (English & हिन्दी), accessibility text scaler (`A-` / `A` / `A+`), and zero commercial marketing fluff.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, React Router 6, TanStack Table 8, Recharts 2, Lucide Icons, pure GIGW CSS.
- **Backend**: FastAPI (Python 3.11+ / 3.14+), SQLAlchemy 2 (PostgreSQL-compatible schema with SQLite prototype), Pydantic v2, Python-Jose (JWT), Passlib.
- **Verification & Analytics Engines**: RapidFuzz (Indian phonetic & transliteration matching), Scikit-Learn IsolationForest (silent baseline anomaly review scoring).
- **Pluggable Mock Adapters**: `MockApaarRegistryAdapter`, `MockAllotmentListAdapter`, `MockStudentConfirmationChannel`.

---

## 3. Quickstart: How to Run

### Option A: Windows Single-Command Launch (Recommended)
Double-click `start_dev.bat` or run in PowerShell:
```cmd
.\start_dev.bat
```
This automatically seeds the database with ~6,100 records and starts both the FastAPI backend (`http://127.0.0.1:8000`) and Vite frontend (`http://localhost:5173`).

### Option B: Manual Command-Line Setup

#### 1. Backend Setup
```bash
# In project root
python -m pip install -r backend/requirements.txt
python seed/seed_data.py
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

#### 3. Run Automated Engine Unit Tests
```bash
python -m pytest backend/app/tests -v
```

---

## 4. Demo Accounts & Role-Based Access Control

The platform provides a 1-click **"Evaluation Switcher"** on the login page and header to seamlessly switch personas:

| Role | Username | Password | Purpose & Scope |
| :--- | :--- | :--- | :--- |
| **AICTE Admin** | `aicte_admin` | `Admin@TrustSeat2026` | National oversight, What-If Quota Policy simulator, Review score anomaly graph, central audit. |
| **AICTE Regional Officer** | `ro_western` | `Admin@TrustSeat2026` | Western Region oversight (Maharashtra & Gujarat), jurisdictional over-intake alerts. |
| **Institution Nodal Officer** | `nodal_meerut` | `Admin@TrustSeat2026` | ITAM Meerut (Planted 40-student cluster), upload admissions, dry-run validator with fixes. |
| **Institution Nodal Officer** | `nodal_vasai` | `Admin@TrustSeat2026` | Compliant college (Vasai), discrepancy queue, certificate printing. |
| **Public Verifier** | `verifier_tcs` | `Admin@TrustSeat2026` | Employer / Regulator credential check, QR scan, minimal disclosure view. |

---

## 5. The 3-Minute Jury Evaluation Script

### Minute 1: National AICTE Oversight & Policy "What-If" Simulator
1. Log in as **AICTE Admin** (`aicte_admin`).
2. Point out the **GIGW compliance**: Government utility bar, tricolor stripe, font zoom (`A-`/`A`/`A+`), and language switcher (English/हिन्दी).
3. Review the **National Dashboard**: 25 institutions across 8 states, 6,124 admissions, intake capacity utilization, and over-intake alerts.
4. Click **Quota Waterfall & Policy**:
   - Highlight the **Versioned Policy-as-Code** (APH 2024-V1 vs 2025-V2).
   - Drag the **Supernumerary Ceiling slider** from `20%` down to `14%`. Watch the real-time simulation report re-calculate: 12 programmes immediately turn non-compliant with negative headroom!

### Minute 2: Review Flags, Shared Contact Clusters & Fraud Graph
1. Click **Review Flags & Fraud Graph**.
2. Select **Institute of Technology & Advanced Management, Meerut** (`1-10998877`).
3. Show the **Review Score (65/100 - FLAGGED)** and statutory advisory note: *"For official review. Not a finding of violation."*
4. Point to the **Interactive Network Graph**:
   - Central navy node = Institution.
   - Red nodes = Shared contact clusters.
   - Click **Cluster 1** in the right evidence drawer: reveals **40 student admission records sharing the exact same phone hash `+91 ******3456`**.
5. Switch to **State Allotment Reconciliation List**: view quota seats admitted without merit letters from state counseling.

### Minute 3: Dry-Run Upload, Two-Key Confirmation & Verification
1. Switch to **Nodal Officer** via the top dropdown (`nodal_meerut`).
2. Go to **Upload Admissions** -> click **Load 3-Row Sample Batch** -> click **Check Before Submitting (Dry-Run)**.
   - Show how the multi-rule engine catches blocking errors row-by-row with **Suggested Regulatory Fixes** before any database commit!
3. Go to **Enrolment Records** -> click any **"Key-2 Link"**:
   - Demonstrates the **mobile-responsive Two-Key Student Confirmation screen** standing in for DigiLocker/SMS. Click **"Confirm My Enrolment (Key 2)"**.
4. Go to **Public Verification** -> search record ref `TS-2025-MH-00100001`:
   - Shows **zero personal data leaks** (masked APAAR, initials only, verified degree status, signed cryptographic token, and student transparency audit log).
5. Click **Certificate** -> preview printable official certificate with APAAR beside Student ID and QR code.

---

## 6. Documented Planted Scenarios

| # | Planted Anomaly | Entity | Evidence & Verification Path |
| :-: | :--- | :--- | :--- |
| **1** | **40 Students Sharing Single Phone Hash** | ITAM Meerut (`1-10998877`) | **Review Flags & Fraud Graph** -> Select Meerut -> Inspect Cluster 1. |
| **2** | **Intake Ceiling Breached** | Apex Institute Pune (`1-10492811`) | **National Dashboard** -> Approved 120 + 15% supernumerary (138 cap) has 146 enrolled -> Red "Ceiling Exceeded". |
| **3** | **Unreconciled State Quota Seats** | SRM Institute Lucknow (`1-10112233`) | **Review Flags** -> Select SRM Lucknow -> State Allotment Reconciliation tab -> 12 missing from merit list. |
| **4** | **Dual Active Overlapping Enrolment** | Rohan Manish Desai (`887766554433`) | Enrolled concurrently in Vasai (MH) and Bagalkot (KA). Blocked by cross-institution date logic. |
| **5** | **Transliteration vs Genuine Mismatch** | VCET Vasai (`1-10928371`) | **Discrepancy Queue** -> `Mohammed Tariq Khan` vs `Mohd Tariq Khan` (Transliteration Warning) vs `Sunita Roy` vs `Sneha Roy` (Error). |
| **6** | **120 Records Stuck in Grace Period** | Kalinga Institute Odisha (`1-10772199`) | **National Dashboard** -> Elevated unconfirmed rate (>38%). |

---

## 7. Pluggable Mock Adapters & Production Migration Path

TrustSeat follows the **Hexagonal Adapter Pattern**. Mock adapters are decoupled and ready for drop-in production enterprise connectors:

| Mock Adapter | Simulated Capability | Production Integration |
| :--- | :--- | :--- |
| **`MockApaarRegistryAdapter`** | In-memory citizen registry, 12-digit APAAR lookup, phonetic names. | Digilocker API / NAD (National Academic Depository) & UIDAI Aadhaar Vault Token API. |
| **`MockAllotmentListAdapter`** | State centralized counselling lists (MHT-CET, KCET, UPSEE, TNEA). | State Higher Education Technical Portals & NIC Central Seat Allocation Service. |
| **`MockStudentConfirmationChannel`** | Dispatches tokenized Two-Key URLs to student's registered mobile. | CDAC National SMS Gateway / WhatsApp Cloud API / DigiLocker In-App Consent Request. |

---

## 8. Regulatory & Statutory Integrity

- **Prohibited Terms Guarantee**: Zero use of forbidden buzzwords (*"AI"*, *"smart"*, *"intelligent"*, *"machine learning"*, *"copilot"*, *"magic"*).
- **Append-Only Audit Trail**: Every transaction is cryptographically timestamped in `audit_logs`.
- **DPDP Act Compliance**: Masked PII, purpose-tagged consent ledger, and right to revoke third-party verification consent.

---

*Prototype engineered for Smart India Hackathon 2026. Built with synthetic data for regulatory demonstration.*
