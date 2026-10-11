import React from 'react';

export const BedOccupancyChart = ({ wards = [] }) => {
  if (!wards || wards.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No bed data available</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {wards.map((w) => {
        const total = w.total || 0;
        const occupied = w.occupied || 0;
        const available = w.available || 0;
        const occPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

        return (
          <div key={w.ward}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{w.ward} Ward</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {occupied} / {total} Occupied ({occPct}%)
              </span>
            </div>
            <div style={{
              height: '10px',
              backgroundColor: '#e2e8f0',
              borderRadius: '999px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div
                style={{
                  width: `${occPct}%`,
                  backgroundColor: occPct > 80 ? '#ef4444' : occPct > 50 ? '#f59e0b' : '#0284c7',
                  transition: 'width 0.4s ease'
                }}
                title={`${occupied} Occupied`}
              />
              <div
                style={{
                  width: `${100 - occPct}%`,
                  backgroundColor: '#10b981',
                  transition: 'width 0.4s ease'
                }}
                title={`${available} Available`}
              />
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: '#0284c7', borderRadius: '2px' }}></span>
          Occupied Beds
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
          Available Beds
        </div>
      </div>
    </div>
  );
};

export const DepartmentDistributionChart = ({ departments = [] }) => {
  if (!departments || departments.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No department data available</div>;
  }

  const maxAppointments = Math.max(...departments.map(d => d.appointment_count || 1), 1);

  const colors = ['#0284c7', '#0f766e', '#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {departments.map((dept, idx) => {
        const count = dept.appointment_count || 0;
        const pct = Math.round((count / maxAppointments) * 100);
        const barColor = colors[idx % colors.length];

        return (
          <div key={dept.department}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.825rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.department}</span>
              <span style={{ fontWeight: 700, color: barColor }}>{count} consultations</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#f1f5f9',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
