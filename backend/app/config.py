import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the backend directory
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / '.env')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-key-change-me')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))
    DATABASE_PATH = os.getenv('DATABASE_PATH', str(backend_dir / 'hospital.db'))
    
    # If DATABASE_PATH is relative, make it absolute relative to backend_dir
    if not os.path.isabs(DATABASE_PATH):
        DATABASE_PATH = str(backend_dir / DATABASE_PATH)
        
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
        if origin.strip()
    ]
    PORT = int(os.getenv('PORT', '5000'))
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'
