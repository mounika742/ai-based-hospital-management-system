import os
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.database import init_db
from app.seed_data import seed_database

def create_app(config_class=Config):
    """Application factory for AI-Based Hospital Management System backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS for all frontend client requests
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Initialize SQLite database and seed if empty
    with app.app_context():
        init_db()
        seed_database(force=False)

    # Register API Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.patient_routes import patient_bp
    from app.routes.doctor_routes import doctor_bp
    from app.routes.appointment_routes import appointment_bp
    from app.routes.medical_record_routes import medical_record_bp
    from app.routes.bed_routes import bed_bp
    from app.routes.billing_routes import billing_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.ai_routes import ai_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(medical_record_bp)
    app.register_blueprint(bed_bp)
    app.register_blueprint(billing_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(ai_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'system': 'AI-Based Hospital Management System API',
            'version': '1.0.0'
        }), 200

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({'error': 'The requested endpoint or resource was not found'}), 404

    @app.errorhandler(500)
    def handle_internal_error(e):
        return jsonify({'error': 'An internal server error occurred', 'details': str(e)}), 500

    return app
