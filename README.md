# 🏥 AI-Based Hospital Management System (MediPulse AI)

A complete, full-stack enterprise healthcare application engineered with **React + Vite**, a **Python Flask REST API**, **SQLite persistence**, and specialized **Python-based AI Assistants** for clinical symptom guidance and hospital FAQ automation.

---

## 🌟 Key Features & Requirements Checklist

| # | Requirement | Implementation Details |
|---|-------------|------------------------|
| 1 | **Hospital Dashboard** | Role-tailored dashboard with KPI metrics, bed occupancy, doctor roster, and recent appointments. |
| 2 | **Role-Based Authentication** | Secure login & session management for **Admin**, **Doctor**, and **Patient** roles with 1-click Demo credentials. |
| 3 | **Patient Registration & Management** | Self-registration portal, patient directory, clinical profiles, emergency contacts, and allergy alerts. |
| 4 | **Doctor Management & Availability** | Specialist roster across 6 departments, OPD consulting hours, room numbers, and consultation fees. |
| 5 | **Appointment Management** | Interactive appointment booking, scheduling, rescheduling, doctor slot clash prevention, and status toggles. |
| 6 | **Medical Records (EMR)** | Clinical notes, diagnoses, prescriptions (Rx) with dosage, lab recommendations, follow-up dates, and printable view. |
| 7 | **Billing & Payments** | Automated consultation bill generation, tax calculation, payment processing (Online/Card/Cash), and printable receipts. |
| 8 | **Hospital Bed Management** | Interactive bed board across ICU, General, Emergency, Maternity, and Pediatric wards with allocation & discharge actions. |
| 9 | **AI Symptom Information Assistant** | Clinical triage engine assessing symptom severity, recommending departments/specialists, with a mandatory medical safety disclaimer. |
| 10 | **AI Hospital FAQ Chatbot** | Conversational assistant providing instant answers regarding visiting hours, ambulance hotline, insurance desk, and pharmacy. |
| 11 | **Statistics & Visual Charts** | Interactive visualizations for bed occupancy by ward and department consultation distributions. |
| 12 | **SQLite Database Persistence** | Thread-safe SQLite database schema with foreign keys, relational tables, and automatic seed data. |
| 13 | **Security & RBAC** | Password hashing (`Werkzeug pbkdf2`), JWT token authentication, role guard decorators (`@role_required`), and input validation. |
| 14 | **Realistic Sample Data** | Pre-seeded with Administrator, 6 Specialists across 6 departments, 4 Patients, 14 Wards/Beds, and Appointments. |
| 15 | **Installation & Execution Guide** | Detailed step-by-step instructions explaining every command. |

---

## 🏗️ Technology Stack

- **Frontend:** React 18, Vite 5, Lucide Icons (`lucide-react`), Modern Custom Healthcare CSS Design System.
- **Backend:** Python 3.13, Flask 3, Flask-CORS, PyJWT, Werkzeug Security, python-dotenv.
- **Database:** SQLite 3 (`hospital.db`) with relational integrity and automated migrations.
- **AI Engine:** Python-based Clinical Knowledge Ontology & Semantic FAQ Matching Engine with Emergency Red-Flag detection.

---

## 📁 Project Architecture & File Structure

