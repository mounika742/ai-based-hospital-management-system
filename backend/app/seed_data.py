from app.database import query_db, execute_db
from app.utils.auth import hash_password
from datetime import datetime, timedelta

def seed_database(force=False):
    """Populates the database with realistic demonstration data if empty or forced."""
    user_count = query_db("SELECT COUNT(*) as cnt FROM users", one=True)['cnt']
    if user_count > 0 and not force:
        return {"status": "skipped", "message": "Database already populated."}

    # Clear existing data if forced
    if force:
        execute_db("DELETE FROM billing_records")
        execute_db("DELETE FROM hospital_beds")
        execute_db("DELETE FROM medical_records")
        execute_db("DELETE FROM appointments")
        execute_db("DELETE FROM patients")
        execute_db("DELETE FROM doctors")
        execute_db("DELETE FROM users")

    # 1. Seed Admin
    admin_pw = hash_password("admin123")
    admin_res = execute_db(
        "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)",
        ("admin@hospital.com", admin_pw, "admin", "Dr. Alexander Wright (Medical Director)", "+1-555-0100")
    )

    # 2. Seed Doctors
    doc_pw = hash_password("doctor123")
    doctors_info = [
        {
            "name": "Dr. Sarah Patel", "email": "dr.sarah.patel@hospital.com", "phone": "+1-555-0201",
            "spec": "Cardiologist", "dept": "Cardiology", "qual": "MD, FACC, Harvard Med", "exp": 12, "fee": 800.0,
            "room": "OPD 201", "days": "Monday,Wednesday,Friday", "start": "09:00", "end": "16:00"
        },
        {
            "name": "Dr. David Chen", "email": "dr.david.chen@hospital.com", "phone": "+1-555-0202",
            "spec": "Neurologist", "dept": "Neurology", "qual": "MD, PhD Neurology, Johns Hopkins", "exp": 15, "fee": 1000.0,
            "room": "OPD 304", "days": "Tuesday,Thursday,Saturday", "start": "10:00", "end": "17:00"
        },
        {
            "name": "Dr. Emily Watson", "email": "dr.emily.watson@hospital.com", "phone": "+1-555-0203",
            "spec": "Pediatrician", "dept": "Pediatrics", "qual": "MD Pediatrics, Stanford", "exp": 8, "fee": 600.0,
            "room": "OPD 105", "days": "Monday,Tuesday,Wednesday,Thursday,Friday", "start": "08:30", "end": "15:30"
        },
        {
            "name": "Dr. Robert Kim", "email": "dr.robert.kim@hospital.com", "phone": "+1-555-0204",
            "spec": "Orthopedic Surgeon", "dept": "Orthopedics", "qual": "MS Ortho, Mayo Clinic", "exp": 14, "fee": 900.0,
            "room": "OPD 210", "days": "Monday,Tuesday,Thursday", "start": "09:00", "end": "16:30"
        },
        {
            "name": "Dr. Anita Sharma", "email": "dr.anita.sharma@hospital.com", "phone": "+1-555-0205",
            "spec": "General Physician", "dept": "General Medicine", "qual": "MBBS, MD Internal Medicine", "exp": 10, "fee": 500.0,
            "room": "OPD 101", "days": "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday", "start": "08:00", "end": "18:00"
        },
        {
            "name": "Dr. Michael Ross", "email": "dr.michael.ross@hospital.com", "phone": "+1-555-0206",
            "spec": "Dermatologist", "dept": "Dermatology", "qual": "MD Dermatology, NYU Langone", "exp": 7, "fee": 700.0,
            "room": "OPD 108", "days": "Tuesday,Wednesday,Thursday,Friday", "start": "10:00", "end": "16:00"
        }
    ]

    doctor_ids = []
    for d in doctors_info:
        u_res = execute_db(
            "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)",
            (d["email"], doc_pw, "doctor", d["name"], d["phone"])
        )
        u_id = u_res["last_id"]
        doc_res = execute_db(
            """INSERT INTO doctors 
               (user_id, specialization, department, qualification, experience_years, consultation_fee, room_number, available_days, available_time_start, available_time_end, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')""",
            (u_id, d["spec"], d["dept"], d["qual"], d["exp"], d["fee"], d["room"], d["days"], d["start"], d["end"])
        )
        doctor_ids.append(doc_res["last_id"])

    # 3. Seed Patients
    pat_pw = hash_password("patient123")
    patients_info = [
        {
            "name": "John Doe", "email": "john.doe@hospital.com", "phone": "+1-555-0301",
            "dob": "1988-04-12", "gender": "Male", "blood": "O+", "addr": "742 Evergreen Terrace, Springfield",
            "emg_name": "Jane Doe", "emg_phone": "+1-555-0391", "allergies": "Penicillin, Pollen",
            "history": "Mild seasonal asthma, fractured right wrist (2018)"
        },
        {
            "name": "Maria Garcia", "email": "maria.garcia@hospital.com", "phone": "+1-555-0302",
            "dob": "1994-08-23", "gender": "Female", "blood": "A+", "addr": "1204 Pine Street, Seattle",
            "emg_name": "Carlos Garcia", "emg_phone": "+1-555-0392", "allergies": "None reported",
            "history": "No major chronic illnesses, appendectomy (2020)"
        },
        {
            "name": "Alex Taylor", "email": "alex.taylor@hospital.com", "phone": "+1-555-0303",
            "dob": "1979-11-05", "gender": "Other", "blood": "B+", "addr": "45 Elm Blvd, Portland",
            "emg_name": "Sam Taylor", "emg_phone": "+1-555-0393", "allergies": "Aspirin, Shellfish",
            "history": "Type 2 diabetes managed with Metformin, Hypertension"
        },
        {
            "name": "Priya Singh", "email": "priya.singh@hospital.com", "phone": "+1-555-0304",
            "dob": "2001-02-17", "gender": "Female", "blood": "AB+", "addr": "890 Maple Court, Austin",
            "emg_name": "Rajesh Singh", "emg_phone": "+1-555-0394", "allergies": "Sulfa drugs",
            "history": "Migraine episodes, Iron deficiency anemia treated"
        }
    ]

    patient_ids = []
    for p in patients_info:
        u_res = execute_db(
            "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)",
            (p["email"], pat_pw, "patient", p["name"], p["phone"])
        )
        u_id = u_res["last_id"]
        p_res = execute_db(
            """INSERT INTO patients
               (user_id, date_of_birth, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, allergies, medical_history_summary)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (u_id, p["dob"], p["gender"], p["blood"], p["addr"], p["emg_name"], p["emg_phone"], p["allergies"], p["history"])
        )
        patient_ids.append(p_res["last_id"])

    # 4. Seed Hospital Beds
    beds_info = [
        {"num": "ICU-101", "ward": "ICU", "floor": "1st Floor", "status": "Occupied", "patient_idx": 0, "notes": "Post-cardiac observation"},
        {"num": "ICU-102", "ward": "ICU", "floor": "1st Floor", "status": "Available", "patient_idx": None, "notes": "Sanitized and prepped"},
        {"num": "ICU-103", "ward": "ICU", "floor": "1st Floor", "status": "Maintenance", "patient_idx": None, "notes": "Ventilator calibration"},
        {"num": "GEN-201", "ward": "General", "floor": "2nd Floor", "status": "Occupied", "patient_idx": 1, "notes": "Routine post-op recovery"},
        {"num": "GEN-202", "ward": "General", "floor": "2nd Floor", "status": "Available", "patient_idx": None, "notes": "Ready for admission"},
        {"num": "GEN-203", "ward": "General", "floor": "2nd Floor", "status": "Available", "patient_idx": None, "notes": "Ready for admission"},
        {"num": "GEN-204", "ward": "General", "floor": "2nd Floor", "status": "Available", "patient_idx": None, "notes": "Ready for admission"},
        {"num": "EMR-01", "ward": "Emergency", "floor": "Ground Floor", "status": "Occupied", "patient_idx": 2, "notes": "Triage priority yellow"},
        {"num": "EMR-02", "ward": "Emergency", "floor": "Ground Floor", "status": "Available", "patient_idx": None, "notes": "Emergency standby"},
        {"num": "EMR-03", "ward": "Emergency", "floor": "Ground Floor", "status": "Available", "patient_idx": None, "notes": "Emergency standby"},
        {"num": "MAT-301", "ward": "Maternity", "floor": "3rd Floor", "status": "Occupied", "patient_idx": 3, "notes": "Maternal care ward"},
        {"num": "MAT-302", "ward": "Maternity", "floor": "3rd Floor", "status": "Available", "patient_idx": None, "notes": "Ready for admission"},
        {"num": "PED-401", "ward": "Pediatric", "floor": "4th Floor", "status": "Available", "patient_idx": None, "notes": "Child-friendly ward"},
        {"num": "PED-402", "ward": "Pediatric", "floor": "4th Floor", "status": "Available", "patient_idx": None, "notes": "Child-friendly ward"}
    ]

    for b in beds_info:
        curr_pat = patient_ids[b["patient_idx"]] if b["patient_idx"] is not None else None
        admitted = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if curr_pat else None
        execute_db(
            """INSERT INTO hospital_beds (bed_number, ward, floor, status, current_patient_id, admitted_at, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (b["num"], b["ward"], b["floor"], b["status"], curr_pat, admitted, b["notes"])
        )

    # 5. Seed Appointments
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    next_week = today + timedelta(days=5)

    appointments_data = [
        {
            "pat_id": patient_ids[0], "doc_id": doctor_ids[0], # John Doe -> Dr. Sarah Patel (Cardiology)
            "date": today.strftime("%Y-%m-%d"), "time": "10:30", "reason": "Heart palpitations and occasional shortness of breath",
            "symptoms": "Palpitations, mild fatigue", "status": "Confirmed", "notes": "ECG scheduled on arrival"
        },
        {
            "pat_id": patient_ids[1], "doc_id": doctor_ids[4], # Maria Garcia -> Dr. Anita Sharma (General Medicine)
            "date": yesterday.strftime("%Y-%m-%d"), "time": "11:00", "reason": "Persistent seasonal cough and sore throat",
            "symptoms": "Dry cough, mild fever 99.5F", "status": "Completed", "notes": "Prescribed antibiotic course & throat spray"
        },
        {
            "pat_id": patient_ids[2], "doc_id": doctor_ids[1], # Alex Taylor -> Dr. David Chen (Neurology)
            "date": tomorrow.strftime("%Y-%m-%d"), "time": "14:00", "reason": "Recurring throbbing headaches and light sensitivity",
            "symptoms": "Unilateral headache, photophobia", "status": "Scheduled", "notes": "Patient requested afternoon slot"
        },
        {
            "pat_id": patient_ids[3], "doc_id": doctor_ids[5], # Priya Singh -> Dr. Michael Ross (Dermatology)
            "date": next_week.strftime("%Y-%m-%d"), "time": "15:30", "reason": "Severe allergic rash on forearms",
            "symptoms": "Pruritus, erythema, localized swelling", "status": "Scheduled", "notes": "Bring previous allergy test records"
        },
        {
            "pat_id": patient_ids[0], "doc_id": doctor_ids[3], # John Doe -> Dr. Robert Kim (Orthopedics)
            "date": yesterday.strftime("%Y-%m-%d"), "time": "16:00", "reason": "Left knee pain after tennis session",
            "symptoms": "Joint swelling, pain during flexion", "status": "Completed", "notes": "X-ray revealed minor patellar strain"
        }
    ]

    appointment_ids = []
    for app in appointments_data:
        res = execute_db(
            """INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, symptoms, status, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (app["pat_id"], app["doc_id"], app["date"], app["time"], app["reason"], app["symptoms"], app["status"], app["notes"])
        )
        appointment_ids.append(res["last_id"])

    # 6. Seed Medical Records
    records_data = [
        {
            "pat_id": patient_ids[1], "doc_id": doctor_ids[4], "app_id": appointment_ids[1],
            "visit_date": yesterday.strftime("%Y-%m-%d"),
            "diagnosis": "Acute Upper Respiratory Tract Infection (URTI)",
            "prescription": "1. Amoxicillin 500mg - 1 capsule tid x 5 days\n2. Paracetamol 650mg - 1 tab prn for fever\n3. Levocetirizine 5mg - 1 tab at bedtime",
            "treatment": "Hydration, warm saline gargles, adequate vocal rest.",
            "labs": "Complete Blood Count (CBC) if symptoms persist beyond 5 days",
            "follow_up": (today + timedelta(days=6)).strftime("%Y-%m-%d")
        },
        {
            "pat_id": patient_ids[0], "doc_id": doctor_ids[3], "app_id": appointment_ids[4],
            "visit_date": yesterday.strftime("%Y-%m-%d"),
            "diagnosis": "Grade 1 Medial Collateral Ligament (MCL) Strain - Left Knee",
            "prescription": "1. Aceclofenac + Paracetamol - 1 tab bid pc x 3 days\n2. Topical Diclofenac Gel - apply tid locally",
            "treatment": "R.I.C.E. protocol (Rest, Ice, Compression, Elevation). Avoid heavy weight bearing for 10 days.",
            "labs": "Left Knee AP and Lateral X-Ray (Completed - Normal bony architecture)",
            "follow_up": (today + timedelta(days=14)).strftime("%Y-%m-%d")
        },
        {
            "pat_id": patient_ids[2], "doc_id": doctor_ids[4], "app_id": None,
            "visit_date": (today - timedelta(days=20)).strftime("%Y-%m-%d"),
            "diagnosis": "Essential Hypertension & Type 2 Diabetes Mellitus Follow-up",
            "prescription": "1. Metformin 500mg - 1 tab bid with meals\n2. Telmisartan 40mg - 1 tab OD morning",
            "treatment": "Dietary modification (DASH diet, low sodium), 30 minutes daily moderate walking.",
            "labs": "HbA1c, Fasting Blood Sugar, Serum Creatinine",
            "follow_up": (today + timedelta(days=40)).strftime("%Y-%m-%d")
        }
    ]

    for rec in records_data:
        execute_db(
            """INSERT INTO medical_records (patient_id, doctor_id, appointment_id, visit_date, diagnosis, prescription, treatment_plan, lab_tests_recommended, follow_up_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (rec["pat_id"], rec["doc_id"], rec["app_id"], rec["visit_date"], rec["diagnosis"], rec["prescription"], rec["treatment"], rec["labs"], rec["follow_up"])
        )

    # 7. Seed Billing Records
    bills_data = [
        {
            "num": "INV-2026-001", "pat_id": patient_ids[1], "app_id": appointment_ids[1],
            "total": 500.0, "tax": 25.0, "disc": 0.0, "net": 525.0, "status": "Paid",
            "method": "UPI", "desc": "Consultation Fee - General Medicine (Dr. Anita Sharma)",
            "issued": yesterday.strftime("%Y-%m-%d"), "due": yesterday.strftime("%Y-%m-%d"), "paid": yesterday.strftime("%Y-%m-%d")
        },
        {
            "num": "INV-2026-002", "pat_id": patient_ids[0], "app_id": appointment_ids[4],
            "total": 1800.0, "tax": 90.0, "disc": 100.0, "net": 1790.0, "status": "Paid",
            "method": "Insurance", "desc": "Orthopedic Consultation + Digital Knee X-Ray imaging",
            "issued": yesterday.strftime("%Y-%m-%d"), "due": (today + timedelta(days=15)).strftime("%Y-%m-%d"), "paid": yesterday.strftime("%Y-%m-%d")
        },
        {
            "num": "INV-2026-003", "pat_id": patient_ids[0], "app_id": appointment_ids[0],
            "total": 800.0, "tax": 40.0, "disc": 0.0, "net": 840.0, "status": "Pending",
            "method": "Online", "desc": "Specialist Consultation - Cardiology (Dr. Sarah Patel)",
            "issued": today.strftime("%Y-%m-%d"), "due": (today + timedelta(days=7)).strftime("%Y-%m-%d"), "paid": None
        },
        {
            "num": "INV-2026-004", "pat_id": patient_ids[2], "app_id": None,
            "total": 4500.0, "tax": 225.0, "disc": 300.0, "net": 4425.0, "status": "Overdue",
            "method": "Cash", "desc": "Emergency Ward Observation (12 Hours) & Lab Workup",
            "issued": (today - timedelta(days=25)).strftime("%Y-%m-%d"), "due": (today - timedelta(days=10)).strftime("%Y-%m-%d"), "paid": None
        }
    ]

    for bill in bills_data:
        execute_db(
            """INSERT INTO billing_records (bill_number, patient_id, appointment_id, total_amount, tax_amount, discount_amount, net_amount, payment_status, payment_method, description, issued_date, due_date, paid_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (bill["num"], bill["pat_id"], bill["app_id"], bill["total"], bill["tax"], bill["disc"], bill["net"], bill["status"], bill["method"], bill["desc"], bill["issued"], bill["due"], bill["paid"])
        )

    return {"status": "success", "message": "Demo data populated successfully with Admin, 6 Doctors, 4 Patients, 14 Beds, Appointments, Records, and Bills."}
