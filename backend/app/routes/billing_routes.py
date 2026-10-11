from flask import Blueprint, request, jsonify, g
from app.database import query_db, execute_db
from app.utils.auth import jwt_required, role_required
from app.utils.validators import validate_required_fields
from datetime import datetime
import uuid

billing_bp = Blueprint('billing', __name__, url_prefix='/api/billing')

@billing_bp.route('', methods=['GET'])
@jwt_required
def list_bills():
    """List bills with status filter."""
    user = g.current_user
    status = request.args.get('status', '').strip()

    base_query = """
        SELECT b.*,
               u.full_name as patient_name, u.email as patient_email, u.phone as patient_phone
        FROM billing_records b
        JOIN patients p ON b.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE 1=1
    """
    args = []

    if user['role'] == 'patient':
        base_query += " AND u.id = ?"
        args.append(user['id'])

    if status:
        base_query += " AND b.payment_status = ?"
        args.append(status)

    base_query += " ORDER BY b.issued_date DESC, b.id DESC"
    bills = query_db(base_query, args)
    return jsonify({'bills': bills}), 200

@billing_bp.route('/<int:bill_id>', methods=['GET'])
@jwt_required
def get_bill(bill_id):
    """Retrieve full bill invoice."""
    user = g.current_user
    bill = query_db(
        """SELECT b.*,
                  u.full_name as patient_name, u.email as patient_email, u.phone as patient_phone,
                  p.address as patient_address
           FROM billing_records b
           JOIN patients p ON b.patient_id = p.id
           JOIN users u ON p.user_id = u.id
           WHERE b.id = ?""",
        (bill_id,),
        one=True
    )
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404

    if user['role'] == 'patient':
        pat = query_db("SELECT id FROM patients WHERE user_id = ?", (user['id'],), one=True)
        if not pat or pat['id'] != bill['patient_id']:
            return jsonify({'error': 'Unauthorized to view this invoice'}), 403

    return jsonify({'bill': bill}), 200

@billing_bp.route('/<int:bill_id>/pay', methods=['PUT'])
@jwt_required
def pay_bill(bill_id):
    """Mark a bill as Paid."""
    data = request.get_json() or {}
    payment_method = data.get('payment_method', 'Credit Card')

    bill = query_db("SELECT * FROM billing_records WHERE id = ?", (bill_id,), one=True)
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404

    now_date = datetime.now().strftime("%Y-%m-%d")
    execute_db(
        """UPDATE billing_records 
           SET payment_status = 'Paid', payment_method = ?, paid_date = ?
           WHERE id = ?""",
        (payment_method, now_date, bill_id)
    )

    updated = query_db("SELECT * FROM billing_records WHERE id = ?", (bill_id,), one=True)
    return jsonify({'message': f"Invoice {bill['bill_number']} marked as Paid", 'bill': updated}), 200

@billing_bp.route('', methods=['POST'])
@role_required('admin')
def create_bill():
    """Generate a new bill/invoice (Admin only)."""
    data = request.get_json() or {}
    missing = validate_required_fields(data, ['patient_id', 'total_amount', 'description', 'due_date'])
    if missing:
        return jsonify({'error': f"Missing fields: {', '.join(missing)}"}), 400

    total = float(data['total_amount'])
    tax = float(data.get('tax_amount', round(total * 0.05, 2)))
    discount = float(data.get('discount_amount', 0.0))
    net = round(total + tax - discount, 2)

    bill_number = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:5].upper()}"
    today_str = datetime.now().strftime("%Y-%m-%d")

    res = execute_db(
        """INSERT INTO billing_records 
           (bill_number, patient_id, appointment_id, total_amount, tax_amount, discount_amount, net_amount, payment_status, payment_method, description, issued_date, due_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            bill_number,
            data['patient_id'],
            data.get('appointment_id'),
            total,
            tax,
            discount,
            net,
            data.get('payment_status', 'Pending'),
            data.get('payment_method', 'Insurance'),
            data['description'],
            today_str,
            data['due_date']
        )
    )

    created = query_db("SELECT * FROM billing_records WHERE id = ?", (res['last_id'],), one=True)
    return jsonify({'message': 'Invoice created successfully', 'bill': created}), 201

@billing_bp.route('/<int:bill_id>', methods=['PUT'])
@role_required('admin')
def update_bill(bill_id):
    """Update bill metadata or status (Admin only)."""
    data = request.get_json() or {}
    execute_db(
        """UPDATE billing_records 
           SET payment_status = COALESCE(?, payment_status),
               payment_method = COALESCE(?, payment_method),
               description = COALESCE(?, description),
               due_date = COALESCE(?, due_date)
           WHERE id = ?""",
        (data.get('payment_status'), data.get('payment_method'), data.get('description'), data.get('due_date'), bill_id)
    )
    updated = query_db("SELECT * FROM billing_records WHERE id = ?", (bill_id,), one=True)
    return jsonify({'message': 'Invoice updated', 'bill': updated}), 200
