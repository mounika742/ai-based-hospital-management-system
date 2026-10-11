import re

# Comprehensive knowledge base for symptom analysis and triage
DEPARTMENT_KNOWLEDGE = {
    "emergency": {
        "department": "Emergency & Trauma Center",
        "specialist": "Emergency Medicine Physician",
        "triage_level": "Emergency (Immediate Care Required)",
        "color": "danger",
        "description": "Symptoms indicate potential acute or critical condition that requires prompt professional emergency evaluation.",
        "recommended_action": "Proceed to the nearest emergency room immediately or call local emergency medical services. Do not drive yourself.",
        "questions_for_doctor": [
            "Are continuous vital sign monitoring and emergency imaging required?",
            "What acute complications are we ruling out?",
            "What medications or immediate interventions are necessary?"
        ]
    },
    "cardiology": {
        "department": "Cardiology",
        "specialist": "Cardiologist",
        "triage_level": "High Priority",
        "color": "warning",
        "description": "Symptoms may relate to the cardiovascular system, heart rhythm, blood pressure, or vascular health.",
        "recommended_action": "Book an early consultation with a cardiologist. Avoid strenuous exertion until evaluated.",
        "questions_for_doctor": [
            "Would you recommend an Electrocardiogram (ECG) or Echocardiogram?",
            "Are there dietary or activity modifications I should follow immediately?",
            "Could my blood pressure or family history be contributing to these symptoms?"
        ]
    },
    "neurology": {
        "department": "Neurology",
        "specialist": "Neurologist",
        "triage_level": "Moderate to High Priority",
        "color": "warning",
        "description": "Symptoms suggest possible involvement of the nervous system, brain, nerves, or sensory pathways.",
        "recommended_action": "Schedule a detailed consultation with a neurologist. Keep a log of symptom triggers, duration, and frequency.",
        "questions_for_doctor": [
            "Is a brain MRI, CT scan, or EEG warranted?",
            "Are these symptoms indicative of migraine, nerve compression, or another condition?",
            "What preventive lifestyle habits or medications can help manage this?"
        ]
    },
    "orthopedics": {
        "department": "Orthopedics & Joint Care",
        "specialist": "Orthopedic Surgeon",
        "triage_level": "Routine to Moderate",
        "color": "info",
        "description": "Symptoms involve bones, joints, ligaments, tendons, or musculoskeletal function.",
        "recommended_action": "Schedule an orthopedic appointment. Practice R.I.C.E. (Rest, Ice, Compression, Elevation) if acute joint swelling is present.",
        "questions_for_doctor": [
            "Would digital X-rays or an MRI help assess the joint or bone structure?",
            "Is physical therapy recommended before considering medication or procedural care?",
            "Which daily exercises or braces can support recovery?"
        ]
    },
    "pediatrics": {
        "department": "Pediatrics",
        "specialist": "Pediatrician",
        "triage_level": "Moderate Priority",
        "color": "info",
        "description": "Symptoms observed in infants, children, or adolescents requiring specialized pediatric medical care.",
        "recommended_action": "Schedule an appointment with a pediatrician. Monitor hydration, temperature, and activity levels closely.",
        "questions_for_doctor": [
            "Are the child's developmental milestones and vaccination schedule up to date?",
            "What are the specific pediatric dosage guidelines for symptom relief?",
            "What signs indicate that the illness is worsening?"
        ]
    },
    "dermatology": {
        "department": "Dermatology",
        "specialist": "Dermatologist",
        "triage_level": "Routine Consultation",
        "color": "info",
        "description": "Symptoms concern the skin, hair, nails, or cutaneous allergic reactions.",
        "recommended_action": "Schedule an outpatient dermatology visit. Avoid applying unverified creams, scratching, or exposure to harsh cleansers.",
        "questions_for_doctor": [
            "Is this rash allergic, viral, bacterial, or autoimmune in nature?",
            "Are patch tests or skin scrapings required?",
            "What gentle skincare routine and topical treatment do you recommend?"
        ]
    },
    "pulmonology": {
        "department": "Pulmonology & Respiratory Care",
        "specialist": "Pulmonologist",
        "triage_level": "Moderate to High Priority",
        "color": "warning",
        "description": "Symptoms relate to the lungs, airways, breathing difficulty, or chronic cough.",
        "recommended_action": "Consult a pulmonologist or respiratory physician. Monitor oxygen saturation if pulse oximeter is available.",
        "questions_for_doctor": [
            "Is a spirometry (pulmonary function test) or chest X-ray needed?",
            "Could environmental allergens, asthma, or an infection be causing this?",
            "Would an inhaler or nebulization therapy provide relief?"
        ]
    },
    "general_medicine": {
        "department": "General Medicine",
        "specialist": "General Physician / Internist",
        "triage_level": "Routine Consultation",
        "color": "primary",
        "description": "General systemic symptoms that are best evaluated initially by an internal medicine physician.",
        "recommended_action": "Book an outpatient consultation with a general physician for comprehensive clinical assessment and standard blood work.",
        "questions_for_doctor": [
            "What routine laboratory panels (CBC, metabolic panel) should be ordered?",
            "Could these symptoms stem from vitamin deficiencies, viral infection, or stress?",
            "Should I be referred to a sub-specialist based on my initial findings?"
        ]
    }
}

