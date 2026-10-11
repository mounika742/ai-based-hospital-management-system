import re

FAQ_KNOWLEDGE_BASE = [
    {
        "keywords": ["visiting hours", "visit", "visitor", "timing", "visiting time", "see patient", "hours"],
        "topic": "Visiting Hours & Policies",
        "answer": (
            "🕒 **Hospital Visiting Hours:**\n\n"
            "• **General Wards:** 10:00 AM – 12:00 PM and 4:00 PM – 7:00 PM daily.\n"
            "• **Intensive Care Units (ICU / CCU):** 4:00 PM – 5:30 PM (Only 1 designated visitor at a time to maintain sterile protocol).\n"
            "• **Maternity Ward:** 11:00 AM – 1:00 PM and 4:00 PM – 6:00 PM.\n"
            "• **Pediatric Ward:** One parent/guardian is permitted 24/7 beside the child."
        ),
        "follow_up": ["How do I request a visitor pass?", "What are the ICU guidelines?"]
    },
    {
        "keywords": ["emergency", "ambulance", "trauma", "urgent", "helpline", "hotline", "accident", "casualty"],
        "topic": "Emergency & 24/7 Ambulance Services",
        "answer": (
            "🚨 **24/7 Emergency & Trauma Center:**\n\n"
            "• **Emergency Hotline:** +1-555-0911 (Toll-Free, 24/7 Dedicated Dispatch)\n"
            "• **Hospital Ambulance Fleet:** Equipped with advanced cardiac life support (ACLS) and oxygen ventilation.\n"
            "• **Location:** Ground Floor, East Wing with a dedicated non-stop emergency ramp and ambulance bay.\n"
            "• Triage operates 24/7 without requiring prior appointment."
        ),
        "follow_up": ["Where is the emergency entrance located?", "What is the ambulance response time?"]
    },
    {
        "keywords": ["appointment", "book", "schedule", "reschedule", "cancel appointment", "opd", "consultation"],
        "topic": "Appointment Booking & Rescheduling",
        "answer": (
            "📅 **Appointment Booking & OPD Policies:**\n\n"
            "• **Online Booking:** Use the Appointments tab in this portal to select your preferred doctor, date, and available time slot.\n"
            "• **Cancellation & Rescheduling:** Appointments can be updated or cancelled without fee up to 2 hours before the scheduled time.\n"
            "• **Check-in:** Please arrive 15 minutes prior to your slot at the designated OPD reception desk for vitals recording."
        ),
        "follow_up": ["Which doctors are available today?", "What is the consultation fee?"]
    },
    {
        "keywords": ["insurance", "cashless", "tpa", "claim", "coverage", "mediclaim", "policy"],
        "topic": "Health Insurance & Cashless Desk",
        "answer": (
            "🛡️ **Insurance & Cashless Hospitalization:**\n\n"
            "• **Empaneled Providers:** We accept BlueCross, UnitedHealth, Aetna, Cigna, Star Health, and all major TPAs.\n"
            "• **Cashless Helpdesk:** Located at Counter 4, Central Lobby (Open 8:00 AM – 8:00 PM daily).\n"
            "• **Required Documents:** Government Photo ID, Health Insurance Card/Policy Number, and Doctor's Admission Advice Note.\n"
            "• **Pre-Authorization:** Emergency cases processed within 1–2 hours; planned admissions should be submitted 48 hours prior."
        ),
        "follow_up": ["Where is Counter 4 located?", "Can I pay with credit card?"]
    },
    {
        "keywords": ["pharmacy", "medicine", "drug", "chemist", "prescription", "meds"],
        "topic": "In-House 24/7 Pharmacy",
        "answer": (
            "💊 **Hospital Pharmacy Services:**\n\n"
            "• **Hours:** Open 24 Hours, 7 Days a week.\n"
            "• **Location:** Ground Floor, opposite the OPD Main Entrance.\n"
            "• **Digital Prescriptions:** Prescriptions written by hospital doctors in this portal are automatically synced with the pharmacy counter for fast dispensing."
        ),
        "follow_up": ["Can I get home delivery of medications?", "Do you accept insurance for pharmacy bills?"]
    },
    {
        "keywords": ["lab", "test", "pathology", "blood test", "report", "xray", "x-ray", "mri", "ct scan", "ultrasound", "scan"],
        "topic": "Diagnostics & Laboratory Services",
        "answer": (
            "🔬 **Diagnostic & Imaging Center:**\n\n"
            "• **Sample Collection:** 6:00 AM – 9:00 PM daily (Emergency diagnostic lab runs 24/7).\n"
            "• **Services:** Complete Blood Count (CBC), Biochemistry, Digital X-Ray, 128-slice CT Scan, 3T MRI, Ultrasound Doppler.\n"
            "• **Reports:** Digital reports are directly accessible under your Patient Medical Records tab once approved by the pathologist."
        ),
        "follow_up": ["How do I download lab reports?", "Do I need to fast before a blood test?"]
    },
    {
        "keywords": ["bed", "ward", "icu", "admit", "admission", "discharge", "room", "stay"],
        "topic": "Bed Allocation & Inpatient Stay",
        "answer": (
            "🛏️ **Bed Management & Hospital Rooms:**\n\n"
            "• **Ward Categories:** Intensive Care Unit (ICU), General Ward, Emergency Observation, Maternity Care, and Pediatric Ward.\n"
            "• **Admission Process:** An admission note from an attending hospital doctor is required.\n"
            "• **Discharge:** Standard discharge time is 11:00 AM. Final billing clearance and discharge medication summaries take approximately 90 minutes."
        ),
        "follow_up": ["What are the bed charges per day?", "Can a relative stay overnight?"]
    },
    {
        "keywords": ["bill", "payment", "cost", "fee", "pay", "invoice", "receipt", "charges"],
        "topic": "Billing & Payment Methods",
        "answer": (
            "💳 **Billing & Payment Management:**\n\n"
            "• **Payment Methods:** We accept UPI (Google Pay, PhonePe, Paytm, QR code), Credit/Debit Cards, Net Banking, Cash, and Cashless Insurance claims.\n"
            "• **Consultation Fees:** Specialist consultation fees range from ₹500 to ₹1,000 depending on the clinical department.\n"
            "• **Online Settlement:** You can view, download printable receipts, and pay outstanding balances directly in the Billing section of this portal.\n"
            "• **Itemized Invoices:** All bills contain a transparent itemized breakdown of doctor fees, medications, nursing care, and room charges."
        ),
        "follow_up": ["Where do I view my bills?", "How do I get an insurance reimbursement receipt?"]
    },
    {
        "keywords": ["doctor", "specialist", "department", "cardiologist", "neurologist", "pediatrician", "orthopedic"],
        "topic": "Departments & Medical Specialists",
        "answer": (
            "👨‍⚕️ **Clinical Departments & Specialists:**\n\n"
            "Our hospital houses dedicated centers of excellence:\n"
            "• **Cardiology** (Heart rhythm, hypertension, angioplasty)\n"
            "• **Neurology** (Migraine, stroke, nervous system)\n"
            "• **Orthopedics** (Joint replacements, sports injuries, fracture trauma)\n"
            "• **Pediatrics** (Child healthcare, immunization)\n"
            "• **General Medicine** (Internal medicine, diabetes, infectious diseases)\n"
            "• **Dermatology** (Skin disorders, allergy management)\n\n"
            "You can explore full doctor profiles, qualifications, and schedules under the Doctors section."
        ),
        "follow_up": ["How do I book an appointment with Dr. Sarah Patel?", "What are the OPD timings?"]
    },
    {
        "keywords": ["location", "address", "parking", "directions", "where", "contact", "phone", "email"],
        "topic": "Hospital Location & Contact Information",
        "answer": (
            "📍 **Location & Contact:**\n\n"
            "• **Address:** Medical Center Boulevard, Healthcare District, Metro City\n"
            "• **General Helpline:** +1-555-0100 (8:00 AM – 9:00 PM)\n"
            "• **24/7 Emergency Line:** +1-555-0911\n"
            "• **Email:** support@hospital.com\n"
            "• **Parking:** 4-level dedicated visitor parking with wheelchair assistance at the entry."
        ),
        "follow_up": ["Is valet parking available?", "What is the emergency helpline number?"]
    }
]

