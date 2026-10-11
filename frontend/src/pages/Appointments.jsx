import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle, User, MapPin } from 'lucide-react';

export const Appointments = ({ preselectedDoctorId = null }) => {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    doctor_id: preselectedDoctorId || '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00',
    reason: 'Regular Health Checkup',
    symptoms: '',
    notes: ''
  });
  const [bookError, setBookError] = useState('');
  const [bookLoading, setBookLoading] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/appointments?status=${statusFilter}` : '/appointments';
      const data = await api.get(url);
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await api.get('/doctors');
      setDoctors(data.doctors || []);
      if (preselectedDoctorId) {
        setBookingData(prev => ({ ...prev, doctor_id: preselectedDoctorId }));
        setBookModalOpen(true);
      } else if (data.doctors && data.doctors.length > 0 && !bookingData.doctor_id) {
        setBookingData(prev => ({ ...prev, doctor_id: data.doctors[0].id }));
      }
    } catch (err) {
      console.error('Error loading doctors for booking:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [preselectedDoctorId]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookError('');
    setBookLoading(true);

    try {
      await api.post('/appointments', bookingData);
      setBookModalOpen(false);
      fetchAppointments();
      setBookingData({
        doctor_id: doctors[0]?.id || '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00',
        reason: 'Regular Health Checkup',
        symptoms: '',
        notes: ''
      });
    } catch (err) {
      setBookError(err.message || 'Failed to book appointment.');
    } finally {
      setBookLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) return;
    try {
      await api.put(`/appointments/${appId}`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  const renderBadge = (st) => {
    switch (st) {
      case 'Confirmed': return <span className="badge badge-success">{st}</span>;
      case 'Completed': return <span className="badge badge-info">{st}</span>;
      case 'Scheduled': return <span className="badge badge-warning">{st}</span>;
      case 'Cancelled': return <span className="badge badge-danger">{st}</span>;
      default: return <span className="badge badge-secondary">{st}</span>;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointment Management</h1>
          <p className="page-subtitle">Schedule, view, confirm, reschedule, or cancel patient appointments.</p>
        </div>

        <button onClick={() => setBookModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'Confirmed', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                backgroundColor: statusFilter === st ? 'var(--primary)' : 'white',
                color: statusFilter === st ? 'white' : 'var(--text-secondary)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {st === '' ? 'All Appointments' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading appointment schedule...
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No appointments found for this filter.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor & Department</th>
                  <th>Date & Time</th>
                  <th>Reason / Symptoms</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{a.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.patient_phone || a.patient_email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.doctor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.department} • ₹{a.consultation_fee}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.appointment_date}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{a.appointment_time}</div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ fontWeight: 500 }}>{a.reason || 'General Consultation'}</div>
                      {a.symptoms && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Symptoms: {a.symptoms}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={13} color="var(--text-muted)" /> {a.room_number || 'OPD'}
                      </span>
                    </td>
                    <td>{renderBadge(a.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {a.status !== 'Completed' && a.status !== 'Cancelled' && (
                          <>
                            {(role === 'doctor' || role === 'admin') && (
                              <button
                                onClick={() => handleUpdateStatus(a.id, 'Completed')}
                                className="btn btn-success btn-sm"
                                title="Mark Completed"
                              >
                                <CheckCircle size={13} /> Complete
                              </button>
                            )}

                            <button
                              onClick={() => handleUpdateStatus(a.id, 'Cancelled')}
                              className="btn btn-danger btn-sm"
                              title="Cancel Appointment"
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Schedule Hospital Appointment"
      >
        <form onSubmit={handleBookSubmit}>
          {bookError && <div className="alert alert-danger">{bookError}</div>}

          <div className="form-group">
            <label className="form-label">Select Specialist / Doctor *</label>
            <select
              className="form-select"
              value={bookingData.doctor_id}
              onChange={(e) => setBookingData({ ...bookingData, doctor_id: e.target.value })}
              required
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.department} - {d.specialization}) — ₹{d.consultation_fee}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Appointment Date *</label>
              <input
                type="date"
                className="form-input"
                value={bookingData.appointment_date}
                onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time Slot *</label>
              <select
                className="form-select"
                value={bookingData.appointment_time}
                onChange={(e) => setBookingData({ ...bookingData, appointment_time: e.target.value })}
                required
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>{ts}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Chief Complaint / Reason *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Follow-up consultation, High blood pressure, Knee pain"
              value={bookingData.reason}
              onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Symptoms Observed (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Describe any specific symptoms, fever duration, aches, or previous notes..."
              value={bookingData.symptoms}
              onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
            />
          </div>

          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem'
          }}>
            ℹ️ A formal invoice covering the consultation fee will be generated automatically and can be settled online or at the reception desk.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={() => setBookModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={bookLoading}>
              {bookLoading ? 'Booking Slot...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
