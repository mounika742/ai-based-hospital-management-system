from flask import Blueprint, jsonify, g
from app.database import query_db
from app.utils.auth import jwt_required
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required
def get_dashboard_stats():
    """Retrieve role-tailored hospital analytics and KPI numbers."""
    user = g.current_user
    today_str = datetime.now().strftime("%Y-%m-%d")

    if user['role'] == 'admin':
        # Admin Global Hospital Overview
        total_patients = query_db("SELECT COUNT(*) as cnt FROM patients", one=True)['cnt']
        total_doctors = query_db("SELECT COUNT(*) as cnt FROM doctors WHERE status = 'Active'", one=True)['cnt']
        total_appointments = query_db("SELECT COUNT(*) as cnt FROM appointments", one=True)['cnt']
        today_appointments = query_db("SELECT COUNT(*) as cnt FROM appointments WHERE appointment_date = ?", (today_str,), one=True)['cnt']

        # Beds
        total_beds = query_db("SELECT COUNT(*) as cnt FROM hospital_beds", one=True)['cnt']
        occupied_beds = query_db("SELECT COUNT(*) as cnt FROM hospital_beds WHERE status = 'Occupied'", one=True)['cnt']
        available_beds = query_db("SELECT COUNT(*) as cnt FROM hospital_beds WHERE status = 'Available'", one=True)['cnt']
        occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0

        # Revenue
        revenue_paid = query_db("SELECT COALESCE(SUM(net_amount), 0) as total FROM billing_records WHERE payment_status = 'Paid'", one=True)['total']
        revenue_pending = query_db("SELECT COALESCE(SUM(net_amount), 0) as total FROM billing_records WHERE payment_status IN ('Pending', 'Overdue')", one=True)['total']

        # Bed distribution by ward
        ward_distribution = query_db("""
            SELECT ward,
                   COUNT(*) as total,
                   SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
                   SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available
            FROM hospital_beds
            GROUP BY ward
        """)

        # Department distribution
        dept_distribution = query_db("""
            SELECT d.department, COUNT(a.id) as appointment_count
            FROM doctors d
            LEFT JOIN appointments a ON d.id = a.doctor_id
            GROUP BY d.department
            ORDER BY appointment_count DESC
        """)

        # Recent 5 appointments
        recent_appointments = query_db("""
            SELECT a.*, pat_u.full_name as patient_name, doc_u.full_name as doctor_name, d.department
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pat_u ON p.user_id = pat_u.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users doc_u ON d.user_id = doc_u.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
            LIMIT 5
        """)

        return jsonify({
            'role': 'admin',
            'metrics': {
                'total_patients': total_patients,
                'total_doctors': total_doctors,
                'total_appointments': total_appointments,
                'today_appointments': today_appointments,
                'total_beds': total_beds,
                'occupied_beds': occupied_beds,
                'available_beds': available_beds,
                'occupancy_rate': occupancy_rate,
                'total_revenue': round(revenue_paid, 2),
                'pending_revenue': round(revenue_pending, 2)
            },
            'charts': {
                'ward_distribution': ward_distribution,
                'department_distribution': dept_distribution
            },
            'recent_appointments': recent_appointments
        }), 200

    elif user['role'] == 'doctor':
        # Doctor Profile Stats
        doc = query_db("SELECT * FROM doctors WHERE user_id = ?", (user['id'],), one=True)
        if not doc:
            return jsonify({'error': 'Doctor profile not found'}), 404

        doc_id = doc['id']
        today_app_cnt = query_db("SELECT COUNT(*) as cnt FROM appointments WHERE doctor_id = ? AND appointment_date = ?", (doc_id, today_str), one=True)['cnt']
        total_app_cnt = query_db("SELECT COUNT(*) as cnt FROM appointments WHERE doctor_id = ?", (doc_id,), one=True)['cnt']
        completed_app_cnt = query_db("SELECT COUNT(*) as cnt FROM appointments WHERE doctor_id = ? AND status = 'Completed'", (doc_id,), one=True)['cnt']
        records_written = query_db("SELECT COUNT(*) as cnt FROM medical_records WHERE doctor_id = ?", (doc_id,), one=True)['cnt']

        today_appointments = query_db("""
            SELECT a.*, pat_u.full_name as patient_name, pat_u.phone as patient_phone, p.blood_group
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pat_u ON p.user_id = pat_u.id
            WHERE a.doctor_id = ? AND a.appointment_date = ?
            ORDER BY a.appointment_time ASC
        """, (doc_id, today_str))

        upcoming_appointments = query_db("""
            SELECT a.*, pat_u.full_name as patient_name, pat_u.phone as patient_phone
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pat_u ON p.user_id = pat_u.id
            WHERE a.doctor_id = ? AND a.appointment_date >= ?
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
            LIMIT 5
        """, (doc_id, today_str))

        return jsonify({
            'role': 'doctor',
            'doctor_info': doc,
            'metrics': {
                'today_appointments': today_app_cnt,
                'total_appointments': total_app_cnt,
                'completed_appointments': completed_app_cnt,
                'medical_records_authored': records_written,
                'consultation_fee': doc['consultation_fee'],
                'room_number': doc['room_number']
            },
            'today_appointments': today_appointments,
            'upcoming_appointments': upcoming_appointments
        }), 200

    elif user['role'] == 'patient':
        # Patient Profile Stats
        pat = query_db("SELECT * FROM patients WHERE user_id = ?", (user['id'],), one=True)
        if not pat:
            return jsonify({'error': 'Patient profile not found'}), 404

        pat_id = pat['id']
        upcoming_count = query_db("SELECT COUNT(*) as cnt FROM appointments WHERE patient_id = ? AND appointment_date >= ? AND status != 'Cancelled'", (pat_id, today_str), one=True)['cnt']
        records_count = query_db("SELECT COUNT(*) as cnt FROM medical_records WHERE patient_id = ?", (pat_id,), one=True)['cnt']
        pending_bills_amount = query_db("SELECT COALESCE(SUM(net_amount), 0) as total FROM billing_records WHERE patient_id = ? AND payment_status IN ('Pending', 'Overdue')", (pat_id,), one=True)['total']

        # Bed admission check
        assigned_bed = query_db("SELECT * FROM hospital_beds WHERE current_patient_id = ?", (pat_id,), one=True)

        upcoming_appointments = query_db("""
            SELECT a.*, doc_u.full_name as doctor_name, d.specialization, d.department, d.room_number
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users doc_u ON d.user_id = doc_u.id
            WHERE a.patient_id = ? AND a.appointment_date >= ? AND a.status != 'Cancelled'
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        """, (pat_id, today_str))

        recent_records = query_db("""
            SELECT r.*, doc_u.full_name as doctor_name, d.specialization
            FROM medical_records r
            JOIN doctors d ON r.doctor_id = d.id
            JOIN users doc_u ON d.user_id = doc_u.id
            WHERE r.patient_id = ?
            ORDER BY r.visit_date DESC
            LIMIT 3
        """, (pat_id,))

        return jsonify({
            'role': 'patient',
            'patient_info': pat,
            'metrics': {
                'upcoming_appointments': upcoming_count,
                'medical_records_count': records_count,
                'pending_bills_amount': round(pending_bills_amount, 2),
                'admitted_bed': assigned_bed['bed_number'] if assigned_bed else 'None'
            },
            'assigned_bed': assigned_bed,
            'upcoming_appointments': upcoming_appointments,
            'recent_records': recent_records
        }), 200
