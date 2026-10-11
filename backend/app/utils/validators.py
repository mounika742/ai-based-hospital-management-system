import re
from datetime import datetime

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

def validate_email(email: str) -> bool:
    """Check if email matches basic valid pattern."""
    if not email or not isinstance(email, str):
        return False
    return bool(re.match(EMAIL_REGEX, email.strip()))

def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength (at least 6 characters)."""
    if not password or not isinstance(password, str):
        return False, "Password cannot be empty."
    if len(password) < 6:
        return False, "Password must be at least 6 characters long."
    return True, ""

def validate_date(date_str: str) -> bool:
    """Validate date in YYYY-MM-DD format."""
    if not date_str:
        return False
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def validate_time(time_str: str) -> bool:
    """Validate time in HH:MM format."""
    if not time_str:
        return False
    try:
        datetime.strptime(time_str, '%H:%M')
        return True
    except ValueError:
        return False

def validate_required_fields(data: dict, fields: list) -> list[str]:
    """Check for missing or empty required fields in data dictionary."""
    missing = []
    for field in fields:
        if field not in data or data[field] is None:
            missing.append(field)
        elif isinstance(data[field], str) and not data[field].strip():
            missing.append(field)
    return missing