RED_FLAGS = [
    r"\b(crushing chest pain|chest pressure|radiating to left arm|radiating to jaw)\b",
    r"\b(sudden weakness|facial droop|slurred speech|sudden vision loss|paralysis)\b",
    r"\b(coughing up blood|hemoptysis|vomiting blood)\b",
    r"\b(severe shortness of breath|unable to breathe|gasping|choking)\b",
    r"\b(unconscious|loss of consciousness|fainted|blackout|seizure|convulsion)\b",
    r"\b(severe head injury|heavy uncontrolled bleeding|stab|trauma)\b",
    r"\b(anaphylaxis|swelling of lips|swelling of tongue|throat closing)\b"
]

def analyze_symptoms(symptoms_text: str, duration: str = "", severity: str = "moderate", age_group: str = "adult") -> dict:
    """
    Analyzes patient symptoms, calculates triage urgency, recommends hospital department and specialist,
    and provides clinical guidance questions with a clear medical disclaimer.
    """
    cleaned = (symptoms_text or "").strip().lower()
    
    # 1. Emergency Red Flag Detection
    is_emergency = False
    for pattern in RED_FLAGS:
        if re.search(pattern, cleaned):
            is_emergency = True
            break
            
    if is_emergency:
        dept_info = DEPARTMENT_KNOWLEDGE["emergency"]
        return format_assistant_response(dept_info, cleaned, severity, True)

    # 2. Age-specific routing
    if age_group.lower() in ["infant", "child", "toddler", "pediatric"] or re.search(r"\b(baby|child|toddler|infant|kid)\b", cleaned):
        dept_info = DEPARTMENT_KNOWLEDGE["pediatrics"]
        return format_assistant_response(dept_info, cleaned, severity, False)

    # 3. Keyword Pattern Matching
    scores = {
        "cardiology": 0,
        "neurology": 0,
        "pulmonology": 0,
        "orthopedics": 0,
        "dermatology": 0,
        "general_medicine": 1 # baseline
    }

    # Cardiology triggers
    if re.search(r"\b(chest pain|palpitation|racing heart|heart rate|fluttering|hypertension|high blood pressure|swollen ankles)\b", cleaned):
        scores["cardiology"] += 4

    # Neurology triggers
    if re.search(r"\b(headache|migraine|dizziness|vertigo|tingling|numbness|tremor|nerve pain|blurred vision|memory loss)\b", cleaned):
        scores["neurology"] += 4

    # Pulmonology triggers
    if re.search(r"\b(cough|wheezing|asthma|shortness of breath|breathless|phlegm|bronchitis|respiratory)\b", cleaned):
        scores["pulmonology"] += 4

    # Orthopedics triggers
    if re.search(r"\b(knee pain|joint|back pain|shoulder pain|fracture|sprain|arthritis|bone|ligament|swollen knee|spine)\b", cleaned):
        scores["orthopedics"] += 4

    # Dermatology triggers
    if re.search(r"\b(rash|itching|skin|acne|eczema|psoriasis|hives|mole|dry skin|erythema|blister|allergy)\b", cleaned):
        scores["dermatology"] += 4

    # General Medicine triggers
    if re.search(r"\b(fever|fatigue|weakness|loss of appetite|chills|body ache|stomach ache|nausea|vomiting|diarrhea|cold|flu|malaise)\b", cleaned):
        scores["general_medicine"] += 3

    # Pick highest scoring department
    best_dept_key = max(scores, key=scores.get)
    dept_info = DEPARTMENT_KNOWLEDGE.get(best_dept_key, DEPARTMENT_KNOWLEDGE["general_medicine"])

    # If severe was flagged by user, upgrade triage note
    if severity.lower() == "severe" and best_dept_key != "general_medicine":
        dept_info = dict(dept_info)
        dept_info["triage_level"] = "Urgent Consultation (Within 24 Hours)"

    return format_assistant_response(dept_info, cleaned, severity, False)

def format_assistant_response(dept_info: dict, symptoms: str, severity: str, is_emergency: bool) -> dict:
    return {
        "is_emergency": is_emergency,
        "triage_level": dept_info["triage_level"],
        "badge_color": dept_info["color"],
        "recommended_department": dept_info["department"],
        "recommended_specialist": dept_info["specialist"],
        "guidance_summary": dept_info["description"],
        "recommended_action": dept_info["recommended_action"],
        "questions_for_doctor": dept_info["questions_for_doctor"],
        "general_care_tips": [
            "Stay adequately hydrated with fluids (water, herbal broth).",
            "Get sufficient restorative rest in a calm environment.",
            "Keep a short written timeline of when symptoms began and their severity for your doctor.",
            "Avoid taking self-prescribed antibiotics or unverified remedies."
        ],
        "disclaimer": (
            "MEDICAL DISCLAIMER: This AI Assistant provides informational guidance and triage suggestions only. "
            "It does NOT provide a formal clinical diagnosis, treat illnesses, or replace an evaluation by a licensed physician. "
            "If you or someone around you experience severe chest pain, sudden numbness, severe difficulty breathing, "
            "or severe trauma, call emergency services immediately or visit the nearest emergency room."
        )
    }
