from flask import Blueprint, request, jsonify, g
from app.database import query_db, execute_db
from app.utils.auth import jwt_required, role_required
from app.utils.validators import validate_email, validate_required_fields

patient_bp = Blueprint('patients', __name__, url_prefix='/api/patients')

@patient_bp.route('', methods=['GET'])
@jwt_required
def list_patients():
    """List patients with search filter. Admin and Doctor see all; Patient sees only their own."""
    user = g.current_user
    search = request.args.get('search', '').strip().lower()

    if user['role'] == 'patient':
        # Patient can only view their own profile
        query = """
            SELECT p.*, u.full_name, u.email, u.phone 
            FROM patients p 
            JOIN users u ON p.user_id = u.id 
            WHERE u.id = ?
        """
        patients = query_db(query, (user['id'],))
        return jsonify({'patients': patients}), 200

    # Admin and Doctor can view and search all patients
    base_query = """
        SELECT p.*, u.full_name, u.email, u.phone 
        FROM patients p 
        JOIN users u ON p.user_id = u.id 
    """
    args = []
    if search:
        base_query += " WHERE LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR u.phone LIKE ? OR LOWER(p.blood_group) LIKE ?"
        term = f"%{search}%"
        args = [term, term, term, term]
        
    base_query += " ORDER BY p.id DESC"
    patients = query_db(base_query, args)
    return jsonify({'patients': patients}), 200

@patient_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required
def get_patient(patient_id):
    """Retrieve full details of a single patient including medical records and appointments."""
    user = g.current_user
    
    patient = query_db(
        """SELECT p.*, u.full_name, u.email, u.phone 
           FROM patients p 
           JOIN users u ON p.user_id = u.id 
           WHERE p.id = ?""",
        (patient_id,),
        one=True
    )
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    # Authorization check
    if user['role'] == 'patient' and patient['user_id'] != user['id']:
        return jsonify({'error': 'Access denied to this patient profile'}), 403

    # Fetch recent appointments
    appointments = query_db(
        """SELECT a.*, u.full_name as doctor_name, d.specialization, d.department 
           FROM appointments a 
           JOIN doctors d ON a.doctor_id = d.id 
           JOIN users u ON d.user_id = u.id 
           WHERE a.patient_id = ? 
           ORDER BY a.appointment_date DESC, a.appointment_time DESC""",
        (patient_id,)
    )

    # Fetch medical records
    records = query_db(
        """SELECT r.*, u.full_name as doctor_name, d.specialization 
           FROM medical_records r 
           JOIN doctors d ON r.doctor_id = d.id 
           JOIN users u ON d.user_id = u.id 
           WHERE r.patient_id = ? 
           ORDER BY r.visit_date DESC""",
        (patient_id,)
    )

    # Fetch billing history
    bills = query_db(
        """SELECT * FROM billing_records WHERE patient_id = ? ORDER BY issued_date DESC""",
        (patient_id,)
    )

    result = dict(patient)
    result['appointments'] = appointments
    result['medical_records'] = records
    result['bills'] = bills

    return jsonify({'patient': result}), 200

@patient_bp.route('/<int:patient_id>', methods=['PUT'])
@jwt_required
def update_patient(patient_id):
    """Update patient details."""
    user = g.current_user
    patient = query_db("SELECT * FROM patients WHERE id = ?", (patient_id,), one=True)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    # Permission check: admin, doctor, or owner patient
    if user['role'] == 'patient' and patient['user_id'] != user['id']:
        return jsonify({'error': 'Unauthorized to modify this profile'}), 403

    data = request.get_json() or {}

    # Update patient table fields
    execute_db(
        """UPDATE patients 
           SET date_of_birth = COALESCE(?, date_of_birth),
               gender = COALESCE(?, gender),
               blood_group = COALESCE(?, blood_group),
               address = COALESCE(?, address),
               emergency_contact_name = COALESCE(?, emergency_contact_name),
               emergency_contact_phone = COALESCE(?, emergency_contact_phone),
               allergies = COALESCE(?, allergies),
               medical_history_summary = COALESCE(?, medical_history_summary)
           WHERE id = ?""",
        (
            data.get('date_of_birth'),
            data.get('gender'),
            data.get('blood_group'),
            data.get('address'),
            data.get('emergency_contact_name'),
            data.get('emergency_contact_phone'),
            data.get('allergies'),
            data.get('medical_history_summary'),
            patient_id
        )
    )

    # Update users table fields if provided
    if 'full_name' in data or 'phone' in data:
        execute_db(
            """UPDATE users 
               SET full_name = COALESCE(?, full_name),
                   phone = COALESCE(?, phone),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?""",
            (data.get('full_name'), data.get('phone'), patient['user_id'])
        )

    updated_patient = query_db(
        """SELECT p.*, u.full_name, u.email, u.phone 
           FROM patients p 
           JOIN users u ON p.user_id = u.id 
           WHERE p.id = ?""",
        (patient_id,),
        one=True
    )

    return jsonify({'message': 'Patient updated successfully', 'patient': updated_patient}), 200

@patient_bp.route('/<int:patient_id>', methods=['DELETE'])
@role_required('admin')
def delete_patient(patient_id):
    """Delete a patient record (Admin only). Cascade will remove linked records."""
    patient = query_db("SELECT user_id FROM patients WHERE id = ?", (patient_id,), one=True)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    execute_db("DELETE FROM users WHERE id = ?", (patient['user_id'],))
    return jsonify({'message': 'Patient record deleted successfully'}), 200
