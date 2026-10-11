import os
import sys

# Ensure backend root is on Python module search path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.config import Config

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Hospital Management System Backend API starting on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