def answer_hospital_faq(query: str) -> dict:
    """Answers user queries regarding hospital services using intelligent semantic matching."""
    cleaned = (query or "").strip().lower()
    if not cleaned:
        return {
            "answer": "Hello! I am the Hospital Information Assistant. How can I assist you today? You can ask me about visiting hours, booking appointments, insurance, emergency helpline, diagnostic tests, or doctors on duty.",
            "topic": "Welcome",
            "suggested_prompts": [
                "What are the visiting hours?",
                "How do I book an appointment?",
                "What is the emergency helpline number?",
                "Which health insurance plans do you accept?",
                "Tell me about the hospital pharmacy"
            ]
        }

    best_match = None
    highest_score = 0

    for item in FAQ_KNOWLEDGE_BASE:
        score = 0
        for kw in item["keywords"]:
            if kw in cleaned:
                score += len(kw.split()) * 2 # longer phrases get higher weight
            elif any(w in cleaned.split() for w in kw.split()):
                score += 1
                
        if score > highest_score:
            highest_score = score
            best_match = item

    if best_match and highest_score > 0:
        return {
            "answer": best_match["answer"],
            "topic": best_match["topic"],
            "suggested_prompts": best_match["follow_up"]
        }

    # Fallback response
    return {
        "answer": (
            "Thank you for contacting our Hospital Information Desk.\n\n"
            "While I don't have an exact answer for that specific phrasing, our help desk team is happy to assist you:\n"
            "• **General Reception:** Call +1-555-0100\n"
            "• **24/7 Emergency Hotline:** Call +1-555-0911\n"
            "• **Email:** support@hospital.com\n\n"
            "You can also use one of the quick suggestions below or navigate using the side menu."
        ),
        "topic": "General Inquiries",
        "suggested_prompts": [
            "What are the visiting hours for ICU?",
            "How do I consult a doctor?",
            "What insurance cards are accepted?",
            "Where is the hospital pharmacy?"
        ]
    }
