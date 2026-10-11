import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { BedDouble, CheckCircle2, UserCheck, AlertTriangle, Wrench, Plus, ArrowUpRight, LogOut } from 'lucide-react';

export const BedManagement = () => {
  const { role } = useAuth();
  const [beds, setBeds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedWard, setSelectedWard] = useState('');
  const [loading, setLoading] = useState(true);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [patients, setPatients] = useState([]);
  const [allocatePatientId, setAllocatePatientId] = useState('');
  const [admissionNotes, setAdmissionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [addBedModalOpen, setAddBedModalOpen] = useState(false);
  const [newBed, setNewBed] = useState({
    bed_number: '',
    ward: 'General',
    floor: '2nd Floor',
    status: 'Available',
    notes: 'Sanitized'
  });

  const wards = ['All', 'ICU', 'General', 'Emergency', 'Maternity', 'Pediatric'];

  const fetchBedsData = async () => {
    try {
      setLoading(true);
      const url = selectedWard && selectedWard !== 'All' ? `/beds?ward=${selectedWard}` : '/beds';
      const [bedsRes, summaryRes] = await Promise.all([
        api.get(url),
        api.get('/beds/summary')
      ]);
      setBeds(bedsRes.beds || []);
      setSummary(summaryRes.summary || null);
    } catch (err) {
      console.error('Error fetching bed management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    if (role === 'admin' || role === 'doctor') {
      try {
        const data = await api.get('/patients');
        setPatients(data.patients || []);
        if (data.patients?.length > 0 && !allocatePatientId) {
          setAllocatePatientId(data.patients[0].id);
        }
      } catch (err) {
        console.error('Error fetching patients for bed allocation:', err);
      }
    }
  };

  useEffect(() => {
    fetchBedsData();
  }, [selectedWard]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const openAllocateModal = (bed) => {
    setSelectedBed(bed);
    setAdmissionNotes('');
    setAllocateModalOpen(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed || !allocatePatientId) return;
    setActionLoading(true);
    try {
      await api.put(`/beds/${selectedBed.id}/allocate`, {
        patient_id: allocatePatientId,
        notes: admissionNotes || 'Admitted for clinical monitoring'
      });
      setAllocateModalOpen(false);
      fetchBedsData();
    } catch (err) {
      alert(err.message || 'Failed to allocate bed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischarge = async (bed) => {
    if (!window.confirm(`Discharge patient from Bed ${bed.bed_number}? Status will be reset to Available.`)) return;
    try {
      await api.put(`/beds/${bed.id}/discharge`, {});
      fetchBedsData();
    } catch (err) {
      alert(err.message || 'Failed to discharge bed.');
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    try {
      await api.post('/beds', newBed);
      setAddBedModalOpen(false);
      fetchBedsData();
      setNewBed({
        bed_number: '',
        ward: 'General',
        floor: '2nd Floor',
        status: 'Available',
        notes: 'Sanitized'
      });
    } catch (err) {
      alert(err.message || 'Failed to add bed.');
    }
  };

  const getBedStatusStyle = (st) => {
    switch (st) {
      case 'Available':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#065f46',
          badgeClass: 'badge-success',
          icon: CheckCircle2
        };
      case 'Occupied':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          color: '#991b1b',
          badgeClass: 'badge-danger',
          icon: UserCheck
        };
      case 'Maintenance':
        return {
          bg: '#f8fafc',
          border: '#cbd5e1',
          color: '#475569',
          badgeClass: 'badge-secondary',
          icon: Wrench
        };
      default:
        return {
          bg: '#ffffff',
          border: 'var(--border)',
          color: 'var(--text-primary)',
          badgeClass: 'badge-secondary',
          icon: BedDouble
        };
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Bed Management</h1>
          <p className="page-subtitle">Real-time bed occupancy across ICU, General, Emergency, and Specialty wards.</p>
        </div>

        {role === 'admin' && (
          <button onClick={() => setAddBedModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Add Bed Unit
          </button>
        )}
      </div>

      {/* Summary KPI strip */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ '--card-accent': '#0284c7' }}>
            <div className="stat-info">
              <div className="stat-label">Total Bed Capacity</div>
              <div className="stat-value">{summary.total_beds}</div>
              <div className="stat-trend">All hospital wards</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#10b981' }}>
            <div className="stat-info">
              <div className="stat-label">Available Beds</div>
              <div className="stat-value" style={{ color: '#059669' }}>{summary.available_beds}</div>
              <div className="stat-trend">Ready for admission</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#ef4444' }}>
            <div className="stat-info">
              <div className="stat-label">Occupied Beds</div>
              <div className="stat-value" style={{ color: '#dc2626' }}>{summary.occupied_beds}</div>
              <div className="stat-trend">Admitted patients</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#f59e0b' }}>
            <div className="stat-info">
              <div className="stat-label">Occupancy Rate</div>
              <div className="stat-value">{summary.occupancy_rate}%</div>
              <div className="stat-trend">{summary.maintenance_beds} beds in maintenance</div>
            </div>
          </div>
        </div>
      )}

      {/* Ward Filter Pills */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {wards.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWard(w === 'All' ? '' : w)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                backgroundColor: (selectedWard === '' && w === 'All') || selectedWard === w ? 'var(--primary)' : 'white',
                color: (selectedWard === '' && w === 'All') || selectedWard === w ? 'white' : 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {w} {w !== 'All' ? 'Ward' : 'Wards'}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Grid Display */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading hospital bed occupancy matrix...
          </div>
        ) : beds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No beds found for this ward.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {beds.map((b) => {
              const style = getBedStatusStyle(b.status);
              const StatusIcon = style.icon;

              return (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: style.bg,
                    border: `1.5px solid ${style.border}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '190px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {b.bed_number}
                      </span>
                      <span className={`badge ${style.badgeClass}`}>
                        <StatusIcon size={12} /> {b.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {b.ward} Ward • {b.floor}
                    </div>

                    {b.status === 'Occupied' && (
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontWeight: 700, color: '#991b1b' }}>
                          Patient: {b.patient_name || 'Assigned'}
                        </div>
                        {b.admitted_at && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Admitted: {b.admitted_at.split(' ')[0]}
                          </div>
                        )}
                        {b.notes && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Note: {b.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {b.status === 'Maintenance' && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {b.notes || 'Under maintenance / sterilization'}
                      </div>
                    )}

                    {b.status === 'Available' && (
                      <div style={{ fontSize: '0.8rem', color: '#065f46' }}>
                        ✓ Sanitized and prepped for admission
                      </div>
                    )}
                  </div>

                  {/* Actions for Admin / Doctor */}
                  {(role === 'admin' || role === 'doctor') && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${style.border}` }}>
                      {b.status === 'Available' && (
                        <button
                          onClick={() => openAllocateModal(b)}
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%' }}
                        >
                          <ArrowUpRight size={14} /> Allocate Bed
                        </button>
                      )}

                      {b.status === 'Occupied' && (
                        <button
                          onClick={() => handleDischarge(b)}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', color: '#991b1b', borderColor: '#fca5a5' }}
                        >
                          <LogOut size={14} /> Discharge Patient
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Allocate Bed Modal */}
      <Modal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        title={selectedBed ? `Allocate Bed ${selectedBed.bed_number} (${selectedBed.ward} Ward)` : 'Allocate Bed'}
      >
        <form onSubmit={handleAllocateSubmit}>
          <div className="form-group">
            <label className="form-label">Select Patient for Admission *</label>
            <select
              className="form-select"
              value={allocatePatientId}
              onChange={(e) => setAllocatePatientId(e.target.value)}
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.blood_group || 'Blood N/A'}) - ID #{p.id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Admission Reason / Ward Notes</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Inpatient cardiac observation, post-operative recovery, IV fluids protocol..."
              value={admissionNotes}
              onChange={(e) => setAdmissionNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAllocateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Allocating...' : 'Confirm Bed Admission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Bed Modal (Admin) */}
      <Modal
        isOpen={addBedModalOpen}
        onClose={() => setAddBedModalOpen(false)}
        title="Add Hospital Bed Unit"
      >
        <form onSubmit={handleAddBed}>
          <div className="form-group">
            <label className="form-label">Bed Identifier / Number *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ICU-104 or GEN-205"
              value={newBed.bed_number}
              onChange={(e) => setNewBed({ ...newBed, bed_number: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Ward Type *</label>
              <select
                className="form-select"
                value={newBed.ward}
                onChange={(e) => setNewBed({ ...newBed, ward: e.target.value })}
              >
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Emergency">Emergency</option>
                <option value="Maternity">Maternity</option>
                <option value="Pediatric">Pediatric</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Floor *</label>
              <input
                type="text"
                className="form-input"
                value={newBed.floor}
                onChange={(e) => setNewBed({ ...newBed, floor: e.target.value })}
                placeholder="e.g. 1st Floor"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setAddBedModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Bed
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