```text
ai based hospital management system/
├── backend/
│   ├── .env.example                  # Backend environment variable template
│   ├── .env                          # Local secrets (JWT secret, DB path, CORS origins)
│   ├── requirements.txt              # Flask, Flask-Cors, PyJWT, Werkzeug, python-dotenv
│   ├── run.py                        # Entrypoint to launch the Flask REST API server
│   ├── app/
│   │   ├── __init__.py               # Flask app factory, CORS, and blueprint registrations
│   │   ├── config.py                 # Configuration loader from environment variables
│   │   ├── database.py               # SQLite connection management and schemas
│   │   ├── seed_data.py              # Realistic sample dataset generator
│   │   ├── utils/
│   │   │   ├── auth.py               # Password hashing, JWT creation, and @role_required RBAC
│   │   │   └── validators.py         # Input sanitization and format validators
│   │   ├── ai/
│   │   │   ├── symptom_assistant.py  # AI Symptom Assistant triage & clinical ontology
│   │   │   └── hospital_faq.py       # AI Hospital FAQ knowledge base & matching engine
│   │   └── routes/
│   │       ├── auth_routes.py        # Login, registration, profile, and demo accounts
│   │       ├── dashboard_routes.py   # Aggregated analytics and KPI metrics
│   │       ├── patient_routes.py     # Patient records and clinical timeline
│   │       ├── doctor_routes.py      # Specialists directory and availability schedules
│   │       ├── appointment_routes.py # Booking, rescheduling, and status updates
│   │       ├── medical_record_routes.py # EMR prescriptions, diagnoses, and lab requests
│   │       ├── bed_routes.py         # Bed occupancy, allocation, and discharge
│   │       ├── billing_routes.py     # Invoicing, online payments, and receipts
│   │       └── ai_routes.py          # /api/ai/symptom-check and /api/ai/faq-chat
│   └── tests/
│       └── test_api.py               # Automated unit test suite (10 test cases)
├── frontend/
│   ├── .env.example                  # Frontend environment template
│   ├── .env                          # Local frontend config (VITE_API_URL)
│   ├── index.html                    # HTML shell with Google Plus Jakarta Sans font
│   ├── package.json                  # React, Vite, and Lucide icons dependencies
│   ├── vite.config.js                # Vite build and proxy config
│   └── src/
│       ├── main.jsx                  # React application entrypoint
│       ├── App.jsx                   # Role-based layout and tab navigation
│       ├── index.css                 # Modern clinical CSS design system
│       ├── api/
│       │   └── client.js             # Fetch wrapper with JWT injection & error handling
│       ├── context/
│       │   └── AuthContext.jsx       # Authentication state and 1-click demo switcher
│       ├── components/
│       │   ├── Navbar.jsx            # Top bar with role badge, emergency hotline, and logout
│       │   ├── Sidebar.jsx           # Role-tailored dynamic navigation sidebar
│       │   ├── StatCard.jsx          # KPI metric cards with status accents
│       │   ├── Modal.jsx             # Reusable accessible modal dialog
│       │   └── Charts.jsx            # Bed occupancy and department distribution charts
│       └── pages/
│           ├── Login.jsx             # Sleek login page with 1-click Demo credentials
│           ├── Register.jsx          # Patient self-registration page
│           ├── Dashboard.jsx         # Role-aware hospital analytics dashboard
│           ├── Patients.jsx          # Patient directory and detailed clinical timeline
│           ├── Doctors.jsx           # Specialists roster and availability schedules
│           ├── Appointments.jsx      # Appointment booking, calendar, and status actions
│           ├── MedicalRecords.jsx    # EMR prescriptions, diagnoses, and printable summaries
│           ├── BedManagement.jsx     # Ward occupancy matrix with allocate/discharge modal
│           ├── Billing.jsx           # Invoices, payments, and official printable receipts
│           ├── SymptomChecker.jsx    # AI Symptom Assistant with triage urgency badge
│           └── HospitalChatbot.jsx   # AI Hospital FAQ conversational assistant
├── run_backend.bat                   # 1-Click Windows runner for Flask backend
├── run_frontend.bat                  # 1-Click Windows runner for React frontend
├── start_all.bat                     # 1-Click Windows runner for both servers concurrently
└── README.md                         # Complete documentation
```

---

## 🔑 Demonstration Accounts

The login screen provides **1-Click Instant Demo Login Buttons** so you can test all 3 roles with a single click:

| Role | Email Address | Password | Permissions & Scope |
|------|---------------|----------|----------------------|
| **Hospital Administrator** | `admin@hospital.com` | `admin123` | Full hospital analytics, doctor roster, bed inventory, billing oversight, and patient records. |
| **Doctor / Specialist** | `dr.sarah.patel@hospital.com` | `doctor123` | Cardiologist view: Today's agenda, patient consultations, prescriptions (Rx), and medical records. |
| **Patient** | `john.doe@hospital.com` | `patient123` | Personal health dashboard, appointment booking, medical records, online bill payment, and AI symptom checker. |

*Additional Doctors pre-seeded:*
- `dr.david.chen@hospital.com` (Neurology)
- `dr.emily.watson@hospital.com` (Pediatrics)
- `dr.robert.kim@hospital.com` (Orthopedics)
- `dr.anita.sharma@hospital.com` (General Medicine)
- `dr.michael.ross@hospital.com` (Dermatology)

---

## 🚀 Installation & Execution Guide

### Prerequisites
- **Python 3.10+** (Python 3.13 is supported)
- **Node.js 18+** and **npm**

---

### Step 1: Backend Installation & Setup

1. Open your terminal and navigate to the backend folder:
   ```powershell
   cd "c:\ai based hospital management system\backend"
   ```

