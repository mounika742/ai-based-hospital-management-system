import sys
import os
import unittest
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.database import query_db

class HospitalApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_check(self):
        """Test API health endpoint."""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')

    def test_02_admin_login(self):
        """Test Admin login and JWT receipt."""
        response = self.client.post('/api/auth/login', json={
            'email': 'admin@hospital.com',
            'password': 'admin123',
            'role': 'admin'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'admin')

    def test_03_doctor_login(self):
        """Test Doctor login."""
        response = self.client.post('/api/auth/login', json={
            'email': 'dr.sarah.patel@hospital.com',
            'password': 'doctor123',
            'role': 'doctor'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('doctor_id', data['user'])

    def test_04_patient_login(self):
        """Test Patient login."""
        response = self.client.post('/api/auth/login', json={
            'email': 'john.doe@hospital.com',
            'password': 'patient123',
            'role': 'patient'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('patient_id', data['user'])

    def test_05_ai_symptom_checker_emergency(self):
        """Test AI Symptom Assistant emergency red-flag detection."""
        response = self.client.post('/api/ai/symptom-check', json={
            'symptoms': 'I have crushing chest pain radiating to left arm and severe shortness of breath',
            'severity': 'severe'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()['result']
        self.assertTrue(data['is_emergency'])
        self.assertIn('Emergency', data['recommended_department'])
        self.assertIn('DISCLAIMER', data['disclaimer'])

    def test_06_ai_symptom_checker_cardiology(self):
        """Test AI Symptom Assistant routine guidance and department suggestion."""
        response = self.client.post('/api/ai/symptom-check', json={
            'symptoms': 'Heart palpitations and occasional high blood pressure',
            'severity': 'moderate'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()['result']
        self.assertFalse(data['is_emergency'])
        self.assertEqual(data['recommended_department'], 'Cardiology')
        self.assertIn('DISCLAIMER', data['disclaimer'])

    def test_07_ai_faq_chat(self):
        """Test AI Hospital FAQ chatbot."""
        response = self.client.post('/api/ai/faq-chat', json={
            'query': 'What are the visiting hours for the hospital?'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()['response']
        self.assertIn('Visiting Hours', data['topic'])
        self.assertIn('10:00 AM', data['answer'])

    def test_08_bed_summary(self):
        """Test bed management summary metrics with Admin token."""
        # Get admin token
        auth_resp = self.client.post('/api/auth/login', json={
            'email': 'admin@hospital.com',
            'password': 'admin123'
        })
        token = auth_resp.get_json()['token']

        response = self.client.get('/api/beds/summary', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()['summary']
        self.assertGreater(data['total_beds'], 0)
        self.assertIn('occupancy_rate', data)

    def test_09_dashboard_stats(self):
        """Test Admin dashboard metrics."""
        auth_resp = self.client.post('/api/auth/login', json={
            'email': 'admin@hospital.com',
            'password': 'admin123'
        })
        token = auth_resp.get_json()['token']

        response = self.client.get('/api/dashboard/stats', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['role'], 'admin')
        self.assertIn('metrics', data)
        self.assertIn('charts', data)

    def test_10_appointment_booking_and_payment(self):
        """Test Patient appointment booking and subsequent bill generation."""
        # Login as patient
        auth_resp = self.client.post('/api/auth/login', json={
            'email': 'john.doe@hospital.com',
            'password': 'patient123'
        })
        token = auth_resp.get_json()['token']

        import time
        unique_date = f"2026-12-{(int(time.time()) % 25) + 1:02d}"
        unique_time = f"{(int(time.time()) % 6) + 10:02d}:{(int(time.time()) % 50):02d}"

        # Book appointment with doctor 1
        book_resp = self.client.post('/api/appointments', headers={
            'Authorization': f'Bearer {token}'
        }, json={
            'doctor_id': 1,
            'appointment_date': unique_date,
            'appointment_time': unique_time,
            'reason': 'Routine heart checkup',
            'symptoms': 'Mild palpitations'
        })
        self.assertEqual(book_resp.status_code, 201)
        app_id = book_resp.get_json()['appointment']['id']

        # Verify bill was generated for patient
        bills_resp = self.client.get('/api/billing', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(bills_resp.status_code, 200)
        bills = bills_resp.get_json()['bills']
        self.assertGreater(len(bills), 0)

        # Pay the first pending bill
        pending_bill = next((b for b in bills if b['payment_status'] == 'Pending'), None)
        if pending_bill:
            pay_resp = self.client.put(f"/api/billing/{pending_bill['id']}/pay", headers={
                'Authorization': f'Bearer {token}'
            }, json={'payment_method': 'Online'})
            self.assertEqual(pay_resp.status_code, 200)
            self.assertEqual(pay_resp.get_json()['bill']['payment_status'], 'Paid')

        # Cleanup test appointment to keep DB pristine
        from app.database import execute_db
        execute_db("DELETE FROM appointments WHERE id = ?", (app_id,))

if __name__ == '__main__':
    unittest.main()

