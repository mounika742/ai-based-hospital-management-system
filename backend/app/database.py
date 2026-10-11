import sqlite3
import os
from contextlib import contextmanager
from app.config import Config

def get_db_connection():
    """Establish and return a SQLite database connection with row factory."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    """Context manager for handling database operations safely."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def query_db(query, args=(), one=False):
    """Convenience helper to query the database and return dictionaries."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, args)
        rv = cur.fetchall()
        cur.close()
        if one:
            return dict(rv[0]) if rv else None
        return [dict(row) for row in rv]

def execute_db(query, args=()):
    """Convenience helper to execute an INSERT/UPDATE/DELETE query and return lastrowid / rowcount."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, args)
        last_id = cur.lastrowid
        row_count = cur.rowcount
        cur.close()
        return {'last_id': last_id, 'row_count': row_count}

def init_db():
    """Initializes tables in the SQLite database."""
    schema = """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'patient')),
        full_name TEXT NOT NULL,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        specialization TEXT NOT NULL,
        department TEXT NOT NULL,
        qualification TEXT,
        experience_years INTEGER DEFAULT 0,
        consultation_fee REAL DEFAULT 500.0,
        room_number TEXT,
        available_days TEXT DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
        available_time_start TEXT DEFAULT '09:00',
        available_time_end TEXT DEFAULT '17:00',
        status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'On Leave', 'Inactive')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        date_of_birth TEXT,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
        blood_group TEXT,
        address TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        allergies TEXT,
        medical_history_summary TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        reason TEXT,
        symptoms TEXT,
        status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_id INTEGER,
        visit_date TEXT NOT NULL,
        diagnosis TEXT NOT NULL,
        prescription TEXT,
        treatment_plan TEXT,
        lab_tests_recommended TEXT,
        follow_up_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS hospital_beds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bed_number TEXT UNIQUE NOT NULL,
        ward TEXT NOT NULL CHECK(ward IN ('General', 'ICU', 'Emergency', 'Maternity', 'Pediatric')),
        floor TEXT NOT NULL,
        status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Occupied', 'Maintenance')),
        current_patient_id INTEGER,
        admitted_at TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS billing_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number TEXT UNIQUE NOT NULL,
        patient_id INTEGER NOT NULL,
        appointment_id INTEGER,
        total_amount REAL NOT NULL,
        tax_amount REAL DEFAULT 0.0,
        discount_amount REAL DEFAULT 0.0,
        net_amount REAL NOT NULL,
        payment_status TEXT DEFAULT 'Pending' CHECK(payment_status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
        payment_method TEXT,
        description TEXT,
        issued_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        paid_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
    );
    """
    
    # Ensure database directory exists
    db_dir = os.path.dirname(Config.DATABASE_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    with get_db() as conn:
        conn.executescript(schema)