2. Install Python dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```
   *Explanation of command:*
   - `python -m pip install -r requirements.txt`: Reads `requirements.txt` and installs `Flask` (web framework), `Flask-Cors` (cross-origin resource sharing), `PyJWT` (secure JSON Web Token creation and verification), `Werkzeug` (secure cryptographic password hashing), and `python-dotenv` (loads `.env` configuration).

3. Verify backend functionality by running the unit test suite:
   ```powershell
   python tests/test_api.py
   ```
   *Explanation of command:*
   - Executes 10 automated test cases verifying health check, JWT authentication for Admin/Doctor/Patient, AI emergency triage detection, Hospital FAQ engine, bed summary, dashboard analytics, and appointment booking & payment.

4. Start the Flask backend server:
   ```powershell
   python run.py
   ```
   *The backend REST API will start on `http://127.0.0.1:5000`.*

---

### Step 2: Frontend Installation & Setup

1. Open a new terminal and navigate to the frontend folder:
   ```powershell
   cd "c:\ai based hospital management system\frontend"
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```
   *Explanation of command:*
   - `npm install`: Downloads and installs React 18, Vite 5, and Lucide React Icons (`lucide-react`) defined in `package.json`.

3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
   *Explanation of command:*
   - `npm run dev`: Starts the Vite local development server with Hot Module Replacement (HMR) on `http://localhost:5173`.

---

### Step 3: Quick Windows 1-Click Launchers

For convenience, pre-configured Windows batch files are included in the root directory:
- **`start_all.bat`**: Launches both the Flask backend and the React Vite frontend concurrently in separate terminal windows.
- **`run_backend.bat`**: Starts only the Flask backend.
- **`run_frontend.bat`**: Starts only the React frontend.

Once started, open **`http://localhost:5173`** in your browser.

---

## 🧠 AI Capabilities & Clinical Safety Disclaimer

### 1. AI Symptom Information Assistant (`/api/ai/symptom-check`)
- **Triage Priority:** Classifies input symptoms into **Emergency (Immediate Care)**, **High Priority**, **Moderate Priority**, or **Routine Consultation**.
- **Red Flag Emergency Detection:** Automatically detects critical cardiovascular, neurological, or trauma red flags (e.g. crushing chest pain radiating to left arm, sudden facial weakness, severe difficulty breathing) and displays an immediate Emergency Care Alert.
- **Department & Specialist Recommendation:** Matches symptoms with the appropriate hospital specialty (Cardiology, Neurology, Pulmonology, Orthopedics, Pediatrics, Dermatology, or General Medicine).
- **Consultation Preparation:** Generates focused questions the patient should ask their doctor during their appointment.
- **Mandatory Medical Disclaimer:** 
  > *DISCLAIMER: This AI Assistant provides general educational information and preliminary hospital department referrals only. It DOES NOT provide medical diagnoses, treatment, or replace clinical consultation by a licensed healthcare professional.*

### 2. AI Hospital FAQ Chatbot (`/api/ai/faq-chat`)
- Answers natural language questions regarding hospital operations:
  - **Visiting Hours:** ICU guidelines (4:00 PM - 5:30 PM) and General wards (10:00 AM - 12:00 PM & 4:00 PM - 7:00 PM).
  - **Emergency Hotline:** 24/7 dedicated dispatch hotline `+1-555-0911` with ambulance fleet information.
  - **Insurance & Cashless Desk:** Empaneled providers, TPA pre-authorization requirements, and helpdesk timings.
  - **In-House Pharmacy:** 24/7 operational hours and digital prescription sync.
  - **Pathology & Lab Diagnostics:** Sample collection hours, imaging equipment (128-slice CT, 3T MRI), and online report viewing.
  - **Appointments & Policies:** Booking, cancellations up to 2 hours prior, and check-in procedures.

---

## 🔒 Security & Best Practices

- **Zero Frontend API Key Exposure:** All sensitive environment configurations remain strictly on the backend inside `backend/.env`.
- **Role-Based Access Control (RBAC):** Every protected endpoint enforces token authentication (`@jwt_required`) and role restrictions (`@role_required`).
- **Cryptographic Password Hashing:** Uses `werkzeug.security` with salted `pbkdf2:sha256` hashing.
- **Input Validation:** Email syntax, password length, date/time formats, and required field presence are sanitized on all incoming API payloads.
- **Data Persistence:** SQLite database (`backend/hospital.db`) ensures all changes, bookings, and records persist across server restarts.
