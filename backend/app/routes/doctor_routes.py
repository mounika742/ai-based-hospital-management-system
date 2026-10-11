from flask import Blueprint, request, jsonify, g
from app.database import query_db, execute_db
from app.utils.auth import jwt_required, role_required
from app.utils.validators import validate_email, validate_required_fields

doctor_bp = Blueprint('doctors', __name__, url_prefix='/api/doctors')

@doctor_bp.route('', methods=['GET'])
def list_doctors():
    """List doctors with department, status, and search filters."""
    department = request.args.get('department', '').strip()
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip().lower()

    query = """
        SELECT d.*, u.full_name, u.email, u.phone 
        FROM doctors d 
        JOIN users u ON d.user_id = u.id 
        WHERE 1=1
    """
    args = []

    if department:
        query += " AND LOWER(d.department) = LOWER(?)"
        args.append(department)

    if status:
        query += " AND d.status = ?"
        args.append(status)

    if search:
        query += " AND (LOWER(u.full_name) LIKE ? OR LOWER(d.specialization) LIKE ? OR LOWER(d.department) LIKE ?)"
        term = f"%{search}%"
        args.extend([term, term, term])

    query += " ORDER BY d.department ASC, u.full_name ASC"
    doctors = query_db(query, args)
    return jsonify({'doctors': doctors}), 200

@doctor_bp.route('/departments', methods=['GET'])
def get_departments():
    """Returns list of distinct departments with doctor counts."""
    depts = query_db("""
        SELECT department, COUNT(*) as doctor_count 
        FROM doctors 
        WHERE status = 'Active' 
        GROUP BY department 
        ORDER BY department ASC
    """)
    return jsonify({'departments': depts}), 200

@doctor_bp.route('/<int:doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    """Get single doctor profile."""
    doctor = query_db(
        """SELECT d.*, u.full_name, u.email, u.phone 
           FROM doctors d 
           JOIN users u ON d.user_id = u.id 
           WHERE d.id = ?""",
        (doctor_id,),
        one=True
    )
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    # Fetch doctor's upcoming schedule
    upcoming_appointments = query_db(
        """SELECT a.*, u.full_name as patient_name 
           FROM appointments a 
           JOIN patients p ON a.patient_id = p.id 
           JOIN users u ON p.user_id = u.id 
           WHERE a.doctor_id = ? AND a.appointment_date >= DATE('now')
           ORDER BY a.appointment_date ASC, a.appointment_time ASC
           LIMIT 10""",
        (doctor_id,)
    )

    result = dict(doctor)
    result['upcoming_appointments'] = upcoming_appointments
    return jsonify({'doctor': result}), 200

@doctor_bp.route('/<int:doctor_id>', methods=['PUT'])
@jwt_required
def update_doctor(doctor_id):
    """Update doctor availability, fees, or profile (Admin or the Doctor)."""
    user = g.current_user
    doctor = query_db("SELECT * FROM doctors WHERE id = ?", (doctor_id,), one=True)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    # Permission check
    if user['role'] != 'admin' and (user['role'] != 'doctor' or doctor['user_id'] != user['id']):
        return jsonify({'error': 'Unauthorized to modify this doctor profile'}), 403

    data = request.get_json() or {}

    execute_db(
        """UPDATE doctors 
           SET specialization = COALESCE(?, specialization),
               department = COALESCE(?, department),
               qualification = COALESCE(?, qualification),
               experience_years = COALESCE(?, experience_years),
               consultation_fee = COALESCE(?, consultation_fee),
               room_number = COALESCE(?, room_number),
               available_days = COALESCE(?, available_days),
               available_time_start = COALESCE(?, available_time_start),
               available_time_end = COALESCE(?, available_time_end),
               status = COALESCE(?, status)
           WHERE id = ?""",
        (
            data.get('specialization'),
            data.get('department'),
            data.get('qualification'),
            data.get('experience_years'),
            data.get('consultation_fee'),
            data.get('room_number'),
            data.get('available_days'),
            data.get('available_time_start'),
            data.get('available_time_end'),
            data.get('status'),
            doctor_id
        )
    )

    if 'full_name' in data or 'phone' in data:
        execute_db(
            """UPDATE users 
               SET full_name = COALESCE(?, full_name),
                   phone = COALESCE(?, phone),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?""",
            (data.get('full_name'), data.get('phone'), doctor['user_id'])
        )

    updated = query_db(
        """SELECT d.*, u.full_name, u.email, u.phone 
           FROM doctors d 
           JOIN users u ON d.user_id = u.id 
           WHERE d.id = ?""",
        (doctor_id,),
        one=True
    )

    return jsonify({'message': 'Doctor profile updated', 'doctor': updated}), 200

@doctor_bp.route('', methods=['POST'])
@role_required('admin')
def create_doctor():
    """Create a new doctor (Admin only)."""
    data = request.get_json() or {}
    missing = validate_required_fields(data, ['email', 'password', 'full_name', 'specialization', 'department'])
    if missing:
        return jsonify({'error': f"Missing required fields: {', '.join(missing)}"}), 400

    from app.utils.auth import hash_password
    email = data['email'].strip().lower()
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    existing = query_db("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email,), one=True)
    if existing:
        return jsonify({'error': 'User with this email already exists'}), 409

    pw_hash = hash_password(data['password'])
    u_res = execute_db(
        "INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, 'doctor', ?, ?)",
        (email, pw_hash, data['full_name'].strip(), data.get('phone', ''))
    )

    doc_res = execute_db(
        """INSERT INTO doctors 
           (user_id, specialization, department, qualification, experience_years, consultation_fee, room_number, available_days, available_time_start, available_time_end, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            u_res['last_id'],
            data['specialization'],
            data['department'],
            data.get('qualification', 'MD'),
            int(data.get('experience_years', 0)),
            float(data.get('consultation_fee', 50.0)),
            data.get('room_number', 'OPD 100'),
            data.get('available_days', 'Monday,Tuesday,Wednesday,Thursday,Friday'),
            data.get('available_time_start', '09:00'),
            data.get('available_time_end', '17:00'),
            data.get('status', 'Active')
        )
    )

    created_doc = query_db(
        """SELECT d.*, u.full_name, u.email, u.phone 
           FROM doctors d 
           JOIN users u ON d.user_id = u.id 
           WHERE d.id = ?""",
        (doc_res['last_id'],),
        one=True
    )
    return jsonify({'message': 'Doctor added successfully', 'doctor': created_doc}), 201
