import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { UserCheck, Search, Plus, Calendar, Clock, MapPin, IndianRupee, Award } from 'lucide-react';

export const Doctors = ({ onBookDoctor }) => {
  const { role } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    full_name: '',
    email: '',
    password: 'doctor123',
    phone: '',
    specialization: 'Cardiologist',
    department: 'Cardiology',
    qualification: 'MD, FACC',
    experience_years: 10,
    consultation_fee: 800.0,
    room_number: 'OPD 205',
    available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    available_time_start: '09:00',
    available_time_end: '17:00'
  });
  const [formError, setFormError] = useState('');

  const fetchDepartments = async () => {
    try {
      const data = await api.get('/doctors/departments');
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      let query = [];
      if (selectedDept) query.push(`department=${encodeURIComponent(selectedDept)}`);
      if (search) query.push(`search=${encodeURIComponent(search)}`);
      const qStr = query.length > 0 ? `?${query.join('&')}` : '';
      const data = await api.get(`/doctors${qStr}`);
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedDept, search]);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/doctors', newDoctor);
      setAddModalOpen(false);
      fetchDoctors();
      fetchDepartments();
    } catch (err) {
      setFormError(err.message || 'Failed to add doctor profile.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Management & Availability</h1>
          <p className="page-subtitle">Medical specialists, departments, OPD room schedules, and consultation fees.</p>
        </div>

        {role === 'admin' && (
          <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Add Specialist
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
            placeholder="Search by doctor name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Department Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedDept('')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: selectedDept === '' ? 'var(--primary)' : 'white',
              color: selectedDept === '' ? 'white' : 'var(--text-secondary)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            All Departments
          </button>
          {departments.map((d) => (
            <button
              key={d.department}
              onClick={() => setSelectedDept(d.department)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                backgroundColor: selectedDept === d.department ? 'var(--primary)' : 'white',
                color: selectedDept === d.department ? 'white' : 'var(--text-secondary)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {d.department} ({d.doctor_count})
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading specialists roster...
        </div>
      ) : doctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No doctors found for the selected department or search term.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {doctors.map((doc) => (
            <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {doc.full_name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                    {doc.specialization}
                  </div>
                </div>
                <span className="badge badge-info">{doc.department}</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={14} /> {doc.qualification} • {doc.experience_years} years experience
              </div>

              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Clock size={14} color="var(--primary)" />
                  <span>
                    <strong>Hours:</strong> {doc.available_time_start} - {doc.available_time_end}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} color="var(--primary)" />
                  <span>
                    <strong>Days:</strong> {doc.available_days?.split(',').join(', ')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} /> Room: <strong>{doc.room_number || 'OPD'}</strong>
                  </span>
                  <span style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.9rem' }}>
                    ₹{doc.consultation_fee} / visit
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => onBookDoctor && onBookDoctor(doc.id)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Calendar size={14} /> Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal (Admin) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Hospital Specialist"
      >
        <form onSubmit={handleAddDoctor}>
          {formError && <div className="alert alert-danger">{formError}</div>}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={newDoctor.full_name}
              onChange={(e) => setNewDoctor({ ...newDoctor, full_name: e.target.value })}
              placeholder="e.g. Dr. Emily Watson"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                value={newDoctor.password}
                onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={newDoctor.department}
                onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Specialization *</label>
              <input
                type="text"
                className="form-input"
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                placeholder="e.g. Pediatrician"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <input
                type="number"
                className="form-input"
                value={newDoctor.consultation_fee}
                onChange={(e) => setNewDoctor({ ...newDoctor, consultation_fee: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">OPD Room</label>
              <input
                type="text"
                className="form-input"
                value={newDoctor.room_number}
                onChange={(e) => setNewDoctor({ ...newDoctor, room_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input
                type="number"
                className="form-input"
                value={newDoctor.experience_years}
                onChange={(e) => setNewDoctor({ ...newDoctor, experience_years: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Doctor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
