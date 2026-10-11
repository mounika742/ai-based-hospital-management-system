import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { FileText, Plus, Calendar, User, Stethoscope, Printer, Pill, FlaskConical, Search } from 'lucide-react';

export const MedicalRecords = () => {
  const { role, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [newRecord, setNewRecord] = useState({
    patient_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    prescription: '',
    treatment_plan: '',
    lab_tests_recommended: '',
    follow_up_date: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await api.get('/medical-records');
      setRecords(data.records || []);
    } catch (err) {
      console.error('Error fetching medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    if (role === 'doctor' || role === 'admin') {
      try {
        const data = await api.get('/patients');
        setPatients(data.patients || []);
        if (data.patients?.length > 0 && !newRecord.patient_id) {
          setNewRecord(prev => ({ ...prev, patient_id: data.patients[0].id }));
        }
      } catch (err) {
        console.error('Error loading patients list:', err);
      }
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchPatients();
  }, []);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/medical-records', newRecord);
      setAddModalOpen(false);
      fetchRecords();
      setNewRecord({
        patient_id: patients[0]?.id || '',
        visit_date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        prescription: '',
        treatment_plan: '',
        lab_tests_recommended: '',
        follow_up_date: ''
      });
    } catch (err) {
      setFormError(err.message || 'Failed to save medical record.');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(r =>
    (r.diagnosis || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.doctor_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Electronic Medical Records (EMR)</h1>
          <p className="page-subtitle">Clinical consultations, diagnoses, prescription regimens, and follow-up schedules.</p>
        </div>

        {(role === 'doctor' || role === 'admin') && (
          <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> New Clinical Record
          </button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search records by diagnosis, patient name, or attending doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading electronic health records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No medical records found.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visit Date</th>
                  <th>Patient</th>
                  <th>Attending Specialist</th>
                  <th>Primary Diagnosis</th>
                  <th>Follow-Up Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.visit_date}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blood: {r.blood_group || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.doctor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.specialization} ({r.department})</div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: '#0369a1' }}>{r.diagnosis}</div>
                      {r.prescription && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Rx: {r.prescription.split('\n')[0]}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.follow_up_date ? (
                        <span className="badge badge-info">{r.follow_up_date}</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>As needed</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setViewModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <FileText size={14} /> View Rx
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Prescription / Record Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Clinical Consultation Summary & Prescription"
        maxWidth="700px"
      >
        {selectedRecord && (
          <div style={{ border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#ffffff' }}>
            {/* Header info */}
            <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>MediPulse Hospital</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Outpatient Clinical Consultation Summary</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedRecord.doctor_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedRecord.specialization}</div>
              </div>
            </div>

            {/* Patient & Date Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Patient: </span>
                <strong>{selectedRecord.patient_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Blood Group: </span>
                <strong>{selectedRecord.blood_group || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Date: </span>
                <strong>{selectedRecord.visit_date}</strong>
              </div>
            </div>

            {/* Diagnosis */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Clinical Diagnosis</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0369a1', marginTop: '0.2rem' }}>
                {selectedRecord.diagnosis}
              </div>
            </div>

            {/* Prescription */}
            {selectedRecord.prescription && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Pill size={14} color="var(--primary)" /> Medication Regimen (Rx)
                </div>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', whiteSpace: 'pre-line', marginTop: '0.35rem', fontFamily: 'monospace' }}>
                  {selectedRecord.prescription}
                </div>
              </div>
            )}

            {/* Treatment plan */}
            {selectedRecord.treatment_plan && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Treatment Plan & Patient Care Advice</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {selectedRecord.treatment_plan}
                </div>
              </div>
            )}

            {/* Labs */}
            {selectedRecord.lab_tests_recommended && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FlaskConical size={14} color="var(--secondary)" /> Recommended Diagnostics / Labs
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {selectedRecord.lab_tests_recommended}
                </div>
              </div>
            )}

            {/* Follow up */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
              <div>
                <strong>Next Follow-Up: </strong>
                {selectedRecord.follow_up_date || 'As required / SOS'}
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Printer size={14} /> Print Prescription
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Record Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Clinical Medical Record"
      >
        <form onSubmit={handleAddRecord}>
          {formError && <div className="alert alert-danger">{formError}</div>}

          <div className="form-group">
            <label className="form-label">Select Patient *</label>
            <select
              className="form-select"
              value={newRecord.patient_id}
              onChange={(e) => setNewRecord({ ...newRecord, patient_id: e.target.value })}
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.blood_group || 'Blood N/A'}) - ID #{p.id}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Visit Date *</label>
              <input
                type="date"
                className="form-input"
                value={newRecord.visit_date}
                onChange={(e) => setNewRecord({ ...newRecord, visit_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Next Follow-Up Date</label>
              <input
                type="date"
                className="form-input"
                value={newRecord.follow_up_date}
                onChange={(e) => setNewRecord({ ...newRecord, follow_up_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Diagnosis *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Acute Bronchitis, Type 2 Diabetes Management"
              value={newRecord.diagnosis}
              onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prescription (Rx) & Dosages</label>
            <textarea
              className="form-textarea"
              placeholder="1. Amoxicillin 500mg - 1 tab tid x 5 days&#10;2. Paracetamol 650mg - 1 tab prn for fever"
              value={newRecord.prescription}
              onChange={(e) => setNewRecord({ ...newRecord, prescription: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Treatment Plan & Advice</label>
            <textarea
              className="form-textarea"
              placeholder="Adequate hydration, avoidance of cold beverages, monitor temperature daily..."
              value={newRecord.treatment_plan}
              onChange={(e) => setNewRecord({ ...newRecord, treatment_plan: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Diagnostic Tests Recommended</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CBC, Chest X-Ray PA view, Fasting Blood Sugar"
              value={newRecord.lab_tests_recommended}
              onChange={(e) => setNewRecord({ ...newRecord, lab_tests_recommended: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Medical Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
