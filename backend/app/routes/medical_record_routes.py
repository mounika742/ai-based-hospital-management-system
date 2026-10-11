from flask import Blueprint, request, jsonify, g
from app.database import query_db, execute_db
from app.utils.auth import jwt_required, role_required
from app.utils.validators import validate_required_fields

medical_record_bp = Blueprint('medical_records', __name__, url_prefix='/api/medical-records')

@medical_record_bp.route('', methods=['GET'])
@jwt_required
def list_records():
    """List medical records according to role."""
    user = g.current_user
    patient_id = request.args.get('patient_id')

    base_query = """
        SELECT r.*,
               pat_u.full_name as patient_name, pat_u.email as patient_email, p.blood_group,
               doc_u.full_name as doctor_name, d.specialization, d.department
        FROM medical_records r
        JOIN patients p ON r.patient_id = p.id
        JOIN users pat_u ON p.user_id = pat_u.id
        JOIN doctors d ON r.doctor_id = d.id
        JOIN users doc_u ON d.user_id = doc_u.id
        WHERE 1=1
    """
    args = []

    if user['role'] == 'patient':
        base_query += " AND pat_u.id = ?"
        args.append(user['id'])
    elif patient_id:
        base_query += " AND r.patient_id = ?"
        args.append(patient_id)

    base_query += " ORDER BY r.visit_date DESC, r.id DESC"
    records = query_db(base_query, args)
    return jsonify({'records': records}), 200

@medical_record_bp.route('/<int:record_id>', methods=['GET'])
@jwt_required
def get_record(record_id):
    """Get single medical record."""
    user = g.current_user
    record = query_db(
        """SELECT r.*,
                  pat_u.full_name as patient_name, pat_u.email as patient_email, p.blood_group, p.allergies,
                  doc_u.full_name as doctor_name, d.specialization, d.department
           FROM medical_records r
           JOIN patients p ON r.patient_id = p.id
           JOIN users pat_u ON p.user_id = pat_u.id
           JOIN doctors d ON r.doctor_id = d.id
           JOIN users doc_u ON d.user_id = doc_u.id
           WHERE r.id = ?""",
        (record_id,),
        one=True
    )
    if not record:
        return jsonify({'error': 'Record not found'}), 404

    if user['role'] == 'patient':
        pat = query_db("SELECT id FROM patients WHERE user_id = ?", (user['id'],), one=True)
        if not pat or pat['id'] != record['patient_id']:
            return jsonify({'error': 'Unauthorized to view this record'}), 403

    return jsonify({'record': record}), 200

@medical_record_bp.route('', methods=['POST'])
@role_required('admin', 'doctor')
def create_record():
    """Create a new medical record (Doctor or Admin)."""
    user = g.current_user
    data = request.get_json() or {}

    missing = validate_required_fields(data, ['patient_id', 'visit_date', 'diagnosis'])
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    doctor_id = None
    if user['role'] == 'doctor':
        doc = query_db("SELECT id FROM doctors WHERE user_id = ?", (user['id'],), one=True)
        if not doc:
            return jsonify({'error': 'Doctor profile not found'}), 400
        doctor_id = doc['id']
    else:
        doctor_id = data.get('doctor_id')
        if not doctor_id:
            return jsonify({'error': 'doctor_id is required'}), 400

    res = execute_db(
        """INSERT INTO medical_records 
           (patient_id, doctor_id, appointment_id, visit_date, diagnosis, prescription, treatment_plan, lab_tests_recommended, follow_up_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data['patient_id'],
            doctor_id,
            data.get('appointment_id'),
            data['visit_date'],
            data['diagnosis'],
            data.get('prescription', ''),
            data.get('treatment_plan', ''),
            data.get('lab_tests_recommended', ''),
            data.get('follow_up_date')
        )
    )

    # If appointment_id provided, mark appointment as completed
    if data.get('appointment_id'):
        execute_db("UPDATE appointments SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (data['appointment_id'],))

    created = query_db(
        """SELECT r.*,
                  pat_u.full_name as patient_name,
                  doc_u.full_name as doctor_name, d.specialization
           FROM medical_records r
           JOIN patients p ON r.patient_id = p.id
           JOIN users pat_u ON p.user_id = pat_u.id
           JOIN doctors d ON r.doctor_id = d.id
           JOIN users doc_u ON d.user_id = doc_u.id
           WHERE r.id = ?""",
        (res['last_id'],),
        one=True
    )
    return jsonify({'message': 'Medical record created successfully', 'record': created}), 201

@medical_record_bp.route('/<int:record_id>', methods=['PUT'])
@role_required('admin', 'doctor')
def update_record(record_id):
    """Update medical record details."""
    data = request.get_json() or {}
    execute_db(
        """UPDATE medical_records 
           SET diagnosis = COALESCE(?, diagnosis),
               prescription = COALESCE(?, prescription),
               treatment_plan = COALESCE(?, treatment_plan),
               lab_tests_recommended = COALESCE(?, lab_tests_recommended),
               follow_up_date = COALESCE(?, follow_up_date)
           WHERE id = ?""",
        (
            data.get('diagnosis'),
            data.get('prescription'),
            data.get('treatment_plan'),
            data.get('lab_tests_recommended'),
            data.get('follow_up_date'),
            record_id
        )
    )
    return jsonify({'message': 'Record updated successfully'}), 200

@medical_record_bp.route('/<int:record_id>', methods=['DELETE'])
@role_required('admin')
def delete_record(record_id):
    """Delete medical record (Admin only)."""
    execute_db("DELETE FROM medical_records WHERE id = ?", (record_id,))
    return jsonify({'message': 'Record deleted successfully'}), 200
