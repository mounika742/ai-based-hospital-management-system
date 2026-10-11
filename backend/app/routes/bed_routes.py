from flask import Blueprint, request, jsonify, g
from app.database import query_db, execute_db
from app.utils.auth import jwt_required, role_required
from app.utils.validators import validate_required_fields
from datetime import datetime

bed_bp = Blueprint('beds', __name__, url_prefix='/api/beds')

@bed_bp.route('', methods=['GET'])
@jwt_required
def list_beds():
    """List hospital beds with optional ward and status filtering."""
    ward = request.args.get('ward', '').strip()
    status = request.args.get('status', '').strip()

    query = """
        SELECT b.*, 
               u.full_name as patient_name, u.email as patient_email, p.blood_group
        FROM hospital_beds b
        LEFT JOIN patients p ON b.current_patient_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE 1=1
    """
    args = []

    if ward:
        query += " AND b.ward = ?"
        args.append(ward)

    if status:
        query += " AND b.status = ?"
        args.append(status)

    query += " ORDER BY b.ward ASC, b.bed_number ASC"
    beds = query_db(query, args)
    return jsonify({'beds': beds}), 200

@bed_bp.route('/summary', methods=['GET'])
@jwt_required
def get_bed_summary():
    """Returns summary stats of bed occupancy overall and per ward."""
    total = query_db("SELECT COUNT(*) as cnt FROM hospital_beds", one=True)['cnt']
    available = query_db("SELECT COUNT(*) as cnt FROM hospital_beds WHERE status = 'Available'", one=True)['cnt']
    occupied = query_db("SELECT COUNT(*) as cnt FROM hospital_beds WHERE status = 'Occupied'", one=True)['cnt']
    maintenance = query_db("SELECT COUNT(*) as cnt FROM hospital_beds WHERE status = 'Maintenance'", one=True)['cnt']

    ward_breakdown = query_db("""
        SELECT ward, 
               COUNT(*) as total,
               SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
               SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
               SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
        FROM hospital_beds
        GROUP BY ward
        ORDER BY ward ASC
    """)

    occupancy_rate = round((occupied / total * 100), 1) if total > 0 else 0

    return jsonify({
        'summary': {
            'total_beds': total,
            'available_beds': available,
            'occupied_beds': occupied,
            'maintenance_beds': maintenance,
            'occupancy_rate': occupancy_rate,
            'wards': ward_breakdown
        }
    }), 200

@bed_bp.route('/<int:bed_id>/allocate', methods=['PUT'])
@role_required('admin', 'doctor')
def allocate_bed(bed_id):
    """Assign an available bed to a patient."""
    data = request.get_json() or {}
    patient_id = data.get('patient_id')
    notes = data.get('notes', '')

    if not patient_id:
        return jsonify({'error': 'patient_id is required'}), 400

    bed = query_db("SELECT * FROM hospital_beds WHERE id = ?", (bed_id,), one=True)
    if not bed:
        return jsonify({'error': 'Bed not found'}), 404

    if bed['status'] == 'Occupied':
        return jsonify({'error': 'Bed is already occupied'}), 409

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    execute_db(
        """UPDATE hospital_beds 
           SET status = 'Occupied', current_patient_id = ?, admitted_at = ?, notes = ?
           WHERE id = ?""",
        (patient_id, now_str, notes, bed_id)
    )

    updated = query_db(
        """SELECT b.*, u.full_name as patient_name 
           FROM hospital_beds b 
           JOIN patients p ON b.current_patient_id = p.id 
           JOIN users u ON p.user_id = u.id 
           WHERE b.id = ?""",
        (bed_id,),
        one=True
    )
    return jsonify({'message': f"Bed {bed['bed_number']} allocated successfully", 'bed': updated}), 200

@bed_bp.route('/<int:bed_id>/discharge', methods=['PUT'])
@role_required('admin', 'doctor')
def discharge_bed(bed_id):
    """Discharge patient from a bed and set status back to Available."""
    bed = query_db("SELECT * FROM hospital_beds WHERE id = ?", (bed_id,), one=True)
    if not bed:
        return jsonify({'error': 'Bed not found'}), 404

    execute_db(
        """UPDATE hospital_beds 
           SET status = 'Available', current_patient_id = NULL, admitted_at = NULL, notes = 'Sanitized and ready'
           WHERE id = ?""",
        (bed_id,)
    )

    updated = query_db("SELECT * FROM hospital_beds WHERE id = ?", (bed_id,), one=True)
    return jsonify({'message': f"Bed {bed['bed_number']} is now Available", 'bed': updated}), 200

@bed_bp.route('', methods=['POST'])
@role_required('admin')
def add_bed():
    """Add a new bed to hospital inventory (Admin only)."""
    data = request.get_json() or {}
    missing = validate_required_fields(data, ['bed_number', 'ward', 'floor'])
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    existing = query_db("SELECT id FROM hospital_beds WHERE bed_number = ?", (data['bed_number'].strip(),), one=True)
    if existing:
        return jsonify({'error': 'Bed number already exists'}), 409

    res = execute_db(
        """INSERT INTO hospital_beds (bed_number, ward, floor, status, notes)
           VALUES (?, ?, ?, ?, ?)""",
        (
            data['bed_number'].strip(),
            data['ward'],
            data['floor'],
            data.get('status', 'Available'),
            data.get('notes', '')
        )
    )
    created = query_db("SELECT * FROM hospital_beds WHERE id = ?", (res['last_id'],), one=True)
    return jsonify({'message': 'Bed added successfully', 'bed': created}), 201

@bed_bp.route('/<int:bed_id>', methods=['PUT'])
@role_required('admin')
def update_bed(bed_id):
    """Update bed details or maintenance status (Admin only)."""
    data = request.get_json() or {}
    execute_db(
        """UPDATE hospital_beds 
           SET ward = COALESCE(?, ward),
               floor = COALESCE(?, floor),
               status = COALESCE(?, status),
               notes = COALESCE(?, notes)
           WHERE id = ?""",
        (data.get('ward'), data.get('floor'), data.get('status'), data.get('notes'), bed_id)
    )
    updated = query_db("SELECT * FROM hospital_beds WHERE id = ?", (bed_id,), one=True)
    return jsonify({'message': 'Bed updated', 'bed': updated}), 200
