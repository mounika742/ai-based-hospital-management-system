import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { BedOccupancyChart, DepartmentDistributionChart } from '../components/Charts';
import {
  Users,
  UserCheck,
  Calendar,
  BedDouble,
  IndianRupee,
  Activity,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const Dashboard = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/stats');
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading hospital dashboard metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // Helper for status badge
  const renderStatusBadge = (st) => {
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
      {/* Top Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">
            {role === 'admin' && 'Real-time overview of hospital operational metrics, bed capacity, and revenue.'}
            {role === 'doctor' && 'Your clinical schedule, outpatient agenda, and patient records.'}
            {role === 'patient' && 'Your health profile, upcoming appointments, and clinical records.'}
          </p>
        </div>

        {/* Quick action pill button */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {role === 'patient' && (
            <button
              onClick={() => onNavigate('symptom-checker')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={16} /> AI Symptom Assistant
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={() => onNavigate('beds')}
              className="btn btn-primary"
            >
              <BedDouble size={16} /> Manage Bed Allocations
            </button>
          )}
        </div>
      </div>

      {/* ADMIN DASHBOARD VIEW */}
      {role === 'admin' && dashboardData?.metrics && (
        <>
          <div className="stats-grid">
            <StatCard
              title="Total Patients"
              value={dashboardData.metrics.total_patients}
              subtitle="Registered patient records"
              icon={Users}
              color="#0284c7"
              bgLight="#e0f2fe"
            />
            <StatCard
              title="Active Doctors"
              value={dashboardData.metrics.total_doctors}
              subtitle="Specialists across departments"
              icon={UserCheck}
              color="#0f766e"
              bgLight="#ccfbf1"
            />
            <StatCard
              title="Today's Appointments"
              value={dashboardData.metrics.today_appointments}
              subtitle={`${dashboardData.metrics.total_appointments} total scheduled`}
              icon={Calendar}
              color="#4f46e5"
              bgLight="#e0e7ff"
            />
            <StatCard
              title="Hospital Bed Occupancy"
              value={`${dashboardData.metrics.occupancy_rate}%`}
              subtitle={`${dashboardData.metrics.occupied_beds} occupied / ${dashboardData.metrics.total_beds} beds`}
              icon={BedDouble}
              color="#f59e0b"
              bgLight="#fef3c7"
            />
            <StatCard
              title="Collected Revenue"
              value={`₹${(dashboardData.metrics.total_revenue || 0).toLocaleString('en-IN')}`}
              subtitle="Paid patient invoices"
              icon={IndianRupee}
              color="#10b981"
              bgLight="#d1fae5"
            />
            <StatCard
              title="Pending Receivables"
              value={`₹${(dashboardData.metrics.pending_revenue || 0).toLocaleString('en-IN')}`}
              subtitle="Awaiting payment settlement"
              icon={IndianRupee}
              color="#ef4444"
              bgLight="#fee2e2"
            />
          </div>

          {/* Visual Analytics Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <BedDouble size={20} color="var(--primary)" /> Bed Capacity by Ward
                </h3>
                <button onClick={() => onNavigate('beds')} className="btn btn-secondary btn-sm">
                  View All Beds
                </button>
              </div>
              <BedOccupancyChart wards={dashboardData.charts?.ward_distribution} />
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Activity size={20} color="var(--accent)" /> Department Workload Breakdown
                </h3>
                <button onClick={() => onNavigate('doctors')} className="btn btn-secondary btn-sm">
                  Doctors Roster
                </button>
              </div>
              <DepartmentDistributionChart departments={dashboardData.charts?.department_distribution} />
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={20} color="var(--secondary)" /> Recent Consultations & Appointments
              </h3>
              <button onClick={() => onNavigate('appointments')} className="btn btn-secondary btn-sm">
                View All Appointments
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor & Department</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_appointments?.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.patient_name}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.doctor_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.department}</div>
                      </td>
                      <td>
                        <div>{app.appointment_date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.appointment_time}</div>
                      </td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.reason || 'General Checkup'}
                      </td>
                      <td>{renderStatusBadge(app.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DOCTOR DASHBOARD VIEW */}
      {role === 'doctor' && dashboardData?.metrics && (
        <>
          <div className="stats-grid">
            <StatCard
              title="Today's Appointments"
              value={dashboardData.metrics.today_appointments}
              subtitle="Scheduled OPD slots today"
              icon={Calendar}
              color="#0284c7"
              bgLight="#e0f2fe"
            />
            <StatCard
              title="Total Consultations"
              value={dashboardData.metrics.total_appointments}
              subtitle="All-time patient visits"
              icon={Users}
              color="#0f766e"
              bgLight="#ccfbf1"
            />
            <StatCard
              title="Completed Visits"
              value={dashboardData.metrics.completed_appointments}
              subtitle="Successfully consulted"
              icon={CheckCircle}
              color="#10b981"
              bgLight="#d1fae5"
            />
            <StatCard
              title="Clinical Records Authored"
              value={dashboardData.metrics.medical_records_authored}
              subtitle="Prescriptions & notes"
              icon={FileText}
              color="#4f46e5"
              bgLight="#e0e7ff"
            />
          </div>

          {/* Doctor Agenda Today */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Clock size={20} color="var(--primary)" /> Today's Appointment Roster
              </h3>
              <button onClick={() => onNavigate('appointments')} className="btn btn-secondary btn-sm">
                Full Calendar
              </button>
            </div>

            {dashboardData.today_appointments?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No appointments scheduled for today.
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Patient Name</th>
                      <th>Blood Group</th>
                      <th>Contact</th>
                      <th>Symptoms / Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.today_appointments?.map((app) => (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{app.appointment_time}</td>
                        <td style={{ fontWeight: 600 }}>{app.patient_name}</td>
                        <td><span className="badge badge-info">{app.blood_group || 'N/A'}</span></td>
                        <td>{app.patient_phone || 'N/A'}</td>
                        <td>{app.reason || app.symptoms || 'General Consultation'}</td>
                        <td>{renderStatusBadge(app.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* PATIENT DASHBOARD VIEW */}
      {role === 'patient' && dashboardData?.metrics && (
        <>
          {dashboardData.assigned_bed && (
            <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BedDouble size={24} color="#92400e" />
                <div>
                  <strong>Currently Admitted: Bed {dashboardData.assigned_bed.bed_number}</strong> ({dashboardData.assigned_bed.ward} Ward, {dashboardData.assigned_bed.floor})
                  <div style={{ fontSize: '0.8rem', color: '#78350f' }}>Notes: {dashboardData.assigned_bed.notes}</div>
                </div>
              </div>
              <button onClick={() => onNavigate('beds')} className="btn btn-sm btn-secondary">
                View Ward
              </button>
            </div>
          )}

          <div className="stats-grid">
            <StatCard
              title="Upcoming Appointments"
              value={dashboardData.metrics.upcoming_appointments}
              subtitle="Confirmed consultations"
              icon={Calendar}
              color="#0284c7"
              bgLight="#e0f2fe"
            />
            <StatCard
              title="Medical Records"
              value={dashboardData.metrics.medical_records_count}
              subtitle="Prescriptions and diagnoses"
              icon={FileText}
              color="#0f766e"
              bgLight="#ccfbf1"
            />
            <StatCard
              title="Pending Invoices"
              value={`₹${(dashboardData.metrics.pending_bills_amount || 0).toLocaleString('en-IN')}`}
              subtitle="Outstanding payments"
              icon={IndianRupee}
              color="#f59e0b"
              bgLight="#fef3c7"
            />
            <StatCard
              title="Admitted Bed"
              value={dashboardData.metrics.admitted_bed}
              subtitle="Inpatient admission status"
              icon={BedDouble}
              color="#4f46e5"
              bgLight="#e0e7ff"
            />
          </div>

          {/* Quick AI & Booking banner for patient */}
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Sparkles size={20} color="#e0f2fe" />
                <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: 800 }}>Feeling Unwell? Consult AI Symptom Assistant</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#e0f2fe', maxWidth: '600px' }}>
                Describe your symptoms to receive instant educational guidance, triage priority assessment, and recommended hospital departments.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => onNavigate('symptom-checker')}
                style={{
                  backgroundColor: 'white',
                  color: '#0284c7',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Analyze Symptoms Now
              </button>
              <button
                onClick={() => onNavigate('appointments')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Book Appointment
              </button>
            </div>
          </div>

          {/* Upcoming Appointments Table */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={20} color="var(--primary)" /> Your Upcoming Appointments
              </h3>
              <button onClick={() => onNavigate('appointments')} className="btn btn-secondary btn-sm">
                Book Another
              </button>
            </div>

            {dashboardData.upcoming_appointments?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                You have no upcoming appointments scheduled.
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty & Department</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.upcoming_appointments?.map((app) => (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 600 }}>{app.doctor_name}</td>
                        <td>
                          <div>{app.specialization}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.department}</div>
                        </td>
                        <td>{app.appointment_date}</td>
                        <td style={{ fontWeight: 700 }}>{app.appointment_time}</td>
                        <td>{app.room_number || 'OPD'}</td>
                        <td>{renderStatusBadge(app.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
