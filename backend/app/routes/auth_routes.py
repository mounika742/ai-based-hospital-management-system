from flask import Blueprint, request, jsonify, g
from app.database import query_db, execute_db
from app.utils.auth import hash_password, verify_password, generate_jwt_token, jwt_required
from app.utils.validators import validate_email, validate_password, validate_required_fields

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return JWT token with profile metadata."""
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')
    expected_role = data.get('role', '').strip().lower()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = query_db(
        "SELECT id, email, password_hash, role, full_name, phone FROM users WHERE LOWER(email) = LOWER(?)",
        (email,),
        one=True
    )

    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if expected_role and user['role'] != expected_role:
        return jsonify({
            'error': f"This account is registered as '{user['role']}', not '{expected_role}'."
        }), 403

    token = generate_jwt_token(user['id'], user['role'], user['email'], user['full_name'])

    user_info = {
        'id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'full_name': user['full_name'],
        'phone': user['phone']
    }

    # Attach role-specific ID
    if user['role'] == 'doctor':
        doc = query_db("SELECT id, specialization, department FROM doctors WHERE user_id = ?", (user['id'],), one=True)
        if doc:
            user_info['doctor_id'] = doc['id']
            user_info['specialization'] = doc['specialization']
            user_info['department'] = doc['department']
    elif user['role'] == 'patient':
        pat = query_db("SELECT id, blood_group, gender, date_of_birth FROM patients WHERE user_id = ?", (user['id'],), one=True)
        if pat:
            user_info['patient_id'] = pat['id']
            user_info['blood_group'] = pat['blood_group']
            user_info['gender'] = pat['gender']

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user_info
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new patient or user with input validation."""
    data = request.get_json() or {}
    
    missing = validate_required_fields(data, ['email', 'password', 'full_name'])
    if missing:
        return jsonify({'error': f"Missing required fields: {', '.join(missing)}"}), 400

    email = data['email'].strip().lower()
    if not validate_email(email):
        return jsonify({'error': 'Invalid email address format'}), 400

    is_valid_pw, pw_err = validate_password(data['password'])
    if not is_valid_pw:
        return jsonify({'error': pw_err}), 400

    # Check if email is already taken
    existing_user = query_db("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email,), one=True)
    if existing_user:
        return jsonify({'error': 'An account with this email already exists'}), 409

    role = data.get('role', 'patient').strip().lower()
    if role not in ['admin', 'doctor', 'patient']:
        return jsonify({'error': 'Invalid user role specified'}), 400

    # Insert user
    password_hash = hash_password(data['password'])
    user_res = execute_db(
        "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)",
        (email, password_hash, role, data['full_name'].strip(), data.get('phone', '').strip())
    )
    user_id = user_res['last_id']

    # Insert role-specific profile
    doctor_id = None
    patient_id = None

    if role == 'patient':
        pat_res = execute_db(
            """INSERT INTO patients (user_id, date_of_birth, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, allergies, medical_history_summary)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                data.get('date_of_birth'),
                data.get('gender', 'Other'),
                data.get('blood_group'),
                data.get('address', ''),
                data.get('emergency_contact_name', ''),
                data.get('emergency_contact_phone', ''),
                data.get('allergies', ''),
                data.get('medical_history_summary', '')
            )
        )
        patient_id = pat_res['last_id']
    elif role == 'doctor':
        doc_res = execute_db(
            """INSERT INTO doctors (user_id, specialization, department, qualification, experience_years, consultation_fee, room_number)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                data.get('specialization', 'General Physician'),
                data.get('department', 'General Medicine'),
                data.get('qualification', 'MBBS'),
                int(data.get('experience_years', 0)),
                float(data.get('consultation_fee', 50.0)),
                data.get('room_number', 'OPD 100')
            )
        )
        doctor_id = doc_res['last_id']

    token = generate_jwt_token(user_id, role, email, data['full_name'])

    user_info = {
        'id': user_id,
        'email': email,
        'role': role,
        'full_name': data['full_name'],
        'phone': data.get('phone', ''),
        'patient_id': patient_id,
        'doctor_id': doctor_id
    }

    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': user_info
    }), 201

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_current_user_profile():
    """Retrieve currently logged in user profile with linked entity."""
    user = g.current_user
    user_info = dict(user)

    if user['role'] == 'doctor':
        doc = query_db("SELECT * FROM doctors WHERE user_id = ?", (user['id'],), one=True)
        if doc:
            user_info['doctor_profile'] = dict(doc)
            user_info['doctor_id'] = doc['id']
    elif user['role'] == 'patient':
        pat = query_db("SELECT * FROM patients WHERE user_id = ?", (user['id'],), one=True)
        if pat:
            user_info['patient_profile'] = dict(pat)
            user_info['patient_id'] = pat['id']

    return jsonify({'user': user_info}), 200

@auth_bp.route('/demo-accounts', methods=['GET'])
def get_demo_accounts():
    """Provides demo credentials for quick testing in frontend."""
    return jsonify({
        'accounts': [
            {
                'role': 'admin',
                'title': 'Hospital Administrator',
                'email': 'admin@hospital.com',
                'password': 'admin123',
                'description': 'Full access to hospital dashboards, analytics, doctors, beds, and billing'
            },
            {
                'role': 'doctor',
                'title': 'Dr. Sarah Patel (Cardiologist)',
                'email': 'dr.sarah.patel@hospital.com',
                'password': 'doctor123',
                'description': 'Manages patient appointments, medical records, prescriptions, and schedule'
            },
            {
                'role': 'patient',
                'title': 'John Doe (Patient)',
                'email': 'john.doe@hospital.com',
                'password': 'patient123',
                'description': 'Books appointments, views personal medical records, bills, and AI symptom assistant'
            }
        ]
    }), 200
