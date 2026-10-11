import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Users, Search, Eye, Plus, Calendar, FileText, Phone, Mail, Droplet, AlertTriangle } from 'lucide-react';

export const Patients = () => {
  const { role } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: '',
    email: '',
    password: 'password123',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'O+',
    address: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    role: 'patient'
  });
  const [formError, setFormError] = useState('');

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/patients?search=${encodeURIComponent(query)}` : '/patients';
      const data = await api.get(url);
      setPatients(data.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(search);
  }, [search]);

  const handleViewDetails = async (patientId) => {
    try {
      const data = await api.get(`/patients/${patientId}`);
      setSelectedPatient(data.patient);
      setDetailsModalOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load patient records');
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/auth/register', newPatient);
      setAddModalOpen(false);
      fetchPatients();
      setNewPatient({
        full_name: '',
        email: '',
        password: 'password123',
        phone: '',
        date_of_birth: '',
        gender: 'Male',
        blood_group: 'O+',
        address: '',
        allergies: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        role: 'patient'
      });
    } catch (err) {
      setFormError(err.message || 'Failed to create patient record.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Management</h1>
          <p className="page-subtitle">Directory of registered hospital patients, medical histories, and emergency contacts.</p>
        </div>

        {role === 'admin' && (
          <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Add New Patient
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search patients by name, email, phone, blood group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Patients Table Card */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading patient records...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No patient records match the search query.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Contact Info</th>
                  <th>Blood Group</th>
                  <th>Gender / DOB</th>
                  <th>Allergies</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{p.id}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Mail size={13} color="var(--text-muted)" /> {p.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Phone size={13} /> {p.phone || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-danger">
                        <Droplet size={11} /> {p.blood_group || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div>{p.gender}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOB: {p.date_of_birth || 'N/A'}</div>
                    </td>
                    <td>
                      {p.allergies && p.allergies.toLowerCase() !== 'none' ? (
                        <span style={{ fontSize: '0.825rem', color: '#b91c1c', fontWeight: 600 }}>
                          ⚠️ {p.allergies}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>None reported</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(p.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Eye size={14} /> Full Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedPatient ? `Patient Profile: ${selectedPatient.full_name}` : 'Patient Details'}
        maxWidth="750px"
      >
        {selectedPatient && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--bg-subtle)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontWeight: 600 }}>{selectedPatient.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
                <div style={{ fontWeight: 600 }}>{selectedPatient.phone || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blood Group</div>
                <div style={{ fontWeight: 700, color: '#ef4444' }}>{selectedPatient.blood_group || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency Contact</div>
                <div style={{ fontWeight: 600 }}>{selectedPatient.emergency_contact_name || 'N/A'}</div>
                <div style={{ fontSize: '0.75rem' }}>{selectedPatient.emergency_contact_phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Known Allergies</div>
                <div style={{ fontWeight: 600, color: '#b91c1c' }}>{selectedPatient.allergies || 'None'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Address</div>
                <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{selectedPatient.address || 'N/A'}</div>
              </div>
            </div>

            {/* Medical Records History */}
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={17} color="var(--primary)" /> Clinical Records & Diagnoses ({selectedPatient.medical_records?.length || 0})
            </h4>

            {selectedPatient.medical_records?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>No clinical notes logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {selectedPatient.medical_records?.map((rec) => (
                  <div key={rec.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{rec.diagnosis}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visit Date: {rec.visit_date}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                      Attending: {rec.doctor_name} ({rec.specialization})
                    </div>
                    {rec.prescription && (
                      <div style={{ fontSize: '0.825rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '4px', whiteSpace: 'pre-line', marginTop: '0.35rem' }}>
                        <strong>Rx:</strong> {rec.prescription}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Past Appointments */}
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={17} color="var(--secondary)" /> Appointments Timeline ({selectedPatient.appointments?.length || 0})
            </h4>

            {selectedPatient.appointments?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No appointment history.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedPatient.appointments?.slice(0, 5).map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div>
                      <strong>{a.doctor_name}</strong> ({a.department})
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.reason || 'Consultation'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>{a.appointment_date} at {a.appointment_time}</div>
                      <span className="badge badge-info">{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Patient Modal (Admin) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Patient Record"
      >
        <form onSubmit={handleCreatePatient}>
          {formError && <div className="alert alert-danger">{formError}</div>}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={newPatient.full_name}
              onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={newPatient.date_of_birth}
                onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                className="form-select"
                value={newPatient.blood_group}
                onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Allergies</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Penicillin or None"
              value={newPatient.allergies}
              onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Patient
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
