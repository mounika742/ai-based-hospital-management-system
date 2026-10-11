from flask import Blueprint, request, jsonify
from app.ai.symptom_assistant import analyze_symptoms
from app.ai.hospital_faq import answer_hospital_faq

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/symptom-check', methods=['POST'])
def check_symptoms():
    """
    Analyzes patient input symptoms, evaluates triage urgency,
    and suggests an appropriate hospital department without claiming to diagnose diseases.
    """
    data = request.get_json() or {}
    symptoms = data.get('symptoms', '').strip()

    if not symptoms:
        return jsonify({'error': 'Please provide description of symptoms'}), 400

    duration = data.get('duration', 'a few days')
    severity = data.get('severity', 'moderate')
    age_group = data.get('age_group', 'adult')

    result = analyze_symptoms(
        symptoms_text=symptoms,
        duration=duration,
        severity=severity,
        age_group=age_group
    )

    return jsonify({'result': result}), 200

@ai_bp.route('/faq-chat', methods=['POST'])
def chat_faq():
    """
    Answers common hospital service inquiries (visiting hours, insurance, pharmacy, appointments).
    """
    data = request.get_json() or {}
    query = data.get('query', '').strip()

    response = answer_hospital_faq(query)
    return jsonify({'response': response}), 200

@ai_bp.route('/faq-suggestions', methods=['GET'])
def get_faq_suggestions():
    """Returns quick prompt pills for the hospital chatbot."""
    return jsonify({
        'suggestions': [
            "What are the visiting hours for ICU?",
            "How do I book an appointment?",
            "What is the emergency helpline number?",
            "Which health insurance plans do you accept?",
            "Tell me about the hospital pharmacy",
            "What diagnostic tests are available?"
        ]
    }), 200
