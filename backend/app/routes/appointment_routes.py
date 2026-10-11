from flask import Blueprint, request, jsonify, g
from app.database import query_db, execute_db
from app.utils.auth import jwt_required
from app.utils.validators import validate_required_fields, validate_date, validate_time
import uuid

appointment_bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')

@appointment_bp.route('', methods=['GET'])
@jwt_required
def list_appointments():
    """List appointments tailored by user role."""
    user = g.current_user
    status_filter = request.args.get('status', '').strip()
    date_filter = request.args.get('date', '').strip()

    base_query = """
        SELECT a.*, 
               pat_u.full_name as patient_name, pat_u.email as patient_email, pat_u.phone as patient_phone,
               doc_u.full_name as doctor_name, d.specialization, d.department, d.consultation_fee, d.room_number
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users pat_u ON p.user_id = pat_u.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users doc_u ON d.user_id = doc_u.id
        WHERE 1=1
    """
    args = []

    if user['role'] == 'patient':
        base_query += " AND pat_u.id = ?"
        args.append(user['id'])
    elif user['role'] == 'doctor':
        base_query += " AND doc_u.id = ?"
        args.append(user['id'])

    if status_filter:
        base_query += " AND a.status = ?"
        args.append(status_filter)

    if date_filter:
        base_query += " AND a.appointment_date = ?"
        args.append(date_filter)

    base_query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC"
    appointments = query_db(base_query, args)
    return jsonify({'appointments': appointments}), 200

@appointment_bp.route('', methods=['POST'])
@jwt_required
def book_appointment():
    """Book a new appointment."""
    user = g.current_user
    data = request.get_json() or {}

    missing = validate_required_fields(data, ['doctor_id', 'appointment_date', 'appointment_time'])
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    if not validate_date(data['appointment_date']):
        return jsonify({'error': 'Invalid appointment_date format (expected YYYY-MM-DD)'}), 400

    if not validate_time(data['appointment_time']):
        return jsonify({'error': 'Invalid appointment_time format (expected HH:MM)'}), 400

    # Determine patient_id
    if user['role'] == 'patient':
        pat = query_db("SELECT id FROM patients WHERE user_id = ?", (user['id'],), one=True)
        if not pat:
            return jsonify({'error': 'Patient record profile not found for this account'}), 400
        patient_id = pat['id']
    else:
        if 'patient_id' not in data:
            return jsonify({'error': 'patient_id is required for administrative booking'}), 400
        patient_id = data['patient_id']

    # Verify doctor exists
    doctor = query_db("SELECT id, consultation_fee, department FROM doctors WHERE id = ?", (data['doctor_id'],), one=True)
    if not doctor:
        return jsonify({'error': 'Selected doctor not found'}), 404

    # Check for slot collision for this doctor
    collision = query_db(
        """SELECT id FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'""",
        (data['doctor_id'], data['appointment_date'], data['appointment_time']),
        one=True
    )
    if collision:
        return jsonify({'error': 'Doctor already has an appointment booked at this date and time slot'}), 409

    # Insert appointment
    app_res = execute_db(
        """INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, symptoms, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?)""",
        (
            patient_id,
            data['doctor_id'],
            data['appointment_date'],
            data['appointment_time'],
            data.get('reason', 'General Consultation'),
            data.get('symptoms', ''),
            data.get('notes', '')
        )
    )
    app_id = app_res['last_id']

    # Create associated bill for consultation fee
    fee = float(doctor['consultation_fee'])
    bill_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
    execute_db(
        """INSERT INTO billing_records (bill_number, patient_id, appointment_id, total_amount, tax_amount, discount_amount, net_amount, payment_status, payment_method, description, issued_date, due_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'Online', ?, ?, ?)""",
        (
            bill_number,
            patient_id,
            app_id,
            fee,
            round(fee * 0.05, 2), # 5% tax
            0.0,
            round(fee * 1.05, 2),
            f"Consultation Fee - {doctor['department']}",
            data['appointment_date'],
            data['appointment_date']
        )
    )

    # Return created appointment
    created = query_db(
        """SELECT a.*, 
                  pat_u.full_name as patient_name,
                  doc_u.full_name as doctor_name, d.specialization, d.department, d.room_number
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN users pat_u ON p.user_id = pat_u.id
           JOIN doctors d ON a.doctor_id = d.id
           JOIN users doc_u ON d.user_id = doc_u.id
           WHERE a.id = ?""",
        (app_id,),
        one=True
    )

    return jsonify({'message': 'Appointment booked successfully', 'appointment': created}), 201

@appointment_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required
def update_appointment(appointment_id):
    """Update appointment status (Confirm, Cancel, Reschedule, Complete)."""
    user = g.current_user
    app = query_db("SELECT * FROM appointments WHERE id = ?", (appointment_id,), one=True)
    if not app:
        return jsonify({'error': 'Appointment not found'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    new_date = data.get('appointment_date')
    new_time = data.get('appointment_time')
    new_notes = data.get('notes')

    if new_status and new_status not in ['Scheduled', 'Confirmed', 'Completed', 'Cancelled']:
        return jsonify({'error': 'Invalid status'}), 400

    execute_db(
        """UPDATE appointments 
           SET status = COALESCE(?, status),
               appointment_date = COALESCE(?, appointment_date),
               appointment_time = COALESCE(?, appointment_time),
               notes = COALESCE(?, notes),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (new_status, new_date, new_time, new_notes, appointment_id)
    )

    updated = query_db(
        """SELECT a.*, 
                  pat_u.full_name as patient_name,
                  doc_u.full_name as doctor_name, d.specialization, d.department, d.room_number
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN users pat_u ON p.user_id = pat_u.id
           JOIN doctors d ON a.doctor_id = d.id
           JOIN users doc_u ON d.user_id = doc_u.id
           WHERE a.id = ?""",
        (appointment_id,),
        one=True
    )

    return jsonify({'message': 'Appointment updated successfully', 'appointment': updated}), 200

@appointment_bp.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required
def cancel_appointment(appointment_id):
    """Cancel appointment."""
    execute_db("UPDATE appointments SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (appointment_id,))
    return jsonify({'message': 'Appointment cancelled successfully'}), 200
