import jwt
import datetime
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from app.config import Config
from app.database import query_db

def hash_password(password: str) -> str:
    """Hash password using Werkzeug security pbkdf2:sha256."""
    return generate_password_hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against stored hash."""
    return check_password_hash(password_hash, password)

def generate_jwt_token(user_id: int, role: str, email: str, full_name: str) -> str:
    """Generate a signed JWT token valid for configured hours."""
    payload = {
        'sub': str(user_id),
        'user_id': user_id,
        'role': role,
        'email': email,
        'full_name': full_name,
        'iat': datetime.datetime.now(datetime.timezone.utc),
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def decode_jwt_token(token: str):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 401
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid token format. Expected Bearer <token>'}), 401
            
        token = parts[1]
        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or has expired'}), 401
            
        # Verify user still exists in the database
        user = query_db("SELECT id, email, role, full_name FROM users WHERE id = ?", (payload['user_id'],), one=True)
        if not user:
            return jsonify({'error': 'User not found'}), 401
            
        # Store user details in Flask g context
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def role_required(*allowed_roles):
    """Decorator to enforce role-based access control (RBAC)."""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            if g.current_user['role'] not in allowed_roles:
                return jsonify({
                    'error': f"Access forbidden: role '{g.current_user['role']}' lacks permission for this action"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
